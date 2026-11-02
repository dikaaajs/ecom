import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { applyVerifiedPayment, CheckoutError } from "@/lib/payment/checkout";
import {
  notificationSchema, verifyMidtransSignature, MidtransError,
} from "@/lib/payment/midtrans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-to-server Midtrans webhook. NEVER use a browser callback to mark PAID.
 * Check signature and total before applying an idempotent transition.
 */
export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 415 });
  }
  let input: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 20000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    input = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = notificationSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });

  try {
    if (!verifyMidtransSignature(parsed.data)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    const result = await applyVerifiedPayment(parsed.data);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof CheckoutError || error instanceof MidtransError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return NextResponse.json({ error: "Concurrent webhook, please retry" }, { status: 503 });
    }
    console.error("Midtrans webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 503 });
  }
}
