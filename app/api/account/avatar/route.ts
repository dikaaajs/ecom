import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { customerId,checkOrigin,accountFailure,AccountError,privateHeaders as headers } from "@/lib/account/api";
import { avatarStorage,AVATAR_BUCKET,removeAvatar } from "@/lib/account/avatars";
import { siteImageType } from "@/lib/site-media";
import { permitAttempt } from "@/lib/account/security";
export const runtime="nodejs";
export async function POST(request:Request) {
  let uploaded: string|null=null;
  try {
    const id=await customerId();checkOrigin(request);
    if(Number(request.headers.get("content-length"))>1150000)throw new AccountError("Foto maksimal 1 MB.",413);
    const form=await request.formData(), file=form.get("file");
    if(!(file instanceof File)||file.size>1048576)throw new AccountError("Pilih foto JPG, PNG, atau WEBP maksimal 1 MB.",422);
    const bytes=new Uint8Array(await file.arrayBuffer()), type=siteImageType(bytes);
    if(!type||!["jpg","png","webp"].includes(type.extension))throw new AccountError("Format foto harus JPG, PNG, atau WEBP.",422);
    if(!await permitAttempt("avatar-account",id,10,60))throw new AccountError("Terlalu sering mengubah foto. Coba lagi nanti.",429);
    const client=avatarStorage();
    const existing=await client.storage.getBucket(AVATAR_BUCKET);
    if(!existing.data)await client.storage.createBucket(AVATAR_BUCKET,{public:false,fileSizeLimit:1048576,allowedMimeTypes:["image/png","image/jpeg","image/webp"]});
    const bucket=await client.storage.getBucket(AVATAR_BUCKET);
    if(!bucket.data||bucket.data.public)throw new AccountError("Penyimpanan foto pribadi belum tersedia.",503);
    const path=`${id}/${randomUUID()}.${type.extension}`;
    const upload=await client.storage.from(AVATAR_BUCKET).upload(path,bytes,{contentType:type.mime,upsert:false});
    if(upload.error)throw new AccountError("Foto gagal diunggah.",503);
    uploaded=path;
    const old=await prisma.customer.findUniqueOrThrow({where:{id},select:{avatarPath:true}});
    await prisma.customer.update({where:{id},data:{avatarPath:path}});
    uploaded=null;
    await removeAvatar(old.avatarPath);
    return NextResponse.json({success:true},{headers});
  } catch(error){if(uploaded)await removeAvatar(uploaded);return accountFailure(error);}
}
export async function DELETE(request:Request) {
  try {
    const id=await customerId();checkOrigin(request);
    const old=await prisma.customer.findUniqueOrThrow({where:{id},select:{avatarPath:true}});
    await prisma.customer.update({where:{id},data:{avatarPath:null}});
    await removeAvatar(old.avatarPath);
    return NextResponse.json({success:true},{headers});
  } catch(error){return accountFailure(error);}
}
