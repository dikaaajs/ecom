import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { accessHash } from "@/lib/payment/checkout";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

/** Only possession of a 256-bit secret unlocks this guest order summary. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || id.length > 128) return NextResponse.json({ error: "Invalid ID" }, { status: 400, headers });
  const auth = request.headers.get("authorization") || "";
  const token = /^Bearer ([a-f0-9]{64})$/.exec(auth)?.[1];
  if (!token) return NextResponse.json({ error: "Order access requires checkout session" }, { status: 401, headers });

  try {
    const order = await prisma.order.findFirst({
      where: { id, checkoutAccessHash: accessHash(token) },
      select: {
        id: true, orderNumber: true, status: true, subtotal: true, shippingCost: true,
        total: true, currency: true, createdAt: true,
        items: { select: { productTitle: true, productType: true, quantity: true, unitPrice: true, lineTotal: true } },
        shipment: { select: { status: true, courier: true, service: true, trackingNumber: true } },
        payment: { select: { state: true, redirectUrl: true, paidAt: true } },
      },
    });
    if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan untuk sesi checkout ini" }, { status: 404, headers });

    return NextResponse.json({
      order: {
        ...order,
        payment: order.payment ? {
          state: order.payment.state,
          paidAt: order.payment.paidAt,
          redirectUrl: order.status === "PENDING_PAYMENT" ? order.payment.redirectUrl : null,
        } : null,
      },
    }, { headers });
  } catch (error) {
    console.error("Protected checkout status lookup failed", error);
    return NextResponse.json({ error: "Tidak dapat memuat status pesanan" }, { status: 500, headers });
  }
}
