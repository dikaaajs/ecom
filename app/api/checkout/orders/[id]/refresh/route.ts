import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { accessHash, applyVerifiedPayment } from "@/lib/payment/checkout";
import { fetchMidtransStatus, MidtransError } from "@/lib/payment/midtrans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const requests = new Map<string, number>();

/** A valid guest token can refresh its own order by asking Midtrans SERVER-side. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403, headers });
  }
  const { id } = await params;
  const token = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.get("authorization") || "")?.[1];
  if (!token || !id || id.length > 128) {
    return NextResponse.json({ error: "Unauthorized checkout session" }, { status: 401, headers });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id, checkoutAccessHash: accessHash(token) },
      select: { id: true, orderNumber: true, status: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404, headers });
    if (order.status !== "PENDING_PAYMENT") return NextResponse.json({ status: order.status }, { headers });

    const now = Date.now();
    const last = requests.get(id) || 0;
    if (now - last < 15_000) return NextResponse.json(
      { error: "Tunggu 15 detik sebelum memeriksa ulang." }, { status: 429, headers },
    );
    requests.set(id, now);
    if (requests.size > 2000) requests.clear();

    const note = await fetchMidtransStatus(order.orderNumber);
    if (note) await applyVerifiedPayment(note);
    const latest = await prisma.order.findUnique({ where: { id }, select: { status: true } });
    return NextResponse.json({ status: latest?.status || order.status }, { headers });
  } catch (error) {
    if (error instanceof MidtransError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return NextResponse.json({ error: "Transaksi sedang diproses. Coba lagi." }, { status: 503, headers });
    }
    console.error("Midtrans order status reconciliation failed", id, error);
    return NextResponse.json({ error: "Gagal memperbarui status pembayaran" }, { status: 503, headers });
  }
}
