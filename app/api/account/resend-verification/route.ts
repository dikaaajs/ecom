import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailInput } from "@/lib/account/forms";
import { normalizeEmail, permitAttempt, requestIp, issueAccountToken, accountLink, sendAccountEmail, genericEmailReply } from "@/lib/account/security";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "JSON required" }, { status: 415, headers });
  let payload: unknown;
  try { const body = await request.text(); if (body.length > 1000) throw Error(); payload = JSON.parse(body); }
  catch { return NextResponse.json({ error: "Email tidak valid." }, { status: 400, headers }); }
  const parsed = emailInput.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Email tidak valid." }, { status: 422, headers });
  const email = normalizeEmail(parsed.data.email);
  try {
    const ip = await permitAttempt("verify-ip", requestIp(request), 15, 60);
    const perEmail = await permitAttempt("verify-mail", email, 3, 60);
    if (!ip || !perEmail) return NextResponse.json(genericEmailReply, { headers });
    const account = await prisma.customerAccount.findUnique({ where: { email } });
    if (account && !account.emailVerifiedAt) {
      const token = await issueAccountToken(account.id, "VERIFY_EMAIL");
      await sendAccountEmail(email, "Verifikasi email Pixel Perfection",
        "Buka link berikut untuk memverifikasi email (berlaku 24 jam):\n" +
        accountLink("/account/verify", token) +
        "\n\nJika bukan kamu, abaikan email ini.");
    }
    return NextResponse.json(genericEmailReply, { headers });
  } catch (error) {
    console.error("Email verification request failed", error);
    return NextResponse.json(genericEmailReply, { headers });
  }
}
