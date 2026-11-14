import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyVerifiedPayment, abandonUnpayableOrder } from "@/lib/payment/checkout";
import { fetchMidtransStatus } from "@/lib/payment/midtrans";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Protect with CRON_SECRET. Can be called by Vercel Cron or another scheduler.
 * No guessed payment state: Midtrans is consulted before releasing reserved stock.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const olderThan = new Date(Date.now() - 3 * 60 * 60_000); // Snap page expires after 60min.
  try {
    const pending = await prisma.paymentTransaction.findMany({
      where: {
        state: { in: ["INITIALIZING", "PENDING"] },
        createdAt: { lt: olderThan },
        order: { status: "PENDING_PAYMENT" },
      },
      select: { orderId: true, providerOrderId: true },
      orderBy: { createdAt: "asc" },
      take: 25,
    });
    let released = 0, synced = 0, errors = 0;
    for (const payment of pending) {
      try {
        const note = await fetchMidtransStatus(payment.providerOrderId);
        if (!note) {
          // No payment method was ever selected. This session is older than its
          // explicit 60-minute expiry. Conditional cancel releases stock once.
          await abandonUnpayableOrder(payment.orderId);
          released++;
        } else {
          await applyVerifiedPayment(note);
          synced++;
        }
      } catch (error) {
        errors++;
        console.error("Pending payment reconciliation failed", payment.orderId, error);
      }
    }
    return NextResponse.json({
      checked: pending.length, released, synced, errors,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Payment reconciliation scan failed", error);
    return NextResponse.json({ error: "Reconciliation unavailable" }, { status: 503 });
  }
}
