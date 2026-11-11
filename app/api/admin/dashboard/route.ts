import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardWindow, fillDailySales, DASHBOARD_TIME_ZONE, type DashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  const days = Number(new URL(request.url).searchParams.get("days") ?? "30");
  if (![7, 30, 90].includes(days)) return NextResponse.json({ error: "Periode tidak valid." }, { status: 400, headers });
  const period = dashboardWindow(days);
  const paidWhere: Prisma.PaymentTransactionWhereInput = { state: "PAID", paidAt: { gte: period.start, lte: period.end }, order: { currency: "IDR" } };
  try {
    const [payments, orders, pendingPayment, needsProcessing, products, publishedProducts, lowStock, outOfStock, verifiedAccounts, recent, top, stockAlerts, daily] = await prisma.$transaction([
      prisma.paymentTransaction.aggregate({ where: paidWhere, _sum: { amount: true }, _count: { _all: true } }),
      prisma.order.count({ where: { createdAt: { gte: period.start, lte: period.end } } }),
      prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
      prisma.order.count({ where: { status: { in: ["PAID", "PROCESSING"] } } }),
      prisma.product.count(),
      prisma.product.count({ where: { isPublished: true } }),
      prisma.product.count({ where: { isPublished: true, type: "PHYSICAL", stock: { gt: 0, lte: 5 } } }),
      prisma.product.count({ where: { isPublished: true, type: "PHYSICAL", stock: { lte: 0 } } }),
      prisma.customerAccount.count({ where: { emailVerifiedAt: { not: null } } }),
      prisma.order.findMany({ where: { createdAt: { gte: period.start, lte: period.end } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 8,
        select: { id: true, orderNumber: true, status: true, total: true, currency: true, createdAt: true, customer: { select: { name: true } }, payment: { select: { state: true } } } }),
      prisma.orderItem.groupBy({ by: ["productId", "productTitle"], where: { order: { payment: { is: paidWhere } } },
        _sum: { quantity: true, lineTotal: true }, orderBy: [{ _sum: { quantity: "desc" } }, { productTitle: "asc" }], take: 5 }),
      prisma.product.findMany({ where: { isPublished: true, type: "PHYSICAL", stock: { lte: 5 } }, orderBy: [{ stock: "asc" }, { title: "asc" }], take: 6,
        select: { id: true, title: true, stock: true, imageUrl: true } }),
      prisma.$queryRaw<{ date: string; revenue: string; count: number }[]>`
        SELECT to_char(p."paidAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS date,
          SUM(p.amount)::text AS revenue, COUNT(*)::int AS count
        FROM payment_transactions p JOIN orders o ON o.id = p."orderId"
        WHERE p.state = 'PAID' AND o.currency = 'IDR'
          AND p."paidAt" >= ${period.start} AND p."paidAt" <= ${period.end}
        GROUP BY 1 ORDER BY 1`,
    ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    const data: DashboardData = {
      period: { days, start: period.start.toISOString(), end: period.end.toISOString(), timeZone: DASHBOARD_TIME_ZONE },
      summary: { revenue: payments._sum.amount?.toString() ?? "0", paidOrders: payments._count._all, orders, pendingPayment, needsProcessing,
        products, publishedProducts, lowStock, outOfStock, verifiedAccounts },
      dailySales: fillDailySales(period.start, days, daily),
      recentOrders: recent.map(order => ({ id: order.id, orderNumber: order.orderNumber, status: order.status, total: order.total?.toString() ?? null, currency: order.currency,
        createdAt: order.createdAt.toISOString(), customerName: order.customer.name, paymentState: order.payment?.state ?? null })),
      topProducts: top.map(item => ({ productId: item.productId, title: item.productTitle, quantity: item._sum?.quantity ?? 0, subtotal: item._sum?.lineTotal?.toString() ?? "0" })),
      stockAlerts,
    };
    return NextResponse.json({ data }, { headers });
  } catch (error) {
    console.error("Dashboard query failed", error);
    return NextResponse.json({ error: "Ringkasan toko belum dapat dimuat. Coba lagi." }, { status: 503, headers });
  }
}
