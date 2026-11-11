import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { accessHash } from "@/lib/payment/checkout";
import { requirePrivateBucket } from "@/lib/shipping/private-digital-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "Cache-Control": "private, no-store", "Pragma": "no-cache" };
const error = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers });

// Short-lived, best-effort per-order/product throttle. Use a shared rate limiter
// (Redis/DB) before public production release.
const requests = new Map<string, { count: number; expiry: number }>();
function permitted(key: string) {
  const now = Date.now();
  const old = requests.get(key);
  const row = old && old.expiry > now
    ? { count: old.count + 1, expiry: old.expiry }
    : { count: 1, expiry: now + 60_000 };
  requests.set(key, row);
  if (requests.size > 1500) {
    for (const [id, value] of requests) if (value.expiry < now) requests.delete(id);
    if (requests.size > 1500) requests.clear();
  }
  return row.count <= 5;
}

/**
 * An unguessable guest checkout session is the current buyer access capability:
 * this is not a long-lived authenticated account identity. Never issue a file
 * link from an order number, email, product ID, or client payment status alone.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return error("Permintaan lintas situs tidak diizinkan.", 403);
  }

  const session = await getServerSession(authOptions);
  const customerId = session?.user?.role === "customer" ? session.user.id : null;
  const auth = request.headers.get("authorization") || "";
  const token = /^Bearer ([a-f0-9]{64})$/.exec(auth)?.[1];
  if (!customerId && !token) return error("Silakan login untuk mengunduh pesanan.", 401);

  const { id } = await params;
  if (!id || id.length > 128) return error("ID pesanan tidak valid.", 400);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return error("Format permintaan harus JSON.", 415);
  }

  let productId: string;
  try {
    const raw = await request.text();
    if (raw.length > 1000) return error("Permintaan terlalu besar.", 413);
    const payload: unknown = JSON.parse(raw);
    if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
        Object.keys(payload).length !== 1 ||
        !("productId" in payload) || typeof payload.productId !== "string" ||
        payload.productId.length < 1 || payload.productId.length > 128) {
      return error("ID produk tidak valid.", 400);
    }
    productId = payload.productId;
  } catch {
    return error("Permintaan JSON tidak valid.", 400);
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        id,
        OR: [
          ...(customerId ? [{ customerId }] : []),
          ...(token ? [{ checkoutAccessHash: accessHash(token), customer: { account: { is: null } } }] : []),
        ],
      },
      select: {
        id: true,
        status: true,
        payment: { select: { state: true, paidAt: true } },
        items: {
          where: { productId, productType: "DIGITAL" },
          select: {
            id: true,
            quantity: true,
            product: {
              select: {
                digitalAsset: {
                  select: { bucket: true, objectPath: true, fileName: true },
                },
              },
            },
          },
        },
      },
    });
    if (!order) return error("Pesanan tidak ditemukan untuk sesi ini.", 404);

    const paidStatuses = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"];
    if (!paidStatuses.includes(order.status) || order.payment?.state !== "PAID" ||
        !order.payment.paidAt) {
      return error("Unduhan hanya tersedia setelah pembayaran terverifikasi.", 403);
    }

    const item = order.items.find(row => row.quantity > 0 && row.product?.digitalAsset);
    if (!item?.product?.digitalAsset) {
      return error("File digital pesanan tidak tersedia. Hubungi penjual.", 404);
    }
    if (!permitted(order.id + ":" + productId)) {
      return error("Terlalu banyak permintaan unduhan. Coba lagi dalam satu menit.", 429);
    }

    const { client, bucket } = await requirePrivateBucket();
    const asset = item.product.digitalAsset;
    // Never allow a DB record to choose a different bucket, including public ones.
    if (asset.bucket !== bucket || !asset.objectPath.startsWith("products/" + productId + "/")) {
      console.error("Invalid private digital asset binding", order.id, productId);
      return error("Konfigurasi file digital tidak valid.", 503);
    }

    const { data, error: signError } = await client.storage.from(bucket)
      .createSignedUrl(asset.objectPath, 60, { download: asset.fileName });
    if (signError || !data?.signedUrl) {
      console.error("Failed to sign private digital download for paid order", order.id, productId, signError?.message);
      return error("File belum bisa diunduh. Silakan coba kembali.", 503);
    }
    // The signed URL is a temporary bearer capability; it can be copied until
    // expiry, and must not be logged, cached or persisted in client storage.
    return NextResponse.json({
      url: data.signedUrl,
      fileName: asset.fileName,
      expiresInSeconds: 60,
    }, { headers });
  } catch (caught) {
    console.error("Private digital download failed", caught);
    return error("Gagal mempersiapkan unduhan digital.", 503);
  }
}
