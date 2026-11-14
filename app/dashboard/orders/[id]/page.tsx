"use client";
import { toast } from "@/lib/notify";
import { useToastFeedback } from "@/lib/hooks/use-toast-feedback";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle, ArrowLeft, CheckCircle2, ClipboardList, LoaderCircle,
  Package, RefreshCw, Send, Truck,
} from "lucide-react";

type OrderItem = {
  id: string;
  productTitle: string;
  productType: "PHYSICAL" | "DIGITAL";
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};
type ShipmentStatus = "PENDING" | "READY" | "SHIPPED" | "DELIVERED" | "RETURNED";
type Shipment = {
  id: string;
  status: ShipmentStatus;
  courier: string | null;
  service: string | null;
  trackingNumber: string | null;
  totalWeightGram: number;
  shippedAt: string | null;
  deliveredAt: string | null;
  updatedAt: string;
};
type OrderDetail = {
  id: string;
  orderNumber: string;
  status: "DRAFT" | "PENDING_PAYMENT" | "PAID" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED";
  currency: string;
  subtotal: string;
  shippingCost: string | null;
  total: string | null;
  notes: string | null;
  recipient: string | null;
  phone: string | null;
  addressLine: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  postalCode: string | null;
  customer: { name: string; email: string; phone: string | null };
  items: OrderItem[];
  shipment: Shipment | null;
  createdAt: string;
};
type Action =
  | { action: "PREPARE"; courier: string; service: string }
  | { action: "SHIP"; trackingNumber: string }
  | { action: "DELIVER" };

const money = (value: string | number | null) => value === null ? "—" :
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
const date = (input: string | null | undefined) => input ?
  new Date(input).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useToastFeedback("error", "shipment-error");
  const [notice, setNotice] = useToastFeedback("success", "shipment-success");
  const [courier, setCourier] = useState("");
  const [service, setService] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/orders/" + encodeURIComponent(id), { cache: "no-store", signal });
      const body: { data?: OrderDetail; error?: string } = await res.json();
      if (!res.ok || !body.data) throw new Error(body.error || "Gagal mengambil detail pesanan");
      if (signal?.aborted) return;
      setOrder(body.data);
      setCourier(body.data.shipment?.courier || "");
      setService(body.data.shipment?.service || "");
      setTrackingNumber(body.data.shipment?.trackingNumber || "");
    } catch (caught) {
      if (!signal?.aborted) setError(caught instanceof Error ? caught.message : "Gagal mengambil data");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const changeShipment = async (payload: Action) => {
    if (!order || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/orders/" + encodeURIComponent(order.id) + "/shipment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body: { success?: boolean; error?: string } = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error || "Perubahan status pengiriman gagal");
      setNotice(payload.action === "PREPARE" ? "Paket sudah ditandai siap dikirim." :
        payload.action === "SHIP" ? "Resi disimpan dan paket ditandai dikirim." :
          "Paket ditandai diterima.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tidak dapat memperbarui pengiriman");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !order) return (
    <div role="status" className="flex items-center gap-2 p-8 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18}/> Memuat pesanan...</div>
  );

  if (!order) return (
    <div className="space-y-4 p-6"><Link href="/dashboard/orders" className="text-sm font-semibold text-blue-600 underline">Kembali ke pesanan</Link>
      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error || "Pesanan tidak ditemukan"}</p>
    </div>
  );

  const physicalCount = order.items.filter(item => item.productType === "PHYSICAL").reduce((sum, item) => sum + item.quantity, 0);
  const digitalCount = order.items.filter(item => item.productType === "DIGITAL").reduce((sum, item) => sum + item.quantity, 0);
  const status = order.shipment?.status || "PENDING";
  const canPrepare = physicalCount > 0 && ["PAID", "PROCESSING"].includes(order.status) && !order.shipment?.status;
  const canPrepareExisting = physicalCount > 0 && ["PAID", "PROCESSING"].includes(order.status) && status === "PENDING";
  const canShip = order.status === "PROCESSING" && status === "READY";
  const canDeliver = order.status === "SHIPPED" && status === "SHIPPED" && !!order.shipment?.trackingNumber;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/dashboard/orders" className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"><ArrowLeft size={16}/> Semua pesanan</Link>
          <h1 className="text-2xl font-extrabold text-slate-900">Pesanan {order.orderNumber}</h1>
          <p className="mt-1 text-sm text-slate-500">Dibuat {date(order.createdAt)} · Status order: <strong>{order.status}</strong></p>
        </div>
        <button type="button" disabled={loading || saving} onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"><RefreshCw size={16}/> Muat ulang</button>
      </div>


      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><ClipboardList size={19}/> Item pesanan</h2>
            <div className="divide-y">
              {order.items.map(item => (
                <div key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div><p className="font-semibold text-slate-900">{item.productTitle}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.productType === "PHYSICAL" ? "Fisik" : "Digital"} · {item.quantity} × {money(item.unitPrice)}</p></div>
                  <strong className="shrink-0 text-sm">{money(item.lineTotal)}</strong>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><strong>{money(order.subtotal)}</strong></div>
              <div className="flex justify-between"><span>Ongkir</span><strong>{money(order.shippingCost)}</strong></div>
              <div className="flex justify-between border-t pt-2 text-base"><span className="font-bold">Total</span><strong>{money(order.total)}</strong></div>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-bold">Penerima &amp; alamat</h2>
            <p className="text-sm font-semibold text-slate-800">{order.recipient || order.customer.name}</p>
            <p className="mt-1 text-sm text-slate-600">{order.phone || order.customer.phone || "Nomor HP belum tersedia"}</p>
            <p className="mt-1 text-sm text-slate-600">{order.customer.email}</p>
            {physicalCount > 0 ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {[order.addressLine, order.district, order.city, order.province, order.postalCode].filter(Boolean).join(", ") || "Alamat pengiriman belum tersedia"}
              </p>
            ) : <p className="mt-3 text-sm text-slate-500">Produk digital tidak memerlukan alamat pengiriman fisik.</p>}
            {!!order.notes && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">Catatan: {order.notes}</p>}
          </section>
        </div>

        <aside className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2"><Truck size={22} className="text-blue-600"/><h2 className="text-lg font-bold">Pengiriman fisik</h2></div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">Fisik: {physicalCount}</span>
            {digitalCount > 0 && <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">Digital: {digitalCount}</span>}
          </div>

          {physicalCount === 0 ? (
            <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">Pesanan ini hanya berisi produk digital. Tidak perlu kurir atau resi.</p>
          ) : (
            <>
              <div className="rounded-xl bg-slate-50 p-4 text-sm">
                <div className="flex items-center justify-between"><span>Status paket</span><strong>{status}</strong></div>
                <div className="mt-2 flex items-center justify-between"><span>Berat tercatat</span><strong>{order.shipment ? order.shipment.totalWeightGram + " gram" : "Belum dicatat"}</strong></div>
                {order.shipment?.courier && <p className="mt-2">Kurir: <strong>{order.shipment.courier} · {order.shipment.service}</strong></p>}
                {order.shipment?.trackingNumber && <p className="mt-2 break-all">No. resi: <strong>{order.shipment.trackingNumber}</strong></p>}
                {order.shipment?.shippedAt && <p className="mt-2">Dikirim: {date(order.shipment.shippedAt)}</p>}
                {order.shipment?.deliveredAt && <p className="mt-2">Diterima: {date(order.shipment.deliveredAt)}</p>}
              </div>

              {(canPrepare || canPrepareExisting) && (
                <form onSubmit={e => { e.preventDefault(); void changeShipment({ action: "PREPARE", courier, service }); }} className="space-y-3 rounded-xl border border-blue-100 p-4">
                  <h3 className="text-sm font-bold">1. Siapkan paket</h3>
                  <label className="block text-sm font-medium">Nama kurir
                    <input required minLength={2} maxLength={60} disabled={saving} value={courier} onChange={e => setCourier(e.target.value)}
                      placeholder="Contoh: JNE" className="mt-1 w-full rounded-lg border px-3 py-2"/>
                  </label>
                  <label className="block text-sm font-medium">Layanan
                    <input required minLength={1} maxLength={80} disabled={saving} value={service} onChange={e => setService(e.target.value)}
                      placeholder="Contoh: REG" className="mt-1 w-full rounded-lg border px-3 py-2"/>
                  </label>
                  <button type="submit" disabled={saving} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                    {saving ? "Menyimpan..." : "Tandai siap dikirim (READY)"}
                  </button>
                </form>
              )}

              {canShip && (
                <form onSubmit={e => { e.preventDefault(); void changeShipment({ action: "SHIP", trackingNumber }); }} className="space-y-3 rounded-xl border border-blue-100 p-4">
                  <h3 className="text-sm font-bold">2. Kirim paket</h3>
                  <label className="block text-sm font-medium">Nomor resi
                    <input required minLength={5} maxLength={100} value={trackingNumber} disabled={saving}
                      onChange={e => setTrackingNumber(e.target.value)} placeholder="Masukkan resi dari ekspedisi"
                      className="mt-1 w-full rounded-lg border px-3 py-2"/>
                  </label>
                  <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                    <Send size={16}/> {saving ? "Menyimpan..." : "Simpan resi & tandai SHIPPED"}
                  </button>
                </form>
              )}

              {canDeliver && (
                <div className="space-y-3 rounded-xl border border-emerald-100 p-4">
                  <h3 className="text-sm font-bold">3. Konfirmasi paket diterima</h3>
                  <p className="text-xs leading-5 text-slate-600">Pastikan informasi dari ekspedisi menunjukkan paket sudah diterima. Tidak ada verifikasi tracking otomatis pada tahap ini.</p>
                  <button type="button" disabled={saving}
                    onClick={() => {
                      if (window.confirm("Konfirmasi paket telah diterima oleh pembeli?")) void changeShipment({ action: "DELIVER" });
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                    <CheckCircle2 size={16}/> {saving ? "Menyimpan..." : "Tandai DELIVERED"}
                  </button>
                </div>
              )}

              {!canPrepare && !canPrepareExisting && !canShip && !canDeliver && (
                <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  {status === "DELIVERED" ? "Paket sudah dinyatakan diterima." :
                    status === "RETURNED" ? "Paket berstatus RETURNED. Penanganan retur akan dibangun terpisah." :
                      ["DRAFT", "PENDING_PAYMENT", "CANCELLED"].includes(order.status) ?
                        "Pengiriman tidak dapat diproses sebelum pembayaran terverifikasi." :
                        "Tidak ada aksi pengiriman lanjutan untuk status saat ini."}
                </div>
              )}
              {digitalCount > 0 && <p className="text-xs leading-5 text-amber-800">Pesanan campuran: status paket DELIVERED tidak otomatis menyelesaikan bagian digital yang belum dipenuhi.</p>}
            </>
          )}
          <p className="text-xs leading-5 text-slate-500">Perubahan ini dicatat pada pesanan yang sudah ada. Halaman ini tidak bisa mengubah pembayaran menjadi PAID, membeli label pengiriman, atau melakukan tracking resi otomatis.</p>
        </aside>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400"><Package size={14}/> Fase 5 · Admin fulfillment</div>
    </div>
  );
}
