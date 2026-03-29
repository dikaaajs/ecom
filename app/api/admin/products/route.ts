import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import slugify from "slugify";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filStock = searchParams.get("filStock");

    const where: any = {};
    if (filStock == "true") {
      where.inStock = true;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        category: true,
        tags: true,
        images: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: products,
        count: products.length,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching products:", error);

    if (error instanceof Error && error.message.includes("connect")) {
      return NextResponse.json(
        {
          success: false,
          error: "Service Unavailable",
          message: "Database connection failed",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch products",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      title,
      description,
      price,
      stock,
      weight,
      length,
      width,
      height,
      imageUrl,
      categoryId,
      tagIds,
      images,
      isPublished,
    } = body;

    const product = await prisma.product.create({
      data: {
        title,
        slug: slugify(title),
        description,

        price,
        stock: stock ?? 0,

        weight,
        length,
        width,
        height,

        imageUrl,

        isPublished: isPublished ?? true,

        category: categoryId
          ? {
              connect: { id: categoryId },
            }
          : undefined,

        tags: tagIds
          ? {
              connect: tagIds.map((id: string) => ({ id })),
            }
          : undefined,

        images: images
          ? {
              create: images.map((url: string) => ({
                url,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        tags: true,
        images: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to create product" },
      { status: 500 },
    );
  }
}

// DELETE /api/products
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { ids } = body as { ids: string[] };

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    // Hapus data berdasarkan array ID
    await prisma.product.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json(
      { message: "Products deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/products error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
