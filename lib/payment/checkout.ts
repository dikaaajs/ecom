import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { MidtransNotification } from "@/lib/payment/midtrans";
import { classifyNotification } from "@/lib/payment/midtrans";

export const CHECKOUT_STORAGE_KEY = "ecom-checkout-session-v1";

export function accessHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export class CheckoutError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
}

function assertMoneyMatches(received: string, expected: Prisma.Decimal) {
  try {
    return new Prisma.Decimal(received).equals(expected);
  } catch {
    return false;
  }
}

/** Verified notification only: atomic, idempotent, and never trusts client payment state. */
export async function applyVerifiedPayment(note: MidtransNotification) {
  const outcome = classifyNotification(note);
  return prisma.$transaction(async tx => {
    const payment = await tx.paymentTransaction.findUnique({
      where: { providerOrderId: note.order_id },
      include: { order: { select: {
        id: true, orderNumber: true, status: true, total: true,
        items: { select: { productId: true, quantity: true } },
      } } },
    });
    if (!payment || payment.provider !== "MIDTRANS") {
      throw new CheckoutError("Payment record not found", 404);
    }
    if (!payment.order.total || !assertMoneyMatches(note.gross_amount, payment.amount) ||
        !payment.order.total.equals(payment.amount)) {
      throw new CheckoutError("Notification amount does not match recorded order", 409);
    }

    if (outcome === "PAID") {
      // A canceled order must never be resurrected automatically.
      const changed = await tx.order.updateMany({
        where: { id: payment.orderId, status: "PENDING_PAYMENT" },
        data: { status: "PAID" },
      });
      if (changed.count === 1) {
        await tx.paymentTransaction.update({
          where: { id: payment.id },
          data: { state: "PAID", paidAt: new Date(), lastNotificationAt: new Date() },
        });
      }
      return { processed: changed.count === 1, status: changed.count ? "PAID" : payment.order.status };
    }

    if (outcome === "CANCELLED") {
      const changed = await tx.order.updateMany({
        where: { id: payment.orderId, status: "PENDING_PAYMENT" },
        data: { status: "CANCELLED" },
      });
      if (changed.count === 1) {
        // Inventory was reserved when checkout started. Release once and only once.
        for (const item of payment.order.items) {
          if (item.productId) {
            await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
          }
        }
        await tx.paymentTransaction.update({
          where: { id: payment.id },
          data: { state: "CANCELLED", lastNotificationAt: new Date() },
        });
      }
      return { processed: changed.count === 1, status: changed.count ? "CANCELLED" : payment.order.status };
    }

    // Pending, refund or unknown statuses must never trigger fulfillment.
    await tx.paymentTransaction.update({
      where: { id: payment.id },
      data: { lastNotificationAt: new Date() },
    });
    return { processed: false, status: payment.order.status };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 10000 });
}

/** Cancel after a definite Snap token creation failure. Never called on success. */
export async function abandonUnpayableOrder(orderId: string) {
  return prisma.$transaction(async tx => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true, items: { select: { productId: true, quantity: true } },
      },
    });
    if (!order) return;
    const changed = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING_PAYMENT" },
      data: { status: "CANCELLED" },
    });
    if (!changed.count) return;
    for (const item of order.items) {
      if (item.productId) await tx.product.updateMany({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
    await tx.paymentTransaction.update({
      where: { orderId }, data: { state: "CANCELLED" },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
