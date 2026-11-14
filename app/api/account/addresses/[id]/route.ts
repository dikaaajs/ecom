import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerId,accountJson,checkOrigin,accountFailure,AccountError,privateHeaders as headers } from "@/lib/account/api";
import { addressInput } from "@/lib/account/profile";
import { lockAddressBook,ensureDefaultAddress } from "@/lib/account/addresses";
type Context={params:Promise<{id:string}>};
export async function PATCH(request:Request,context:Context) {
  try {
    const owner=await customerId(),{id}=await context.params,parsed=addressInput.safeParse(await accountJson(request));
    if(!parsed.success)throw new AccountError("Data alamat belum valid.",422);
    await prisma.$transaction(async tx=>{
      await lockAddressBook(tx,owner);
      const changed=await tx.customerAddress.updateMany({where:{id,customerId:owner},data:parsed.data});
      if(!changed.count)throw new AccountError("Alamat tidak ditemukan.",404);
      await ensureDefaultAddress(tx,owner,parsed.data.isDefault?id:undefined);
    },{timeout:15000});
    return NextResponse.json({success:true},{headers});
  } catch(error){return accountFailure(error);}
}
export async function DELETE(request:Request,context:Context) {
  try {
    const owner=await customerId(),{id}=await context.params;checkOrigin(request);
    await prisma.$transaction(async tx=>{
      await lockAddressBook(tx,owner);
      const removed=await tx.customerAddress.deleteMany({where:{id,customerId:owner}});
      if(!removed.count)throw new AccountError("Alamat tidak ditemukan.",404);
      await ensureDefaultAddress(tx,owner);
    },{timeout:15000});
    return NextResponse.json({success:true},{headers});
  } catch(error){return accountFailure(error);}
}
