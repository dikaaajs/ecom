import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { isPublished } = await req.json();

    const product = await prisma.product.update({
      where: { id },
      data: {
        isPublished,
      },
      select: {
        id: true,
        isPublished: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Failed to update publish status" },
      { status: 500 },
    );
  }
}
