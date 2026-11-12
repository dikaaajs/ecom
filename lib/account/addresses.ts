import type { Prisma } from "@prisma/client";
export const addressSelect = { id:true,label:true,recipient:true,phone:true,addressLine:true,province:true,city:true,district:true,postalCode:true,isDefault:true } satisfies Prisma.CustomerAddressSelect;
export async function lockAddressBook(tx: Prisma.TransactionClient,id:string) {
  await tx.$queryRaw`SELECT id FROM customers WHERE id = ${id} FOR UPDATE`;
}
export async function ensureDefaultAddress(tx: Prisma.TransactionClient,id:string,preferred?:string) {
  const rows=await tx.customerAddress.findMany({where:{customerId:id},orderBy:[{createdAt:"asc"},{id:"asc"}],select:{id:true,isDefault:true}});
  const chosen=rows.find(r=>r.id===preferred)||rows.find(r=>r.isDefault)||rows[0];
  if(!chosen)return;
  await tx.customerAddress.updateMany({where:{customerId:id,isDefault:true,id:{not:chosen.id}},data:{isDefault:false}});
  await tx.customerAddress.updateMany({where:{customerId:id,id:chosen.id},data:{isDefault:true}});
}
