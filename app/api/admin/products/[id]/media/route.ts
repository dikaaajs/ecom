import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { tagIds, images } = await req.json();

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(tagIds && {
          tags: {
            set: tagIds.map((id: string) => ({ id })),
          },
        }),

        ...(images && {
          images: {
            deleteMany: {},
            create: images.map((url: string) => ({
              url,
            })),
          },
        }),
      },
      include: {
        tags: true,
        images: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Failed to update media" },
      { status: 500 },
    );
  }
}
