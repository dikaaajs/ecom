import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { permitAttempt, requestIp, issueAccountToken, accountLink, sendAccountEmail } from "@/lib/account/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(200).transform(value => value.trim().toLowerCase()),
  password: z.string().min(12).max(128),
}).strict();

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Forbidden origin" }, { status: 403, headers });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "JSON required" }, { status: 415, headers });
  }
  if (!process.env.RESEND_API_KEY || !process.env.ACCOUNT_EMAIL_FROM || !(process.env.ACCOUNT_APP_URL || process.env.NEXTAUTH_URL)) {
    return NextResponse.json({ error: "Email verifikasi belum dikonfigurasi di server." }, { status: 503, headers });
  }
  if (!(await permitAttempt("register-ip", requestIp(request), 8, 60))) {
    return NextResponse.json({ error: "Terlalu banyak pendaftaran. Coba lagi nanti." }, { status: 429, headers });
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 2000) return NextResponse.json({ error: "Payload too large" }, { status: 413, headers });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400, headers });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Nama, email atau kata sandi tidak valid (minimal 12 karakter)." }, { status: 422, headers });
  const { name, email, password } = parsed.data;
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const customer = await prisma.customer.create({
      data: {
        name, email,
        account: { create: { email, passwordHash } },
      },
    });
    const account = await prisma.customerAccount.findUniqueOrThrow({ where: { customerId: customer.id } });
    try {
      const token = await issueAccountToken(account.id, "VERIFY_EMAIL");
      const link = accountLink("/account/verify", token);
      await sendAccountEmail(email, "Verifikasi email Pixel Perfection",
        `Halo ${name},\n\nVerifikasi akun Pixel Perfection melalui tautan ini (berlaku 24 jam):\n${link}\n\nJika kamu tidak membuat akun, abaikan email ini.`);
    } catch (mailError) {
      console.error("Account created, verification email unavailable", customer.id, mailError);
      return NextResponse.json({ success: true, emailPending: true, message: "Akun dibuat, tetapi pengiriman email bermasalah. Gunakan Kirim ulang verifikasi." }, { status: 201, headers });
    }
    return NextResponse.json({ success: true, message: "Akun dibuat. Periksa email untuk verifikasi sebelum login." }, { status: 201, headers });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Email sudah terdaftar. Silakan masuk." }, { status: 409, headers });
    }
    console.error("Customer registration error", e);
    return NextResponse.json({ error: "Pendaftaran gagal." }, { status: 500, headers });
  }
}
