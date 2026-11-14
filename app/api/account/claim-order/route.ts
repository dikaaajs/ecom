import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { accessHash } from "@/lib/payment/checkout";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const schema = z.object({ orderId: z.string().min(1).max(128), accessToken: z.string().regex(/^[a-f0-9]{64}$/) }).strict();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "customer" || !session.user.id) {
    return NextResponse.json({ error: "Login pembeli diperlukan." }, { status: 401, headers });
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Forbidden origin" }, { status: 403, headers });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "JSON required" }, { status: 415, headers });
  }
  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > 1000) return NextResponse.json({ error: "Payload too large" }, { status: 413, headers });
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Sesi pesanan tidak valid." }, { status: 422, headers });
  try {
    const order = await prisma.order.findFirst({
      where: { id: parsed.data.orderId, checkoutAccessHash: accessHash(parsed.data.accessToken) },
      select: { id: true, customerId: true, customer: { select: { account: { select: { id: true } } } } },
    });
    if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan untuk sesi ini." }, { status: 404, headers });
    if (order.customerId === session.user.id) return NextResponse.json({ success: true, alreadyLinked: true }, { headers });
    if (order.customer.account) return NextResponse.json({ error: "Pesanan sudah dimiliki akun lain." }, { status: 409, headers });
    const updated = await prisma.order.updateMany({
      where: { id: order.id, customerId: order.customerId },
      data: { customerId: session.user.id },
    });
    if (updated.count !== 1) return NextResponse.json({ error: "Kepemilikan pesanan berubah. Coba lagi." }, { status: 409, headers });
    return NextResponse.json({ success: true, alreadyLinked: false }, { headers });
  } catch (error) {
    console.error("Failed to claim guest order", error);
    return NextResponse.json({ error: "Gagal menautkan pesanan." }, { status: 500, headers });
  }
}
