import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { summarizeDelivery } from "@/lib/delivery";
import { getSavedShippingOrigin } from "@/lib/shipping/get-origin";
export const dynamic = "force-dynamic";
const inputSchema = z.object({
  items: z.array(z.object({ productId: z.string().min(1).max(128), quantity: z.number().int().min(1).max(99) })).min(1).max(50),
}).strict();
export async function POST(req: Request) {
  try {
    const parsed = inputSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid cart items" }, { status: 400 });
    const items = parsed.data.items;
    if (new Set(items.map(i => i.productId)).size !== items.length) {
      return NextResponse.json({ error: "Duplicate products in cart" }, { status: 400 });
    }
    const products = await prisma.product.findMany({
      where: { id: { in: items.map(i => i.productId) }, isPublished: true },
      select: { id: true, title: true, imageUrl: true, price: true, stock: true, type: true, weight: true },
    });
    const byId = new Map(products.map(p => [p.id, p]));
    const lines = items.map(item => {
      const product = byId.get(item.productId);
      if (!product) return { productId: item.productId, quantity: item.quantity, available: false, reason: "Product unavailable" };
      if (product.stock < item.quantity) return { productId: item.productId, quantity: item.quantity, available: false, reason: "Insufficient stock" };
      return {
        productId: product.id, quantity: item.quantity, available: true,
        title: product.title, imageUrl: product.imageUrl, type: product.type,
        weight: product.type === "DIGITAL" ? 0 : product.weight,
        unitPrice: product.price.toString(),
        lineTotal: product.price.mul(item.quantity).toString(),
      };
    });
    const valid = lines.every(line => line.available);
    const subtotal = lines.reduce((sum, line) => sum + (line.available && "lineTotal" in line ? Number(line.lineTotal) : 0), 0);
    const delivery = summarizeDelivery(items.flatMap(item => {
      const product = byId.get(item.productId);
      return product && product.stock >= item.quantity ? [{ productId: item.productId, type: product.type, quantity: item.quantity, weightGram: product.type === "PHYSICAL" ? product.weight : 0 }] : [];
    }));
    const shippingOriginConfigured = delivery.shippingRequired ? (await getSavedShippingOrigin()) !== null : true;
    const checkoutBlockers = [
      ...(!valid ? ["INVALID_CART"] : []),
      ...(delivery.shippingRequired && !shippingOriginConfigured ? ["SHIPPING_ORIGIN_MISSING"] : []),
      ...(delivery.shippingRequired ? ["SHIPPING_RATE_UNAVAILABLE"] : []),
      "CHECKOUT_NOT_IMPLEMENTED",
    ];
    return NextResponse.json({
      valid, lines, subtotal: subtotal.toFixed(2),
      shippingOriginConfigured, checkoutReady: false, checkoutBlockers,
      delivery,
      shippingRequired: lines.some(line => line.available && "type" in line && line.type === "PHYSICAL"),
      shipping: null, total: null,
      note: "Quote only. Shipping and payments are not yet implemented. Prices and stock will be revalidated at checkout.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Cart quote failed", error);
    return NextResponse.json({ error: "Unable to calculate cart" }, { status: 500 });
  }
}
