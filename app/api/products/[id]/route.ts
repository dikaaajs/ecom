import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    const product = await prisma.product.findFirst({
      where: { id, isPublished: true },
      include: { category: true, tags: true, images: true },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("GET /api/products/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

// Do not permit arbitrary updates on the public product endpoint.
export async function PATCH() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
