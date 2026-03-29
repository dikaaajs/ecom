import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import slugify from "slugify";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const product = await prisma.product.update({
      where: {
        id,
      },

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

        // CATEGORY (replace)
        category: categoryId
          ? {
              connect: { id: categoryId },
            }
          : {
              disconnect: true,
            },

        // TAGS (replace all)
        tags: {
          set: tagIds ? tagIds.map((id: string) => ({ id })) : [],
        },

        // IMAGES (replace all)
        images: {
          deleteMany: {},

          create: images
            ? images.map((url: string) => ({
                url,
              }))
            : [],
        },
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
      { message: "Failed to update product" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const {
      title,
      slug,
      description,
      price,
      stock,
      weight,
      length,
      width,
      height,
      imageUrl,
      categoryId,
    } = body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        title,
        slug: slugify(title),
        description,
        price,
        stock,
        weight,
        length,
        width,
        height,
        imageUrl,
        categoryId,
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Failed to update product" },
      { status: 500 },
    );
  }
}
