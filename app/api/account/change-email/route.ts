import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { customerId,accountJson,accountFailure,AccountError,privateHeaders as headers } from "@/lib/account/api";
import { emailChangeInput } from "@/lib/account/profile";
import { permitAttempt,createSecret,tokenHash,accountLink,sendAccountEmail } from "@/lib/account/security";
export async function POST(request:Request) {
  let issuedId:string|undefined;
  try {
    const id=await customerId(), parsed=emailChangeInput.safeParse(await accountJson(request));
    if(!parsed.success)throw new AccountError("Email baru dan password saat ini wajib diisi.",422);
    if(!process.env.RESEND_API_KEY||!process.env.ACCOUNT_EMAIL_FROM||!(process.env.ACCOUNT_APP_URL||process.env.NEXTAUTH_URL))throw new AccountError("Pengiriman verifikasi email belum tersedia.",503);
    if(!await permitAttempt("change-email-account",id,5,60))throw new AccountError("Terlalu sering mengubah email. Coba lagi nanti.",429);
    const account=await prisma.customerAccount.findUniqueOrThrow({where:{customerId:id}});
    if(!await bcrypt.compare(parsed.data.password,account.passwordHash))throw new AccountError("Password saat ini tidak sesuai.",422);
    if(parsed.data.email===account.email)throw new AccountError("Email baru masih sama dengan email saat ini.",422);
    if(await prisma.customerAccount.findUnique({where:{email:parsed.data.email},select:{id:true}}))throw new AccountError("Email baru tidak dapat digunakan.",409);
    const secret=createSecret(),link=accountLink("/account/verify",secret);
    const token=await prisma.$transaction(async tx=>{
      await tx.accountActionToken.updateMany({where:{accountId:account.id,purpose:"CHANGE_EMAIL",consumedAt:null},data:{consumedAt:new Date()}});
      return tx.accountActionToken.create({data:{accountId:account.id,purpose:"CHANGE_EMAIL",tokenHash:tokenHash(secret),targetEmail:parsed.data.email,
        sessionVersion:account.sessionVersion,expiresAt:new Date(Date.now()+30*60000)}});
    });
    issuedId=token.id;
    await sendAccountEmail(parsed.data.email,"Konfirmasi perubahan email akun",`Konfirmasikan email baru untuk akun pembeli melalui tautan berikut (berlaku 30 menit):\n${link}\n\nSetelah dikonfirmasi, masuk ulang menggunakan email baru. Abaikan email ini jika bukan Anda yang meminta perubahan.`);
    return NextResponse.json({success:true,message:"Tautan konfirmasi dikirim ke email baru. Email lama tetap aktif sampai verifikasi selesai."},{headers});
  } catch(error) {
    if(issuedId)await prisma.accountActionToken.updateMany({where:{id:issuedId,consumedAt:null},data:{consumedAt:new Date()}}).catch(()=>{});
    return accountFailure(error);
  }
}
