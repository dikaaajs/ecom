import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSavedShippingOrigin } from "@/lib/shipping/get-origin";
import { regionSelectionSchema, verifyRegionSelection, ShippingRegionError } from "@/lib/shipping/regions";
import { getRajaOngkirRates, ShippingRateError } from "@/lib/shipping/rajaongkir";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const requestSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1).max(128),
    quantity: z.number().int().min(1).max(99),
  }).strict()).min(1).max(50),
  destination: regionSelectionSchema.strict(),
}).strict();

// Preview rate guard: this is process-local (not a shared production rate limiter).
const clientRequests = new Map<string, { count: number; expires: number }>();
const WINDOW_MS = 60 * 60_000;
const MAX_REQUESTS = 15;
const privateHeaders = { "Cache-Control": "private, no-store" };

function checkRateLimit(request: Request): boolean {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const previous = clientRequests.get(ip);
  const count = previous && previous.expires > now ? previous.count + 1 : 1;
  clientRequests.set(ip, { count, expires: previous && previous.expires > now ? previous.expires : now + WINDOW_MS });
  if (clientRequests.size > 1000) {
    for (const [key, value] of clientRequests) if (value.expires <= now) clientRequests.delete(key);
    if (clientRequests.size > 1000) clientRequests.clear();
  }
  return count <= MAX_REQUESTS;
}

/**
 * Anonymous cost PREVIEW only, never a checkout order or payment quote.
 * All prices, product types, inventory, and weights are loaded server-side.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Permintaan lintas situs tidak diizinkan." }, { status: 403, headers: privateHeaders });
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "Format permintaan harus JSON." }, { status: 415, headers: privateHeaders });
  }

  let body: unknown;
  try {
    const input = await request.text();
    if (input.length > 12_000) return NextResponse.json(
      { error: "Permintaan terlalu besar." }, { status: 413, headers: privateHeaders },
    );
    body = JSON.parse(input);
  } catch {
    return NextResponse.json({ error: "JSON tidak valid." }, { status: 400, headers: privateHeaders });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success || new Set(parsed.success ? parsed.data.items.map(item => item.productId) : []).size !==
    (parsed.success ? parsed.data.items.length : 0)) {
    return NextResponse.json({ error: "Keranjang atau wilayah tujuan tidak valid." }, { status: 400, headers: privateHeaders });
  }
  if (!checkRateLimit(request)) return NextResponse.json(
    { error: "Terlalu sering cek ongkir. Coba lagi nanti." }, { status: 429, headers: privateHeaders },
  );

  try {
    const merchant = await getSavedShippingOrigin();
    if (!merchant) return NextResponse.json(
      { error: "Toko belum mengatur alamat asal pengiriman. Hubungi penjual." },
      { status: 409, headers: privateHeaders },
    );

    const { items, destination } = parsed.data;
    const products = await prisma.product.findMany({
      where: { id: { in: items.map(item => item.productId) }, isPublished: true },
      select: { id: true, price: true, stock: true, type: true, weight: true },
    });
    const productById = new Map(products.map(product => [product.id, product]));
    let subtotal = new Prisma.Decimal(0);
    let weightGram = 0;
    let hasPhysicalItem = false;

    for (const item of items) {
      const product = productById.get(item.productId);
      if (!product || product.stock < item.quantity) return NextResponse.json(
        { error: "Keranjang berubah atau stok tidak cukup. Perbarui keranjang." },
        { status: 409, headers: privateHeaders },
      );
      subtotal = subtotal.plus(product.price.mul(item.quantity));
      if (product.type === "PHYSICAL") {
        hasPhysicalItem = true;
        if (!Number.isSafeInteger(product.weight) || product.weight < 1) return NextResponse.json(
          { error: "Berat produk belum benar. Hubungi penjual." },
          { status: 422, headers: privateHeaders },
        );
        weightGram += product.weight * item.quantity;
      }
    }
    if (!hasPhysicalItem || weightGram < 1) return NextResponse.json(
      { error: "Produk digital tidak memerlukan cek ongkir." },
      { status: 400, headers: privateHeaders },
    );
    if (!Number.isSafeInteger(weightGram) || weightGram > 100_000) return NextResponse.json(
      { error: "Total berat terlalu besar untuk cek ongkir otomatis. Hubungi penjual." },
      { status: 422, headers: privateHeaders },
    );

    if (!(await verifyRegionSelection(destination))) return NextResponse.json(
      { error: "Wilayah tujuan tidak valid. Pilih ulang provinsi, kota, dan kecamatan." },
      { status: 422, headers: privateHeaders },
    );

    const couriers = process.env.RAJAONGKIR_COURIERS?.trim() || "jne:jnt:sicepat:anteraja";
    const rates = await getRajaOngkirRates({
      originId: merchant.districtId,
      destinationId: destination.districtId,
      weightGram,
      couriers,
    });

    return NextResponse.json({
      rates,
      weightGram,
      subtotal: subtotal.toFixed(2),
      currency: "IDR",
      estimateOnly: true,
      checkedAt: new Date().toISOString(),
      expiresInSeconds: 300,
    }, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof ShippingRateError || error instanceof ShippingRegionError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: privateHeaders });
    }
    console.error("Shipping quote preview error", error);
    return NextResponse.json({ error: "Tidak bisa menghitung ongkir saat ini." }, { status: 500, headers: privateHeaders });
  }
}
