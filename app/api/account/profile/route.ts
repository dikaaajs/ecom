import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerId,accountJson,accountFailure,AccountError,privateHeaders as headers } from "@/lib/account/api";
import { profileInput } from "@/lib/account/profile";
import { avatarUrl,removeAvatar } from "@/lib/account/avatars";
import { addressSelect } from "@/lib/account/addresses";
export const dynamic="force-dynamic";
export async function GET() {
  try {
    const id=await customerId();
    const account=await prisma.customerAccount.findUnique({where:{customerId:id},select:{email:true,emailVerifiedAt:true,customer:{select:{name:true,phone:true,avatarPath:true,addresses:{select:addressSelect,orderBy:[{isDefault:"desc"},{createdAt:"desc"}],take:50}}}}});
    if(!account)throw new AccountError("Akun tidak ditemukan.",404);
    return NextResponse.json({profile:{name:account.customer.name,phone:account.customer.phone||"",email:account.email,
      emailVerifiedAt:account.emailVerifiedAt?.toISOString()??null,avatarUrl:await avatarUrl(account.customer.avatarPath),hasAvatar:Boolean(account.customer.avatarPath)},
      addresses:account.customer.addresses.map(a=>({...a,label:a.label||"",district:a.district||""}))},{headers});
  } catch(error){return accountFailure(error);}
}
export async function PATCH(request:Request) {
  try {
    const id=await customerId();
    const parsed=profileInput.safeParse(await accountJson(request));
    if(!parsed.success)throw new AccountError("Periksa nama dan nomor telepon.",422);
    const old=await prisma.customer.findUniqueOrThrow({where:{id},select:{avatarPath:true}});
    await prisma.customer.update({where:{id},data:{name:parsed.data.name,phone:parsed.data.phone||null,...(parsed.data.removeAvatar?{avatarPath:null}:{})}});
    if(parsed.data.removeAvatar)await removeAvatar(old.avatarPath);
    return NextResponse.json({success:true},{headers});
  } catch(error){return accountFailure(error);}
}
