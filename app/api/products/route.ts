import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const inStock = searchParams.get("filStock") === "true";
    const products = await prisma.product.findMany({
      where: {
        isPublished: true,
        ...(inStock ? { stock: { gt: 0 } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { category: true, tags: true, images: true },
    });
    return NextResponse.json({ success: true, data: products, count: products.length });
  } catch (error) {
    console.error("GET /api/products:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch products" }, { status: 500 });
  }
}

// Product mutations belong to /api/admin/products; deny legacy public mutations.
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
