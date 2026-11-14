import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetInput } from "@/lib/account/forms";
import { tokenHash, permitAttempt, requestIp } from "@/lib/account/security";
import { hasSameOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "JSON required" }, { status: 415, headers });
  let payload: unknown;
  try { const body = await request.text(); if (body.length > 1000) throw Error(); payload = JSON.parse(body); }
  catch { return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400, headers }); }
  const parsed = resetInput.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Token atau password tidak valid (minimal 12 karakter)." }, { status: 422, headers });
  try {
  if (!(await permitAttempt("reset-token-ip", requestIp(request), 15, 15))) {
    return NextResponse.json({ error: "Terlalu banyak percobaan reset. Coba nanti." }, { status: 429, headers });
  }
    const token = await prisma.accountActionToken.findUnique({
      where: { tokenHash: tokenHash(parsed.data.token) },
    });
    if (!token || token.purpose !== "RESET_PASSWORD" || token.consumedAt || token.expiresAt <= new Date()) {
      return NextResponse.json({ error: "Link reset kedaluwarsa atau telah digunakan." }, { status: 400, headers });
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.$transaction(async tx => {
      const changed = await tx.accountActionToken.updateMany({
        where: { id: token.id, consumedAt: null, expiresAt: { gt: new Date() } },
        data: { consumedAt: new Date() },
      });
      if (!changed.count) throw Error("Token already used");
      await tx.customerAccount.update({
        where: { id: token.accountId },
        data: { passwordHash, sessionVersion: { increment: 1 } },
      });
      await tx.accountActionToken.updateMany({
        where: { accountId: token.accountId, purpose: { in:["RESET_PASSWORD","CHANGE_EMAIL"] }, consumedAt: null },
        data: { consumedAt: new Date() },
      });
    });
    return NextResponse.json({ success: true, message: "Password diperbarui. Silakan masuk dengan password baru." }, { headers });
  } catch {
    return NextResponse.json({ error: "Reset gagal. Minta link baru." }, { status: 400, headers });
  }
}
