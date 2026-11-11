"use client";

import Link from "next/link";
import { AccountMenu } from "@/components/account/account-menu";
import { useCallback, useEffect, useState } from "react";
import { PackageCheck, RefreshCw } from "lucide-react";
import { CHECKOUT_STORAGE_KEY, type CheckoutSession } from "@/lib/payment/constants";

type Order = {
  id: string; orderNumber: string; status: string; total: string | null; createdAt: string;
  payment: { state: string } | null;
  items: { productTitle: string; productType: string; quantity: number }[];
};

const money = (value: string | null) => value === null ? "—" :
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState(true);
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimSession, setClaimSession] = useState<CheckoutSession | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const reload = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/account/orders", { cache: "no-store" });
      if (res.status === 401) { window.location.assign("/account/login"); return; }
      const json: { orders?: Order[]; error?: string } = await res.json();
      if (!res.ok || !json.orders) throw new Error(json.error || "Gagal memuat pesanan.");
      setOrders(json.orders);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Gagal memuat pesanan."); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => {
    void reload();
    try {
      const raw = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
      if (!raw) return;
      const data: CheckoutSession = JSON.parse(raw);
      if (data.orderId && /^[a-f0-9]{64}$/.test(data.accessToken)) setClaimSession(data);
    } catch { /* Storage unavailable */ }
  }, [reload]);

  const claim = async () => {
    if (!claimSession) return;
    setClaimBusy(true); setError(""); setInfo("");
    try {
      const res = await fetch("/api/account/claim-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: claimSession.orderId, accessToken: claimSession.accessToken }),
      });
      const result: { error?: string } = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menautkan order lama.");
      setInfo("Pesanan lama berhasil ditautkan ke akun pembeli.");
      setClaimSession(null);
      await reload();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Gagal menautkan order."); }
    finally { setClaimBusy(false); }
  };

  return <main className="min-h-screen bg-[#f6f9ff] px-4 pb-16 pt-32 font-satoshi">
    <div className="mx-auto max-w-4xl space-y-6">
      <AccountMenu/>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-3xl font-extrabold">Pesanan Saya</h1>
          <p className="mt-2 text-sm text-slate-500">Lihat riwayat transaksi dan file digital dari perangkat mana pun setelah login.</p></div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void reload()} disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50">
            <RefreshCw size={16}/> Refresh</button>
        </div>
      </div>
      {claimSession && !orders.some(order => order.id === claimSession.orderId) && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
          <strong>Ada pesanan guest dari sesi sebelumnya.</strong>
          <p className="mt-1 text-slate-600">Kamu dapat menautkannya ke akun ini jika memang milikmu. Nomor order dan email saja tidak cukup untuk klaim.</p>
          <button onClick={() => void claim()} disabled={claimBusy}
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{claimBusy ? "Menautkan..." : "Tautkan pesanan lama"}</button>
        </div>
      )}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {info && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{info}</p>}
      <div className="overflow-hidden rounded-xl border bg-white">
        {busy ? <p className="p-8 text-sm text-slate-500">Memuat pesanan...</p> :
          orders.length === 0 ? <div className="p-10 text-center">
            <PackageCheck size={34} className="mx-auto text-slate-400"/>
            <p className="mt-3 font-semibold">Belum ada pesanan untuk akun ini.</p>
            <Link href="/product" className="mt-3 inline-block text-sm font-bold text-blue-600 underline">Mulai belanja</Link>
          </div> :
          <div className="divide-y">{orders.map(order => (
            <Link key={order.id} href={"/account/orders/" + encodeURIComponent(order.id)}
              className="block p-5 transition hover:bg-blue-50/40">
              <div className="flex flex-wrap justify-between gap-2">
                <strong className="text-blue-700">{order.orderNumber}</strong>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{order.status.replaceAll("_", " ")}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{order.items.map(item => item.productTitle + " × " + item.quantity).join(", ")}</p>
              <div className="mt-3 flex justify-between gap-3 text-sm">
                <span className="text-slate-500">{new Date(order.createdAt).toLocaleDateString("id-ID")}</span>
                <strong>{money(order.total)}</strong>
              </div>
            </Link>
          ))}</div>}
      </div>
    </div>
  </main>;
}
