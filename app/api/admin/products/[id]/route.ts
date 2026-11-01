import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productInputSchema } from "@/lib/validations/product";
import { updateProduct } from "@/lib/services/products";

async function authorized() {
  return (await getServerSession(authOptions))?.user?.role === "admin";
}
type Context = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Context) {
  if (!(await authorized())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { id } = await params;
    const parsed = productInputSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid product", issues: parsed.error.flatten() }, { status: 400 });
    return NextResponse.json(await updateProduct(id, parsed.data));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}
export async function PATCH(req: Request, { params }: Context) {
  if (!(await authorized())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    if (!body || typeof body.isPublished !== "boolean" || Object.keys(body).some(key => key !== "isPublished")) {
      return NextResponse.json({ error: "Only isPublished can be patched" }, { status: 400 });
    }
    const { id } = await params;
    const data = await prisma.product.update({ where: { id }, data: { isPublished: body.isPublished } });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}
