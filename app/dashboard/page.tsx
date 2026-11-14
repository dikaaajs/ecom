"use client";
import { useToastFeedback } from "@/lib/hooks/use-toast-feedback";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Banknote, ShoppingBag, Clock3, PackageCheck, RefreshCw, ArrowUpRight, Package, Users, AlertTriangle } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ShippingSetupNotice } from "@/components/shipping/shipping-setup-notice";
import { orderStatusLabels, type DashboardData } from "@/lib/dashboard";

const money = (value: string | number | null, currency = "IDR") => {
  if(value===null) return "Belum dihitung";
  try { return new Intl.NumberFormat("id-ID",{style:"currency",currency,maximumFractionDigits:0}).format(Number(value)); }
  catch { return new Intl.NumberFormat("id-ID").format(Number(value))+" "+currency; }
};
const dateLabel = (value: string) => new Intl.DateTimeFormat("id-ID",{timeZone:"Asia/Jakarta",day:"numeric",month:"short"}).format(new Date(value.length===10 ? value+"T00:00:00+07:00" : value));
const panel = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6";

export default function Page() {
  const [days,setDays] = useState(30);
  const [data,setData] = useState<DashboardData | null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useToastFeedback("error", "dashboard-load-error");
  const [version,setVersion] = useState(0);
  useEffect(()=>{
    const controller = new AbortController();
    setLoading(true);setError("");setData(null);
    void fetch(`/api/admin/dashboard?days=${days}`,{cache:"no-store",signal:controller.signal}).then(async response=>{
      const body = await response.json();
      if(!response.ok) throw Error(response.status===403 ? "Sesi admin diperlukan. Silakan masuk kembali." : body.error || "Data tidak dapat dimuat.");
      if(!controller.signal.aborted) setData(body.data);
    }).catch(cause=>{if(!controller.signal.aborted)setError(cause instanceof Error ? cause.message : "Data tidak dapat dimuat.");})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[days,version]);
  const summary = data?.summary;
  const cards = summary ? [
    {label:"Pembayaran diterima",value:money(summary.revenue),detail:`${summary.paidOrders} transaksi berhasil · ${days} hari`,icon:Banknote,href:"/dashboard/orders"},
    {label:"Pesanan masuk",value:summary.orders.toLocaleString("id-ID"),detail:`Semua status · ${days} hari`,icon:ShoppingBag,href:"/dashboard/orders"},
    {label:"Menunggu pembayaran",value:summary.pendingPayment.toLocaleString("id-ID"),detail:"Semua periode · status menunggu bayar",icon:Clock3,href:"/dashboard/orders"},
    {label:"Perlu diproses",value:summary.needsProcessing.toLocaleString("id-ID"),detail:"Semua periode · dibayar / diproses",icon:PackageCheck,href:"/dashboard/orders"},
  ] : [];
  return <main className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Ringkasan toko</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Dashboard</h1><p className="mt-2 text-sm text-slate-500">Pantau transaksi dan pekerjaan yang perlu ditindaklanjuti.</p></div>
        <div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-sm font-medium">Periode<select value={days} onChange={e=>setDays(Number(e.target.value))} className="rounded-xl border bg-white px-3 py-2.5"><option value={7}>7 hari</option><option value={30}>30 hari</option><option value={90}>90 hari</option></select></label><button onClick={()=>setVersion(v=>v+1)} disabled={loading} className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""}/>Perbarui</button></div>
      </div>
      <ShippingSetupNotice />
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error}<button onClick={()=>setVersion(v=>v+1)} className="ml-3 font-semibold underline">Coba lagi</button></div>}
      {loading && <div role="status" aria-label="Memuat ringkasan toko" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0,1,2,3].map(n=><div key={n} className="h-40 animate-pulse rounded-2xl border bg-slate-200/60"/>)}<span className="sr-only">Memuat data toko…</span></div>}
      {data && summary && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card=><Link key={card.label} href={card.href} className={panel+" group transition hover:border-blue-300"}><div className="flex items-center justify-between"><span className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><card.icon size={20}/></span><ArrowUpRight size={17} className="text-slate-400 group-hover:text-blue-600"/></div><p className="mt-5 text-sm text-slate-500">{card.label}</p><p className="mt-1 break-words text-2xl font-bold tabular-nums">{card.value}</p><p className="mt-3 text-xs text-slate-500">{card.detail}</p></Link>)}</div>
        <div className="flex flex-wrap gap-x-7 gap-y-3 rounded-xl border bg-white px-5 py-4 text-sm"><Link href="/dashboard/product" className="flex items-center gap-2"><Package size={17} className="text-blue-600"/><strong>{summary.publishedProducts}</strong> produk tayang <span className="text-slate-400">/ {summary.products} total</span></Link><span className="flex items-center gap-2"><Users size={17} className="text-blue-600"/><strong>{summary.verifiedAccounts}</strong> akun pembeli terverifikasi</span><Link href="/dashboard/product" className="flex items-center gap-2 text-amber-700"><AlertTriangle size={17}/>{summary.lowStock} stok menipis · {summary.outOfStock} habis</Link></div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className={panel+" min-w-0"}><div className="mb-5 flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-lg font-bold">Pembayaran berhasil</h2><p className="mt-1 text-sm text-slate-500">{dateLabel(data.period.start)} – {dateLabel(data.period.end)} · WIB</p></div><span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Rupiah (IDR)</span></div>
            {summary.paidOrders===0 ? <div className="flex h-64 items-center justify-center rounded-xl border border-dashed bg-slate-50 px-5 text-center text-sm text-slate-500">Belum ada pembayaran berhasil pada periode ini.</div> : <div className="h-64 min-w-0" role="img" aria-label={`Grafik pembayaran berhasil ${days} hari, total ${money(summary.revenue)}`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.dailySales.map(row=>({...row,revenue:Number(row.revenue)}))} margin={{top:10,right:8,left:0,bottom:0}}><defs><linearGradient id="dashboard-sales-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.25}/><stop offset="100%" stopColor="#2563eb" stopOpacity={0.02}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date" tickFormatter={dateLabel} tickLine={false} axisLine={false} minTickGap={35} tick={{fontSize:11}}/><YAxis width={64} tickFormatter={n=>new Intl.NumberFormat("id-ID",{notation:"compact",maximumFractionDigits:1}).format(n)} tickLine={false} axisLine={false} tick={{fontSize:11}}/><Tooltip labelFormatter={value=>dateLabel(String(value))} formatter={value=>[money(Number(value)),"Diterima"]}/><Area type="linear" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#dashboard-sales-fill)"/></AreaChart></ResponsiveContainer></div>}
            <p className="mt-4 text-xs leading-5 text-slate-500">Dihitung dari pembayaran berhasil berdasarkan waktu pembayaran, termasuk ongkir. Bukan laba bersih; biaya layanan dan refund belum dicatat.</p>
          </section>
          <section className={panel}><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">Produk terlaris</h2><span className="text-xs text-slate-400">{days} hari</span></div>{data.topProducts.length ? <ol className="space-y-5">{data.topProducts.map((product,i)=><li key={`${product.productId}-${product.title}`} className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">{i+1}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{product.title}</p><p className="mt-1 text-xs text-slate-500">{product.quantity} unit · {money(product.subtotal)}</p></div></li>)}</ol> : <p className="py-12 text-center text-sm text-slate-500">Belum ada produk terjual dari pembayaran berhasil pada periode ini.</p>}<p className="mt-5 text-xs text-slate-400">Diurutkan menurut jumlah unit. Nilai produk tidak termasuk ongkir.</p></section>
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className={panel+" min-w-0"}><div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Pesanan terbaru</h2><p className="mt-1 text-xs text-slate-500">Maksimal 8 pesanan masuk dalam {days} hari terakhir</p></div><Link href="/dashboard/orders" className="shrink-0 text-sm font-semibold text-blue-600">Lihat semua →</Link></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs text-slate-500"><th className="pb-3 pr-4 font-medium">Pesanan / pembeli</th><th className="pb-3 pr-4 font-medium">Status</th><th className="pb-3 text-right font-medium">Total</th></tr></thead><tbody>{data.recentOrders.map(order=><tr key={order.id} className="border-b last:border-0"><td className="py-4 pr-4"><Link href={`/dashboard/orders/${encodeURIComponent(order.id)}`} className="font-semibold text-blue-700 hover:underline">{order.orderNumber}</Link><p className="mt-1 text-xs text-slate-500">{order.customerName} · {dateLabel(order.createdAt)}</p></td><td className="py-4 pr-4"><span className={"inline-block rounded-lg px-2 py-1 text-xs font-medium "+(order.status==="CANCELLED" ? "bg-red-50 text-red-700" : ["PAID","COMPLETED"].includes(order.status) ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}>{orderStatusLabels[order.status] || order.status}</span></td><td className="py-4 text-right font-semibold tabular-nums">{money(order.total,order.currency)}</td></tr>)}</tbody></table>{!data.recentOrders.length && <p className="py-12 text-center text-sm text-slate-500">Belum ada pesanan pada periode ini.</p>}</div></section>
          <section className={panel}><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">Perhatian stok</h2><Link href="/dashboard/product" className="text-sm font-semibold text-blue-600">Kelola →</Link></div><p className="mb-5 text-xs leading-5 text-slate-500">Produk fisik yang tayang dengan stok maksimal 5 unit, termasuk stok habis.</p>{data.stockAlerts.length ? <ul className="space-y-4">{data.stockAlerts.map(product=><li key={product.id}><Link href={`/dashboard/product/${encodeURIComponent(product.id)}`} className="flex items-center gap-3 rounded-xl border p-3 hover:border-blue-300">{product.imageUrl ? <img src={product.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-contain"/> : <Package size={28} className="shrink-0 text-slate-400"/>}<span className="min-w-0 flex-1 text-sm font-medium">{product.title}</span><span className={"shrink-0 text-xs font-bold "+(product.stock<=0 ? "text-red-600" : "text-amber-700")}>{product.stock<=0 ? "Habis" : `${product.stock} unit`}</span></Link></li>)}</ul> : <div className="rounded-xl bg-emerald-50 px-4 py-7 text-center text-sm text-emerald-800">Tidak ada produk tayang dengan stok menipis atau habis.</div>}</section>
        </div>
        <p className="text-xs text-slate-400">Diperbarui {new Intl.DateTimeFormat("id-ID",{timeZone:"Asia/Jakarta",dateStyle:"medium",timeStyle:"short"}).format(new Date(data.period.end))} WIB · status pekerjaan dan stok menampilkan kondisi saat ini.</p>
      </>}
    </div>
  </main>;
}
