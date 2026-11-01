import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import slugify from "slugify";

export async function GET() {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });
  return NextResponse.json(tags);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();

  try {
    const tag = await prisma.tag.create({
      data: {
        name: body.name,
        slug: slugify(body.name, { lower: true }),
        color: body.color,
      },
    });

    return NextResponse.json(tag);
  } catch (error: any) {
    console.log(error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "Slug sudah digunakan, gunakan nama lain" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const { ids } = body as { ids: string[] };

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    // Hapus data berdasarkan array ID
    await prisma.tag.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json(
      { message: "tags deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/tags error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
