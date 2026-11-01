import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import slugify from "slugify";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();

  try {
    const tag = await prisma.tag.update({
      where: { id },
      data: {
        name: body.name,
        slug: slugify(body.name, { lower: true }),
        color: body.color,
      },
    });

    return NextResponse.json(tag);
  } catch (error: any) {
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.tag.delete({
    where: { id: id },
  });

  return NextResponse.json({ message: "Tag deleted" });
}
