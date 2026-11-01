import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const mediaInput = z.object({
  tagIds: z.array(z.string().min(1)).optional(),
  images: z.array(z.string().url().max(2048)).max(30).optional(),
}).strict();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const parsed = mediaInput.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid media payload" }, { status: 400 });
    }
    const { tagIds, images } = parsed.data;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(tagIds !== undefined && {
          tags: { set: tagIds.map((tagId) => ({ id: tagId })) },
        }),
        ...(images !== undefined && {
          images: {
            deleteMany: {},
            create: images.map((url) => ({ url })),
          },
        }),
      },
      include: { tags: true, images: true },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Failed to update product media:", error);
    return NextResponse.json({ error: "Failed to update media" }, { status: 500 });
  }
}
