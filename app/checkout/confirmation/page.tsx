"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, CreditCard, RefreshCw, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { CHECKOUT_STORAGE_KEY, type CheckoutSession } from "@/lib/payment/constants";

type OrderStatus = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: string;
  shippingCost: string | null;
  total: string | null;
  currency: string;
  createdAt: string;
  items: { productTitle: string; quantity: number; lineTotal: string; productType: string }[];
  payment: null | { state: string; paidAt: string | null; redirectUrl: string | null };
  shipment: null | { courier: string | null; service: string | null; status: string; trackingNumber: string | null };
};

const rupiah = (value: number | string | null) => value === null ? "—" :
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));

export default function OrderConfirmationPage() {
  const { clearCart } = useCart();
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (record: CheckoutSession, signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/checkout/orders/" + encodeURIComponent(record.orderId), {
        headers: { Authorization: "Bearer " + record.accessToken },
        cache: "no-store", signal,
      });
      const result: { order?: OrderStatus; error?: string } = await response.json();
      if (!response.ok || !result.order) throw new Error(result.error || "Tidak dapat memuat pesanan.");
      if (!signal?.aborted) {
        setOrder(result.order);
        if (["PAID", "PROCESSING", "SHIPPED", "COMPLETED"].includes(result.order.status)) clearCart();
      }
    } catch (caught) {
      if (!signal?.aborted) setError(caught instanceof Error ? caught.message : "Tidak dapat memeriksa pembayaran.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [clearCart]);

  useEffect(() => {
    const controller = new AbortController();
    try {
      const raw = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
      if (raw) {
        const value: CheckoutSession = JSON.parse(raw);
        if (/^[a-f0-9]{64}$/.test(value.accessToken) && value.orderId) {
          setSession(value);
          void load(value, controller.signal);
        } else {
          setError("Sesi pembayaran tidak valid.");
          setLoading(false);
        }
      } else {
        setError("Sesi pembayaran tidak ditemukan di tab ini.");
        setLoading(false);
      }
    } catch {
      setError("Sesi pembayaran tidak dapat dibaca.");
      setLoading(false);
    }
    return () => controller.abort();
  }, [load]);

  const paid = !!order && ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"].includes(order.status);
  const pending = order?.status === "PENDING_PAYMENT";
  const redirectUrl = order?.payment?.redirectUrl;
  const trustedPaymentUrl = !!redirectUrl && (() => {
    try { const url = new URL(redirectUrl); return url.protocol === "https:" &&
      ["app.sandbox.midtrans.com", "app.midtrans.com"].includes(url.hostname); }
    catch { return false; }
  })();

  return (
    <div className="min-h-screen bg-[#f6f9ff] px-4 pb-16 pt-32 font-satoshi">
      <main className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center gap-2">
          <ShoppingBag size={24} className="text-blue-600"/>
          <h1 className="text-2xl font-extrabold">Status pesanan</h1>
        </div>
        <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          {loading ? (
            <p role="status" className="flex items-center gap-2 text-sm text-slate-600"><RefreshCw size={16} className="animate-spin"/> Memeriksa pembayaran...</p>
          ) : error ? (
            <p role="alert" className="flex items-start gap-2 text-sm text-rose-700"><AlertTriangle size={19}/>{error}</p>
          ) : order ? (
            <>
              <div className="flex items-start gap-3">
                {paid ? <CheckCircle2 className="text-emerald-600" size={28}/> :
                  <Clock3 className="text-amber-600" size={28}/>}
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{paid ? "Pembayaran terverifikasi" :
                    pending ? "Menunggu pembayaran" : "Status: " + order.status}</h2>
                  <p className="mt-1 text-sm text-slate-500">Order {order.orderNumber}</p>
                  <p className="mt-1 text-sm text-slate-500">Total {rupiah(order.total)}</p>
                </div>
              </div>
              <div className="mt-5 divide-y border-y">
                {order.items.map((item, i) => (
                  <div className="flex justify-between gap-4 py-3 text-sm" key={i}>
                    <div><strong>{item.productTitle}</strong><p className="text-xs text-slate-500">{item.quantity} × {item.productType}</p></div>
                    <span>{rupiah(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
              {order.shipment && <p className="mt-4 text-sm text-slate-600">Pengiriman: {order.shipment.courier} · {order.shipment.service} · {order.shipment.status}</p>}
              {paid ? <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                Pembayaran tercatat di server. Pesanan fisik dapat diproses admin. Akses file digital masih memerlukan verifikasi identitas pembeli sebelum dapat diberikan.
              </p> : <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                Status hanya diperbarui oleh webhook Midtrans yang terverifikasi, bukan dari tampilan selesai bayar.
              </p>}
              {pending && trustedPaymentUrl && (
                <button type="button" onClick={() => window.location.assign(redirectUrl!)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">
                  <CreditCard size={18}/> Lanjutkan pembayaran Midtrans
                </button>
              )}
            </>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-4">
            {session && <button onClick={() => void load(session)} type="button" disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50">
              <RefreshCw size={15}/> Periksa status terbaru
            </button>}
            <Link href="/product" className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-blue-700 hover:underline">Kembali belanja</Link>
          </div>
        </section>
        <p className="text-xs leading-5 text-slate-500">Status bersifat privat dan hanya dapat dibuka dari sesi checkout tab yang sama. Simpan detail pesanan dan jangan bagikan token checkout.</p>
      </main>
    </div>
  );
}
