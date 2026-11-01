import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productInputSchema } from "@/lib/validations/product";
import { createProduct } from "@/lib/services/products";

async function authorized() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "admin";
}
export async function GET(req: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const onlyStock = new URL(req.url).searchParams.get("filStock") === "true";
  try {
    const data = await prisma.product.findMany({
      where: onlyStock ? { stock: { gt: 0 } } : {},
      include: { category: true, tags: true, images: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data, count: data.length }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
export async function POST(req: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const parsed = productInputSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid product", issues: parsed.error.flatten() }, { status: 400 });
    const data = await createProduct(parsed.data);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
export async function DELETE(req: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { z } = await import("zod");
    const parsed = z.object({ ids: z.array(z.string().min(1)).min(1).max(100) }).safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid product IDs" }, { status: 400 });
    await prisma.product.deleteMany({ where: { id: { in: parsed.data.ids } } });
    return NextResponse.json({ message: "Products deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete products" }, { status: 500 });
  }
}
