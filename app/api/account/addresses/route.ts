import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerId,accountJson,accountFailure,AccountError,privateHeaders as headers } from "@/lib/account/api";
import { addressInput } from "@/lib/account/profile";
import { lockAddressBook,ensureDefaultAddress } from "@/lib/account/addresses";
export async function POST(request:Request) {
  try {
    const id=await customerId(), parsed=addressInput.safeParse(await accountJson(request));
    if(!parsed.success)throw new AccountError("Lengkapi alamat, penerima, telepon, dan kode pos 5 angka.",422);
    await prisma.$transaction(async tx=>{
      await lockAddressBook(tx,id);
      if(await tx.customerAddress.count({where:{customerId:id}})>=20)throw new AccountError("Maksimal 20 alamat tersimpan.",409);
      const address=await tx.customerAddress.create({data:{...parsed.data,customerId:id}});
      await ensureDefaultAddress(tx,id,parsed.data.isDefault?address.id:undefined);
    },{timeout:15000});
    return NextResponse.json({success:true},{status:201,headers});
  } catch(error){return accountFailure(error);}
}
