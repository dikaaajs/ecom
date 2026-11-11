import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasSameOrigin } from "@/lib/request-origin";
export const privateHeaders = { "Cache-Control": "private, no-store" };
export class AccountError extends Error { constructor(message: string, public status=400) { super(message); } }
export async function customerId() {
  const session = await getServerSession(authOptions);
  if(session?.user?.role!=="customer" || !session.user.id) throw new AccountError("Silakan masuk dengan akun pembeli.",401);
  return session.user.id;
}
export function checkOrigin(request: Request) {
  if(!hasSameOrigin(request)) throw new AccountError("Permintaan tidak diizinkan.",403);
}
export async function accountJson(request: Request) {
  checkOrigin(request);
  if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new AccountError("Data JSON diperlukan.",415);
  const raw=await request.text();
  if(raw.length>10000) throw new AccountError("Data terlalu besar.",413);
  try { return JSON.parse(raw) as unknown; } catch { throw new AccountError("Data tidak valid."); }
}
export function accountFailure(error: unknown) {
  return NextResponse.json({error:error instanceof AccountError?error.message:"Perubahan belum dapat diproses. Coba lagi."},
    {status:error instanceof AccountError?error.status:503,headers:privateHeaders});
}
