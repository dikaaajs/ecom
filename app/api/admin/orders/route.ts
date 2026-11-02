import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const query = z.object({
    page: z.coerce.number().int().min(1).max(100000).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    status: z.enum(["DRAFT","PENDING_PAYMENT","PAID","PROCESSING","SHIPPED","COMPLETED","CANCELLED"]).optional(),
  }).safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
  if (!query.success) return NextResponse.json({ error: "Invalid filters" }, { status: 400 });

  try {
    const { page, limit, status } = query.data;
    const where = status ? { status } : {};
    const [count, orders] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, orderNumber: true, status: true, currency: true,
          subtotal: true, shippingCost: true, total: true, createdAt: true,
          customer: { select: { id: true, name: true, email: true } },
          _count: { select: { items: true } },
        },
      }),
    ]);
    return NextResponse.json({ success: true, data: orders, count, page, limit }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Failed to list orders", error);
    return NextResponse.json({ error: "Unable to load orders" }, { status: 500 });
  }
}
