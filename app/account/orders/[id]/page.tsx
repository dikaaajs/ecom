"use client";
import { toast } from "@/lib/notify";
import { useToastFeedback } from "@/lib/hooks/use-toast-feedback";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";

type Order = {
  id: string; orderNumber: string; status: string; total: string | null; subtotal: string;
  shippingCost: string | null;
  items: { productId: string | null; productTitle: string; productType: "PHYSICAL" | "DIGITAL"; quantity: number; lineTotal: string }[];
  payment: null | { state: string; paidAt: string | null; redirectUrl: string | null };
  shipment: null | { status: string; courier: string | null; service: string | null; trackingNumber: string | null };
};

const currency = (value: string | null) => value === null ? "—" :
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));

export default function AccountOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useToastFeedback("error", "buyer-order-error");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      // NextAuth customer session cookie proves identity; no tab token required.
      const res = await fetch("/api/checkout/orders/" + encodeURIComponent(id), { cache: "no-store" });
      const json: { order?: Order; error?: string } = await res.json();
      if (res.status === 401) { window.location.assign("/account/login"); return; }
      if (!res.ok || !json.order) throw new Error(json.error || "Pesanan tidak tersedia.");
      setOrder(json.order);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal memuat pesanan.");
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const download = async (productId: string) => {
    if (downloading) return;
    setDownloading(productId); setError("");
    try {
      const res = await fetch("/api/checkout/orders/" + encodeURIComponent(id) + "/digital-download", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }), cache: "no-store",
      });
      const json: { url?: string; error?: string } = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || "Unduhan gagal.");
      const url = new URL(json.url);
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!base || url.protocol !== "https:" || url.origin !== new URL(base).origin) {
        throw new Error("URL unduhan tidak tepercaya.");
      }
      const anchor = document.createElement("a");
      anchor.href = url.href; anchor.target = "_blank"; anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      toast.info("Tautan unduhan dibuka. Periksa tab baru atau daftar unduhan browser.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "File tidak bisa diunduh.");
    } finally { setDownloading(null); }
  };

  const paid = !!order && ["PAID","PROCESSING","SHIPPED","COMPLETED"].includes(order.status) &&
    order.payment?.state === "PAID";
  return <main className="min-h-screen bg-[#f6f9ff] px-4 pb-16 pt-32 font-satoshi">
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm font-bold text-blue-700"><ArrowLeft size={16}/> Kembali ke Pesanan Saya</Link>
      <div className="flex justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">Detail Pesanan</h1><p className="mt-1 text-sm text-slate-500">{order?.orderNumber || id}</p></div>
        <button type="button" disabled={loading} onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-50"><RefreshCw size={16}/> Refresh</button>
      </div>
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {loading ? <p className="text-sm text-slate-500">Memuat detail pesanan...</p> :
          !order ? <p className="text-sm text-slate-500">Pesanan tidak ditemukan atau tidak termasuk akun ini.</p> :
          <>
            <div className="flex justify-between gap-3"><strong>Status pesanan</strong><span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">{order.status}</span></div>
            <div className="mt-5 divide-y border-y">
              {order.items.map((item, i) => <div key={i} className="flex justify-between gap-3 py-4">
                <div className="min-w-0"><strong>{item.productTitle}</strong>
                  <p className="mt-1 text-xs text-slate-500">{item.productType} × {item.quantity}</p>
                  {item.productType === "DIGITAL" && paid && item.productId && (
                    <button type="button" disabled={!!downloading} onClick={() => void download(item.productId!)}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                      <Download size={15}/>{downloading === item.productId ? "Menyiapkan..." : "Unduh file"}
                    </button>
                  )}
                  {item.productType === "DIGITAL" && !paid && <p className="mt-2 text-xs text-amber-700">Unduhan tersedia setelah pembayaran terverifikasi.</p>}
                </div>
                <strong className="shrink-0 text-sm">{currency(item.lineTotal)}</strong>
              </div>)}
            </div>
            <div className="mt-4 flex justify-between text-sm"><span>Subtotal</span><strong>{currency(order.subtotal)}</strong></div>
            <div className="mt-2 flex justify-between text-sm"><span>Ongkir</span><strong>{currency(order.shippingCost)}</strong></div>
            <div className="mt-3 flex justify-between border-t pt-3"><strong>Total</strong><strong>{currency(order.total)}</strong></div>
            {order.shipment && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">Pengiriman: {order.shipment.courier || "—"} · {order.shipment.service || "—"} · {order.shipment.status} {order.shipment.trackingNumber ? " · Resi " + order.shipment.trackingNumber : ""}</p>}
            {order.status === "PENDING_PAYMENT" && order.payment?.redirectUrl && (() => {
              try {
                const url = new URL(order.payment.redirectUrl);
                if (url.protocol !== "https:" || !["app.sandbox.midtrans.com","app.midtrans.com"].includes(url.hostname)) return null;
                return <button type="button" onClick={() => window.location.assign(url.href)}
                  className="mt-4 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white">Lanjutkan pembayaran</button>;
              } catch { return null; }
            })()}
          </>}
      </div>
    </div>
  </main>;
}
