import { randomBytes } from "node:crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buyerAddressSchema } from "@/lib/shipping/buyer-address";
import { getSavedShippingOrigin } from "@/lib/shipping/get-origin";
import { verifyRegionSelection, ShippingRegionError } from "@/lib/shipping/regions";
import { getRajaOngkirRates, ShippingRateError } from "@/lib/shipping/rajaongkir";
import { accessHash, abandonUnpayableOrder, CheckoutError } from "@/lib/payment/checkout";
import { createSnapPayment, MidtransError } from "@/lib/payment/midtrans";
import { lockAddressBook,ensureDefaultAddress } from "@/lib/account/addresses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

const contactSchema = z.object({
  recipient: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s()-]{6,19}$/).max(20),
}).strict();

const schema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1).max(128),
    quantity: z.number().int().min(1).max(99),
  }).strict()).min(1).max(50),
  accessToken: z.string().regex(/^[a-f0-9]{64}$/),
  address: buyerAddressSchema.nullable(),
  contact: contactSchema,
  shipping: z.object({
    courierCode: z.string().regex(/^[a-z0-9]{2,24}$/),
    service: z.string().min(1).max(80),
  }).strict().nullable(),
}).strict();

const rateGuard = new Map<string, { count: number; expires: number }>();
const WINDOW = 10 * 60_000;
const LIMIT = 3;
const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status, headers });
function canCreate(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const row = rateGuard.get(ip);
  const count = row && row.expires > now ? row.count + 1 : 1;
  rateGuard.set(ip, { count, expires: row && row.expires > now ? row.expires : now + WINDOW });
  if (rateGuard.size > 1000) {
    for (const [key, value] of rateGuard) if (value.expires <= now) rateGuard.delete(key);
    if (rateGuard.size > 1000) rateGuard.clear();
  }
  return count <= LIMIT;
}

type CheckoutProduct = {
  id: string;
  title: string;
  price: Prisma.Decimal;
  stock: number;
  type: "PHYSICAL" | "DIGITAL";
  weight: number;
  digitalAsset: { id: string } | null;
};

function summarize(items: z.infer<typeof schema>["items"], byId: Map<string, CheckoutProduct>) {
  let subtotal = new Prisma.Decimal(0);
  let weight = 0;
  let physical = false;
  const lines: { product: CheckoutProduct; quantity: number; unitPrice: number }[] = [];
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product || product.stock < item.quantity) throw new CheckoutError("Produk tidak tersedia atau stok telah berubah.", 409);
    if (product.type === "DIGITAL" && !product.digitalAsset) {
      throw new CheckoutError("Ada produk digital yang belum memiliki file. Hubungi penjual.", 422);
    }
    if (!product.price.isInteger() || product.price.lte(0) || product.price.gt(100_000_000)) {
      throw new CheckoutError("Harga produk tidak dapat diproses sebagai IDR bulat.", 422);
    }
    if (product.type === "PHYSICAL") {
      physical = true;
      if (!Number.isSafeInteger(product.weight) || product.weight < 1) throw new CheckoutError("Berat produk belum valid.", 422);
      weight += product.weight * item.quantity;
    }
    subtotal = subtotal.plus(product.price.mul(item.quantity));
    lines.push({ product, quantity: item.quantity, unitPrice: product.price.toNumber() });
  }
  if (!Number.isSafeInteger(weight) || weight > 100_000 || subtotal.gt(100_000_000)) {
    throw new CheckoutError("Berat atau nilai keranjang melebihi batas transaksi.", 422);
  }
  return { lines, subtotal, weight, physical };
}

/** All prices, inventory, shipping and address hierarchy are rechecked server-side. */
export async function POST(request: Request) {
  if (!process.env.MIDTRANS_SERVER_KEY) return jsonError("Midtrans sandbox belum dikonfigurasi oleh toko.", 503);
  if (process.env.MIDTRANS_IS_PRODUCTION === "true" && process.env.MIDTRANS_ENABLE_LIVE_PAYMENTS !== "true") {
    return jsonError("Pembayaran production belum diaktifkan oleh administrator.", 503);
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return jsonError("Forbidden origin", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return jsonError("Expected JSON", 415);
  let raw: unknown;
  try {
    const body = await request.text();
    if (body.length > 16_000) return jsonError("Data checkout terlalu besar.", 413);
    raw = JSON.parse(body);
  } catch {
    return jsonError("JSON tidak valid.", 400);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return jsonError("Data checkout belum lengkap atau tidak valid.", 422);
  const { items, accessToken, address, shipping, contact } = parsed.data;
  if (new Set(items.map(item => item.productId)).size !== items.length) return jsonError("Produk duplikat dalam keranjang.", 400);
  if (!address && shipping) return jsonError("Pilih alamat pengiriman sebelum menentukan kurir.", 422);
  if (address && (contact.recipient !== address.recipient || contact.email !== address.email || contact.phone !== address.phone)) {
    return jsonError("Kontak pembeli dan alamat tidak cocok.", 422);
  }

  const hash = accessHash(accessToken);
  const existing = await prisma.order.findUnique({
    where: { checkoutAccessHash: hash },
    select: { id: true, orderNumber: true, status: true, payment: { select: { redirectUrl: true } } },
  });
  if (existing) {
    if (existing.status === "PENDING_PAYMENT" && existing.payment?.redirectUrl) return NextResponse.json({
      orderId: existing.id, orderNumber: existing.orderNumber, redirectUrl: existing.payment.redirectUrl,
      resumed: true,
    }, { headers });
    return jsonError("Sesi checkout sebelumnya tidak dapat digunakan kembali. Periksa statusnya.", 409);
  }
  if (!canCreate(request)) return jsonError("Terlalu sering membuat pesanan. Coba lagi beberapa menit.", 429);

  let createdId: string | null = null;
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "customer" || !session.user.id) {
      throw new CheckoutError("Silakan login atau daftar akun pembeli sebelum checkout.", 401);
    }
    const account = await prisma.customerAccount.findUnique({ where: { customerId: session.user.id } });
    if (!account) throw new CheckoutError("Akun pembeli tidak ditemukan.", 401);
    if (contact.email.trim().toLowerCase() !== account.email) throw new CheckoutError("Email checkout harus sesuai email akun pembeli.", 422);
    const products = await prisma.product.findMany({
      where: { id: { in: items.map(item => item.productId) }, isPublished: true },
      select: {
        id: true, title: true, price: true, stock: true, type: true, weight: true,
        digitalAsset: { select: { id: true } },
      },
    });
    const preflight = summarize(items, new Map(products.map(product => [product.id, product])));
    if (preflight.physical !== !!address) throw new CheckoutError(
      preflight.physical ? "Alamat pengiriman wajib untuk produk fisik." : "Produk digital tidak memerlukan alamat pengiriman.", 422,
    );

    let rate: Awaited<ReturnType<typeof getRajaOngkirRates>>[number] | null = null;
    if (preflight.physical) {
      if (!address || !shipping) throw new CheckoutError("Alamat dan layanan kurir harus dipilih.", 422);
      const origin = await getSavedShippingOrigin();
      if (!origin) throw new CheckoutError("Alamat gudang belum dikonfigurasi.", 409);
      if (!await verifyRegionSelection(address)) throw new CheckoutError("Wilayah pembeli tidak valid.", 422);
      const allowedCouriers = process.env.RAJAONGKIR_COURIERS?.trim() || "jne:jnt:sicepat:anteraja";
      const rates = await getRajaOngkirRates({
        originId: origin.districtId, destinationId: address.districtId,
        weightGram: preflight.weight, couriers: allowedCouriers,
      });
      rate = rates.find(r => r.courierCode === shipping.courierCode && r.service === shipping.service) || null;
      if (!rate) throw new CheckoutError("Layanan pengiriman berubah. Cek ongkir kembali.", 409);
    } else if (shipping) {
      throw new CheckoutError("Produk digital tidak memerlukan ongkir.", 422);
    }

    const shippingCost = rate?.cost || 0;
    const total = preflight.subtotal.plus(shippingCost);
    if (!total.isInteger() || total.lte(0) || total.gt(100_000_000)) {
      throw new CheckoutError("Total pembayaran tidak valid.", 422);
    }
    const orderNumber = "EC-" + Date.now().toString(36).toUpperCase() + "-" + randomBytes(5).toString("hex").toUpperCase();

    const order = await prisma.$transaction(async tx => {
      const refreshed = await tx.product.findMany({
        where: { id: { in: items.map(item => item.productId) }, isPublished: true },
        select: {
          id: true, title: true, price: true, stock: true, type: true, weight: true,
          digitalAsset: { select: { id: true } },
        },
      });
      const current = summarize(items, new Map(refreshed.map(product => [product.id, product])));
      if (!current.subtotal.equals(preflight.subtotal) || current.weight !== preflight.weight ||
          current.physical !== preflight.physical ||
          current.lines.some((line, i) => line.product.id !== preflight.lines[i]?.product.id ||
            line.product.price.toString() !== preflight.lines[i]?.product.price.toString())) {
        throw new CheckoutError("Harga atau berat produk berubah. Ulangi checkout.", 409);
      }

      for (const item of items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, isPublished: true, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count !== 1) throw new CheckoutError("Stok tidak mencukupi. Perbarui keranjang.", 409);
      }

      const customer = await tx.customer.findUnique({ where: { id: account.customerId } });
      if (!customer) throw new CheckoutError("Akun pembeli tidak ditemukan.", 401);
      // Shipping contact belongs to the order; it must not overwrite the buyer's profile.
      if (address) {
        await lockAddressBook(tx,customer.id);
        const savedAddressLine=[address.addressLine,address.village].join(", ");
        const existingAddress=await tx.customerAddress.findFirst({where:{customerId:customer.id,recipient:address.recipient,phone:address.phone,
          addressLine:savedAddressLine,province:address.province,city:address.city,district:address.district,postalCode:address.postalCode},select:{id:true}});
        if(!existingAddress && await tx.customerAddress.count({where:{customerId:customer.id}})<20)await tx.customerAddress.create({
          data: {
            customerId: customer.id,
            label: "Alamat checkout",
            recipient: address.recipient, phone: address.phone,
            addressLine: savedAddressLine,
            province: address.province, city: address.city,
            district: address.district, postalCode: address.postalCode,
            isDefault: false,
          },
        });
        await ensureDefaultAddress(tx,customer.id);
      }
      return tx.order.create({
        data: {
          orderNumber,
          checkoutAccessHash: hash,
          status: "PENDING_PAYMENT",
          customerId: customer.id,
          subtotal: preflight.subtotal,
          shippingCost: preflight.physical ? new Prisma.Decimal(shippingCost) : new Prisma.Decimal(0),
          total,
          destinationDistrictId: address?.districtId ?? null,
          recipient: contact.recipient,
          phone: contact.phone,
          addressLine: address ? [address.addressLine, address.village].join(", ") : null,
          province: address?.province || null,
          city: address?.city || null,
          district: address?.district || null,
          postalCode: address?.postalCode || null,
          notes: address?.notes || null,
          items: { create: preflight.lines.map(line => ({
            productId: line.product.id,
            productTitle: line.product.title, productType: line.product.type,
            quantity: line.quantity, unitPrice: line.product.price,
            lineTotal: line.product.price.mul(line.quantity),
          })) },
          ...(rate ? { shipment: { create: {
            status: "PENDING",
            courier: rate.courier,
            service: rate.service,
            totalWeightGram: preflight.weight,
          } } } : {}),
          payment: { create: {
            providerOrderId: orderNumber,
            amount: total,
            state: "INITIALIZING",
          } },
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 20000 });
    createdId = order.id;

    const snap = await createSnapPayment({
      orderNumber,
      total: total.toNumber(),
      buyer: { name: contact.recipient, email: contact.email, phone: contact.phone },
      items: preflight.lines.map(line => ({
        productId: line.product.id, name: line.product.title,
        quantity: line.quantity, price: line.unitPrice,
      })),
      shippingCost,
    });
    // Never regress a verified PAID/CANCELLED state if a webhook races with token creation.
    await prisma.paymentTransaction.updateMany({
      where: { orderId: order.id, state: "INITIALIZING" },
      data: { redirectUrl: snap.redirectUrl, state: "PENDING" },
    });
    return NextResponse.json({
      orderId: order.id, orderNumber, redirectUrl: snap.redirectUrl,
      subtotal: preflight.subtotal.toFixed(2), shippingCost, total: total.toFixed(2),
      sandbox: process.env.MIDTRANS_IS_PRODUCTION !== "true",
    }, { status: 201, headers });
  } catch (error) {
    // If Snap is unavailable, do not leave inventory reserved for an unpayable order.
    if (createdId) {
      try { await abandonUnpayableOrder(createdId); }
      catch (cleanupError) { console.error("CRITICAL: checkout inventory cleanup failed", createdId, cleanupError); }
    }
    if (error instanceof CheckoutError || error instanceof MidtransError ||
        error instanceof ShippingRegionError || error instanceof ShippingRateError) {
      return jsonError(error.message, error.status);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2034", "P2002"].includes(error.code)) {
      return jsonError("Checkout diproses bersamaan atau stok berubah. Coba ulangi.", 409);
    }
    console.error("Checkout order creation failed", error);
    return jsonError("Gagal membuat pesanan. Silakan coba lagi.", 500);
  }
}
