"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, RefreshCw } from "lucide-react";
type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  subtotal: string;
  total: string | null;
  createdAt: string;
  customer: { name: string; email: string };
  _count: { items: number };
  shipment: null | { status: string; courier: string | null; service: string | null; trackingNumber: string | null };
};
const rupiah = (v: string | number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(v));

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError("");
      try {
        const search = new URLSearchParams({ page: String(page), limit: "20" });
        if (status) search.set("status", status);
        const res = await fetch("/api/admin/orders?" + search.toString(), { cache: "no-store", signal: controller.signal });
        if (!res.ok) throw new Error("Unable to load orders");
        const data = await res.json();
        setOrders(data.data);
        setCount(data.count);
      } catch { if (!controller.signal.aborted) setError("Failed to load orders. Please try again."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [page, status, refresh]);
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Order Management</h1><p className="mt-1 text-sm text-muted-foreground">Customer orders and processing status.</p></div>
        <button onClick={() => setRefresh(v => v + 1)} type="button" className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm"><RefreshCw size={16} /> Refresh</button>
      </div>
      <div className="flex items-center gap-3">
        <label htmlFor="order-status" className="text-sm font-medium">Status</label>
        <select id="order-status" className="rounded-lg border bg-background px-3 py-2 text-sm" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All orders</option>
          {["DRAFT","PENDING_PAYMENT","PAID","PROCESSING","SHIPPED","COMPLETED","CANCELLED"].map(value => <option value={value} key={value}>{value.replaceAll("_", " ")}</option>)}
        </select>
        <span className="ml-auto text-sm text-muted-foreground">{count} orders</span>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b bg-muted/30"><tr>{["Order","Customer","Items","Subtotal","Status","Shipment","Created","Action"].map(v => <th key={v} className="p-4 font-semibold">{v}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">Loading orders...</td></tr> :
              error ? <tr><td colSpan={6} role="alert" className="p-10 text-center text-red-600">{error}</td></tr> :
              orders.length === 0 ? <tr><td colSpan={6} className="p-12 text-center"><Package className="mx-auto mb-3 text-muted-foreground" size={32}/><p className="font-medium">No orders yet</p><p className="mt-1 text-muted-foreground">Orders will appear here once checkout is activated.</p></td></tr> :
              orders.map(order => <tr className="border-b last:border-0" key={order.id}>
                <td className="p-4 font-semibold"><Link href={"/dashboard/orders/" + encodeURIComponent(order.id)} className="text-blue-700 hover:underline">{order.orderNumber}</Link></td>
                <td className="p-4"><div className="font-medium">{order.customer.name}</div><div className="text-xs text-muted-foreground">{order.customer.email}</div></td>
                <td className="p-4">{order._count.items}</td>
                <td className="p-4">{rupiah(order.subtotal)}</td>
                <td className="p-4"><span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{order.status.replaceAll("_", " ")}</span></td>
                <td className="p-4">{order.shipment ? <><strong className="block text-xs">{order.shipment.status}</strong><span className="text-xs text-muted-foreground">{order.shipment.courier ? order.shipment.courier + " · " + (order.shipment.service || "") : "Belum pilih kurir"}</span></> : <span className="text-xs text-muted-foreground">Belum ada</span>}</td>
                <td className="p-4">{new Date(order.createdAt).toLocaleDateString("id-ID")}</td>
                <td className="p-4"><Link href={"/dashboard/orders/" + encodeURIComponent(order.id)} className="rounded-lg border px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">Detail</Link></td>
              </tr>)
            }
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-3">
        <button type="button" disabled={page === 1 || loading} onClick={() => setPage(v => v - 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Previous</button>
        <span className="text-sm">Page {page}</span>
        <button type="button" disabled={page * 20 >= count || loading} onClick={() => setPage(v => v + 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}
