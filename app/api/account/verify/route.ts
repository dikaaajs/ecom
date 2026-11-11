import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tokenHash } from "@/lib/account/security";
import { tokenInput } from "@/lib/account/forms";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "JSON required" }, { status: 415, headers });
  let payload: unknown;
  try { const body = await request.text(); if (body.length > 512) throw Error(); payload = JSON.parse(body); }
  catch { return NextResponse.json({ error: "Token tidak valid." }, { status: 400, headers }); }
  const input = tokenInput.safeParse(payload);
  if (!input.success) return NextResponse.json({ error: "Token tidak valid." }, { status: 400, headers });

  const hash = tokenHash(input.data.token);
  try {
    const token = await prisma.accountActionToken.findUnique({
      where: { tokenHash: hash },
      select: { id: true, accountId: true, purpose: true, expiresAt: true, consumedAt: true },
    });
    if (!token || token.purpose !== "VERIFY_EMAIL" || token.consumedAt || token.expiresAt <= new Date()) {
      return NextResponse.json({ error: "Link verifikasi sudah kedaluwarsa atau pernah digunakan." }, { status: 400, headers });
    }
    await prisma.$transaction(async tx => {
      const changed = await tx.accountActionToken.updateMany({
        where: { id: token.id, consumedAt: null, expiresAt: { gt: new Date() } },
        data: { consumedAt: new Date() },
      });
      if (!changed.count) throw Error("Token already used");
      await tx.customerAccount.update({
        where: { id: token.accountId }, data: { emailVerifiedAt: new Date() },
      });
      await tx.accountActionToken.updateMany({
        where: { accountId: token.accountId, purpose: "VERIFY_EMAIL", consumedAt: null },
        data: { consumedAt: new Date() },
      });
    });
    return NextResponse.json({ success: true, message: "Email berhasil diverifikasi. Kamu sudah bisa login." }, { headers });
  } catch {
    return NextResponse.json({ error: "Link tidak dapat digunakan. Coba minta verifikasi ulang." }, { status: 400, headers });
  }
}
