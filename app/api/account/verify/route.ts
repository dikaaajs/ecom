import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tokenHash, permitAttempt, requestIp } from "@/lib/account/security";
import { tokenInput } from "@/lib/account/forms";
import { hasSameOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "JSON required" }, { status: 415, headers });
  let payload: unknown;
  try { const body = await request.text(); if (body.length > 512) throw Error(); payload = JSON.parse(body); }
  catch { return NextResponse.json({ error: "Token tidak valid." }, { status: 400, headers }); }
  const input = tokenInput.safeParse(payload);
  if (!input.success) return NextResponse.json({ error: "Token tidak valid." }, { status: 400, headers });

  try {
  if (!(await permitAttempt("verify-token-ip", requestIp(request), 25, 15))) {
    return NextResponse.json({ error: "Terlalu sering mencoba verifikasi. Coba lagi nanti." }, { status: 429, headers });
  }
  const hash = tokenHash(input.data.token);
    const token = await prisma.accountActionToken.findUnique({
      where: { tokenHash: hash },
      select: { id: true, accountId: true, purpose: true, expiresAt: true, consumedAt: true, targetEmail:true, sessionVersion:true },
    });
    if (!token || !["VERIFY_EMAIL","CHANGE_EMAIL"].includes(token.purpose) || token.consumedAt || token.expiresAt <= new Date()) {
      return NextResponse.json({ error: "Link verifikasi sudah kedaluwarsa atau pernah digunakan." }, { status: 400, headers });
    }
    await prisma.$transaction(async tx => {
      const changed = await tx.accountActionToken.updateMany({
        where: { id: token.id, consumedAt: null, expiresAt: { gt: new Date() } },
        data: { consumedAt: new Date() },
      });
      if (!changed.count) throw Error("Token already used");
      if(token.purpose==="CHANGE_EMAIL") {
        if(!token.targetEmail||token.sessionVersion===null)throw Error("Invalid change request");
        const changedAccount=await tx.customerAccount.updateMany({where:{id:token.accountId,sessionVersion:token.sessionVersion,emailVerifiedAt:{not:null}},
          data:{email:token.targetEmail,emailVerifiedAt:new Date(),sessionVersion:{increment:1}}});
        if(changedAccount.count!==1)throw Error("Expired session version");
        const account=await tx.customerAccount.findUniqueOrThrow({where:{id:token.accountId},select:{customerId:true}});
        await tx.customer.update({where:{id:account.customerId},data:{email:token.targetEmail}});
      } else {
        await tx.customerAccount.update({where:{id:token.accountId},data:{emailVerifiedAt:new Date()}});
      }
      await tx.accountActionToken.updateMany({
        where: { accountId: token.accountId, ...(token.purpose==="VERIFY_EMAIL"?{purpose:"VERIFY_EMAIL" as const}:{}), consumedAt: null },
        data: { consumedAt: new Date() },
      });
    });
    return NextResponse.json({ success: true, message: token.purpose==="CHANGE_EMAIL"?"Email berhasil diperbarui. Silakan masuk ulang menggunakan email baru.":"Email berhasil diverifikasi. Kamu sudah bisa login." }, { headers });
  } catch {
    return NextResponse.json({ error: "Link tidak dapat digunakan. Coba minta verifikasi ulang." }, { status: 400, headers });
  }
}
