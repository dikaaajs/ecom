import { createClient } from "@supabase/supabase-js";
import { AccountError } from "./api";
export const AVATAR_BUCKET="customer-avatars";
export function avatarStorage() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) throw new AccountError("Unggah foto belum tersedia. Pengaturan lain tetap dapat disimpan.",503);
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function avatarUrl(path: string | null) {
  if(!path) return null;
  try {
    const client=avatarStorage();
    const bucket=await client.storage.getBucket(AVATAR_BUCKET);
    if(!bucket.data || bucket.data.public) return null;
    const result=await client.storage.from(AVATAR_BUCKET).createSignedUrl(path,600);
    return result.error?null:result.data.signedUrl;
  } catch { return null; }
}
export async function removeAvatar(path: string | null) {
  if(!path)return;
  try { await avatarStorage().storage.from(AVATAR_BUCKET).remove([path]); } catch { /* Cleanup can be retried without failing a profile save. */ }
}
