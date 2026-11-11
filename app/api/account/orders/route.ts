import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "customer" || !session.user.id) {
    return NextResponse.json({ error: "Login pembeli diperlukan." }, { status: 401, headers });
  }
  try {
    const orders = await prisma.order.findMany({
      where: { customerId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, orderNumber: true, status: true, total: true, createdAt: true,
        payment: { select: { state: true } },
        items: { select: { productId: true, productTitle: true, productType: true, quantity: true } },
      },
    });
    return NextResponse.json({ orders }, { headers });
  } catch (error) {
    console.error("Customer order list error", error);
    return NextResponse.json({ error: "Tidak dapat memuat riwayat pesanan." }, { status: 500, headers });
  }
}
