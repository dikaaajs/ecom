import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { MAX_SITE_IMAGE_BYTES, siteImageType } from "@/lib/site-media";
import { hasSameOrigin } from "@/lib/request-origin";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if(session?.user?.role!=="admin") return NextResponse.json({error:"Forbidden"},{status:403,headers});
  if(!hasSameOrigin(request)) return NextResponse.json({error:"Forbidden origin"},{status:403,headers});
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !key) return NextResponse.json({error:"Unggah gambar belum dikonfigurasi. Isi konfigurasi Supabase di server atau gunakan URL gambar."},{status:503,headers});
  if(Number(request.headers.get("content-length"))>MAX_SITE_IMAGE_BYTES+100000) return NextResponse.json({error:"Maksimal ukuran gambar 2 MB."},{status:413,headers});
  try {
    const form = await request.formData();
    const file = form.get("file");
    if(!(file instanceof File) || file.size>MAX_SITE_IMAGE_BYTES) return NextResponse.json({error:"Pilih gambar maksimal 2 MB."},{status:400,headers});
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = siteImageType(bytes);
    if(!type) return NextResponse.json({error:"Gunakan PNG, JPG, WEBP, GIF, atau ICO yang valid."},{status:400,headers});
    const client = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const bucket = "storefront-media";
    const existing = await client.storage.getBucket(bucket);
    if(!existing.data) {
      // Concurrent first uploads may both try to create; re-read the bucket below.
      await client.storage.createBucket(bucket,{public:true,fileSizeLimit:MAX_SITE_IMAGE_BYTES,allowedMimeTypes:["image/png","image/jpeg","image/webp","image/gif","image/x-icon"]});
    }
    const check = await client.storage.getBucket(bucket);
    if(!check.data?.public) throw Error("Public media bucket unavailable");
    const path = `${randomUUID()}.${type.extension}`;
    const upload = await client.storage.from(bucket).upload(path,bytes,{contentType:type.mime,upsert:false,cacheControl:"31536000"});
    if(upload.error) throw Error("Upload unavailable");
    return NextResponse.json({url:client.storage.from(bucket).getPublicUrl(path).data.publicUrl},{headers});
  } catch { return NextResponse.json({error:"Gambar gagal diunggah. Periksa koneksi dan konfigurasi penyimpanan."},{status:503,headers}); }
}
