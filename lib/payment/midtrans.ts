import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const snapResponse = z.object({
  token: z.string().min(10),
  redirect_url: z.string().url(),
});
export const notificationSchema = z.object({
  order_id: z.string().min(1).max(128),
  status_code: z.string().max(5),
  gross_amount: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  signature_key: z.string().regex(/^[a-fA-F0-9]{128}$/),
  transaction_status: z.string().max(40),
  fraud_status: z.string().max(40).optional().nullable(),
}).passthrough();
export type MidtransNotification = z.infer<typeof notificationSchema>;

export class MidtransError extends Error {
  constructor(message: string, public readonly status = 502) { super(message); }
}

function config() {
  const key = process.env.MIDTRANS_SERVER_KEY;
  const production = process.env.MIDTRANS_IS_PRODUCTION === "true";
  if (!key) throw new MidtransError("Midtrans Server Key belum dikonfigurasi.", 503);
  return { key, production };
}

export async function createSnapPayment(params: {
  orderNumber: string;
  total: number;
  buyer: { name: string; email: string; phone?: string };
  items: { productId: string; name: string; quantity: number; price: number }[];
  shippingCost: number;
}): Promise<{ token: string; redirectUrl: string }> {
  const { key, production } = config();
  if (!Number.isSafeInteger(params.total) || params.total < 1 || params.total > 100_000_000) {
    throw new MidtransError("Total transaksi tidak valid.", 422);
  }
  const itemDetails = params.items.map(item => ({
    id: item.productId.slice(0, 50),
    name: item.name.slice(0, 50),
    price: item.price,
    quantity: item.quantity,
  }));
  if (params.shippingCost > 0) {
    itemDetails.push({ id: "SHIPPING", name: "Ongkos kirim", price: params.shippingCost, quantity: 1 });
  }
  const calculated = itemDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (calculated !== params.total) throw new MidtransError("Jumlah rincian produk tidak cocok dengan total.", 422);

  const endpoint = production
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(key + ":").toString("base64"),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        transaction_details: { order_id: params.orderNumber, gross_amount: params.total },
        customer_details: {
          first_name: params.buyer.name.slice(0, 100),
          email: params.buyer.email,
          phone: params.buyer.phone || undefined,
        },
        item_details: itemDetails,
        expiry: { unit: "minutes", duration: 60 },
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (response.status === 401 || response.status === 403) throw new MidtransError("Midtrans Server Key ditolak.", 503);
    if (!response.ok) throw new MidtransError("Midtrans gagal membuat sesi pembayaran.");
    const parsed = snapResponse.safeParse(await response.json());
    if (!parsed.success) throw new MidtransError("Respons token Midtrans tidak valid.");
    const url = new URL(parsed.data.redirect_url);
    const permitted = production ? "app.midtrans.com" : "app.sandbox.midtrans.com";
    if (url.protocol !== "https:" || url.hostname !== permitted) {
      throw new MidtransError("URL pembayaran Midtrans tidak tepercaya.");
    }
    return { token: parsed.data.token, redirectUrl: url.toString() };
  } catch (error) {
    if (error instanceof MidtransError) throw error;
    throw new MidtransError("Midtrans tidak dapat dihubungi. Silakan coba lagi.");
  } finally {
    clearTimeout(timeout);
  }
}

export function verifyMidtransSignature(note: MidtransNotification): boolean {
  const { key } = config();
  const raw = note.order_id + note.status_code + note.gross_amount + key;
  const digest = createHash("sha512").update(raw).digest("hex");
  const left = Buffer.from(digest, "hex");
  const right = Buffer.from(note.signature_key, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

export type PaymentOutcome = "PAID" | "CANCELLED" | "PENDING" | "UNHANDLED";

export function classifyNotification(note: MidtransNotification): PaymentOutcome {
  const status = note.transaction_status.toLowerCase();
  const fraud = note.fraud_status?.toLowerCase();
  if (["settlement", "capture"].includes(status)) {
    return note.status_code === "200" && (!fraud || fraud === "accept") ? "PAID" : "UNHANDLED";
  }
  if (["expire", "deny", "cancel", "failure"].includes(status)) return "CANCELLED";
  if (["pending", "authorize"].includes(status)) return "PENDING";
  return "UNHANDLED";
}

/** Backend-only status reconciliation, useful when webhooks cannot reach localhost. */
export async function fetchMidtransStatus(orderNumber: string): Promise<MidtransNotification | null> {
  const { key, production } = config();
  if (!/^[A-Za-z0-9-]{5,80}$/.test(orderNumber)) throw new MidtransError("Invalid order reference", 400);
  const endpoint = production
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 10000);
  try {
    const response = await fetch(endpoint + "/v2/" + encodeURIComponent(orderNumber) + "/status", {
      headers: {
        Authorization: "Basic " + Buffer.from(key + ":").toString("base64"),
        Accept: "application/json",
      },
      signal: abort.signal, cache: "no-store",
    });
    if (response.status === 404) return null; // Payment channel not yet selected.
    if (!response.ok) throw new MidtransError("Tidak dapat memverifikasi pembayaran di Midtrans.");
    const parsed = notificationSchema.safeParse(await response.json());
    if (!parsed.success || parsed.data.order_id !== orderNumber || !verifyMidtransSignature(parsed.data)) {
      throw new MidtransError("Respons status Midtrans tidak terverifikasi.", 502);
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof MidtransError) throw error;
    throw new MidtransError("Gagal menghubungi status Midtrans.");
  } finally {
    clearTimeout(timeout);
  }
}
