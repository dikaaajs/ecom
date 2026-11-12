export const DASHBOARD_TIME_ZONE = "Asia/Jakarta";
export function jakartaDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: DASHBOARD_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
export function dashboardWindow(days: number, now = new Date()) {
  const today = jakartaDay(now);
  const endDay = new Date(`${today}T00:00:00+07:00`);
  const start = new Date(endDay.getTime() - (days - 1) * 86400000);
  return { start, end: now, days };
}
export function fillDailySales(start: Date, days: number, rows: { date: string; revenue: string; count: number }[]) {
  const byDate = new Map(rows.map(row => [row.date, row]));
  return Array.from({ length: days }, (_, i) => {
    const date = jakartaDay(new Date(start.getTime() + i * 86400000));
    const row = byDate.get(date);
    return { date, revenue: row?.revenue ?? "0", count: row?.count ?? 0 };
  });
}
export const orderStatusLabels: Record<string, string> = {
  DRAFT: "Draft", PENDING_PAYMENT: "Menunggu pembayaran", PAID: "Sudah dibayar",
  PROCESSING: "Diproses", SHIPPED: "Dikirim", COMPLETED: "Selesai", CANCELLED: "Dibatalkan",
};
export type DashboardData = {
  period: { days: number; start: string; end: string; timeZone: string };
  summary: { revenue: string; paidOrders: number; orders: number; pendingPayment: number; needsProcessing: number;
    products: number; publishedProducts: number; lowStock: number; outOfStock: number; verifiedAccounts: number };
  dailySales: { date: string; revenue: string; count: number }[];
  recentOrders: { id: string; orderNumber: string; status: string; customerName: string; total: string | null; currency: string; createdAt: string; paymentState: string | null }[];
  topProducts: { productId: string | null; title: string; quantity: number; subtotal: string }[];
  stockAlerts: { id: string; title: string; stock: number; imageUrl: string | null }[];
};
