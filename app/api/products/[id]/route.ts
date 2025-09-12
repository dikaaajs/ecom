import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || id.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request",
          message: "Product ID is required",
        },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: id,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: product,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching product:", error);

    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes("connect")) {
      return NextResponse.json(
        {
          success: false,
          error: "Service Unavailable",
          message: "Database connection failed",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch product",
      },
      { status: 500 }
    );
  }
}

// Update Product
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const { title, description, price, imageUrl, tags, category, inStock } =
      body;

    // Validasi sederhana
    if (!title || !price) {
      return NextResponse.json(
        { message: "Title and Price are required" },
        { status: 400 }
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        title,
        description,
        price: parseFloat(price),
        imageUrl,
        tags,
        category,
        inStock,
      },
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { message: err.message || "Failed to update product" },
      { status: 500 }
    );
  }
}
