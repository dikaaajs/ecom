import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(200).transform(value => value.trim().toLowerCase()),
  password: z.string().min(12).max(128),
}).strict();
const attempts = new Map<string, { count: number; expiry: number }>();

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Forbidden origin" }, { status: 403, headers });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "JSON required" }, { status: 415, headers });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now(), prev = attempts.get(ip);
  const count = prev && prev.expiry > now ? prev.count + 1 : 1;
  attempts.set(ip, { count, expiry: prev && prev.expiry > now ? prev.expiry : now + 3600000 });
  if (attempts.size > 1000) attempts.clear();
  if (count > 8) return NextResponse.json({ error: "Terlalu banyak pendaftaran. Coba lagi nanti." }, { status: 429, headers });

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
    await prisma.customer.create({
      data: {
        name, email,
        account: { create: { email, passwordHash } },
      },
    });
    return NextResponse.json({ success: true, message: "Akun berhasil dibuat. Silakan masuk." }, { status: 201, headers });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Email sudah terdaftar. Silakan masuk." }, { status: 409, headers });
    }
    console.error("Customer registration error", e);
    return NextResponse.json({ error: "Pendaftaran gagal." }, { status: 500, headers });
  }
}
