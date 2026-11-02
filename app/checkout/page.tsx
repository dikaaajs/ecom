"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, CreditCard, Download, MapPin, Package, ShoppingBag, Truck } from "lucide-react";
import { Footer } from "@/components/stack/footer";
import { BuyerAddressForm } from "@/components/shipping/buyer-address-form";
import type { SelectedShippingRate } from "@/components/shipping/shipping-rate-picker";
import { useCart } from "@/components/cart/cart-provider";

type QuoteLine = {
  productId: string; quantity: number; available: boolean; reason?: string;
  title?: string; imageUrl?: string | null; type?: "PHYSICAL" | "DIGITAL";
  lineTotal?: string;
};
type Quote = {
  valid: boolean; lines: QuoteLine[]; subtotal: string;
  delivery: { physicalCount: number; digitalCount: number; totalWeightGram: number; shippingRequired: boolean };
  shippingOriginConfigured: boolean;
  checkoutReady: boolean;
  checkoutBlockers: string[];
};

const formatPrice = (price: number | string) => new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0,
}).format(Number(price));

export default function CheckoutPage() {
  const { ready, items } = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [selectedRate, setSelectedRate] = useState<SelectedShippingRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError("");
    setQuote(null);
    setSelectedRate(null);
    try {
      const response = await fetch("/api/cart/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
        signal, cache: "no-store",
      });
      if (!response.ok) throw new Error("Ringkasan belanja belum dapat diperiksa.");
      const result: Quote = await response.json();
      if (!signal.aborted) setQuote(result);
    } catch {
      if (!signal.aborted) setError("Gagal memuat stok dan harga. Silakan coba lagi.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [items]);

  useEffect(() => {
    if (!ready || items.length === 0) {
      setQuote(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [ready, items, load, refresh]);

  return (
    <div className="min-h-screen bg-[#f6f9ff] pt-28 font-satoshi">
      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"><ArrowLeft size={16}/> Kembali ke keranjang</Link>
        <div className="mb-8 mt-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"><ShoppingBag size={14}/> Pratinjau checkout</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Detail pengiriman</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Lengkapi data tujuan untuk produk fisik. Belum ada pembayaran atau pesanan yang akan diproses di tahap ini.</p>
        </div>
        {!ready || loading ? (
          <div role="status" className="rounded-2xl border border-blue-100 bg-white p-8 text-sm text-slate-500">Memeriksa produk, stok, dan kebutuhan pengiriman...</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-blue-100 bg-white p-10 text-center">
            <ShoppingBag className="mx-auto mb-4 text-blue-500" size={40}/>
            <h2 className="text-xl font-bold text-slate-900">Keranjang masih kosong</h2>
            <p className="mt-2 text-sm text-slate-500">Tambahkan produk terlebih dahulu sebelum mengisi informasi pengiriman.</p>
            <Link href="/product" className="storefront-btn-primary mt-6 inline-flex rounded-xl px-5 py-3 text-sm font-bold">Lihat katalog</Link>
          </div>
        ) : error || !quote ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-6">
            <p className="text-sm text-rose-700">{error || "Ringkasan tidak tersedia."}</p>
            <button type="button" onClick={() => setRefresh(n => n + 1)} className="mt-3 text-sm font-semibold text-blue-600 underline">Coba lagi</button>
          </div>
        ) : !quote.valid ? (
          <div role="alert" className="rounded-2xl border border-amber-200 bg-white p-6">
            <h2 className="flex items-center gap-2 font-bold text-amber-900"><AlertTriangle size={20}/> Keranjang perlu diperbaiki</h2>
            <p className="mt-2 text-sm text-slate-600">Ada produk yang tidak tersedia atau stoknya tidak mencukupi. Perbarui keranjang sebelum melanjutkan.</p>
            <Link href="/cart" className="mt-4 inline-flex text-sm font-bold text-blue-600 underline">Periksa keranjang</Link>
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              {quote.delivery.shippingRequired ? (
                <>
                  {!quote.shippingOriginConfigured && (
                    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      <AlertTriangle size={20} className="mt-0.5 shrink-0"/>
                      <div><strong>Pengiriman toko belum dikonfigurasi.</strong><p className="mt-1 leading-6">Kamu boleh mengisi draft alamat, tetapi ongkir dan pembelian produk fisik tetap tidak bisa diproses sampai penjual mengatur alamat asal.</p></div>
                    </div>
                  )}
                  <BuyerAddressForm items={items} originConfigured={quote.shippingOriginConfigured} onRateChange={setSelectedRate}/>
                </>
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-white p-7 shadow-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="shrink-0 text-emerald-600" size={28}/>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">Tidak perlu alamat pengiriman</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">Semua produk di keranjang berupa produk digital, sehingga kamu tidak perlu mengisi alamat fisik atau memilih kurir.</p>
                      <p className="mt-2 text-xs text-slate-500">Detail penerima digital dan akses unduhan akan ditangani ketika pembayaran dan pemenuhan pesanan sudah tersedia.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <aside className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm lg:sticky lg:top-28">
              <h2 className="text-lg font-extrabold text-slate-900">Ringkasan pesanan</h2>
              <div className="mt-4 space-y-4 border-b border-slate-100 pb-5">
                {quote.lines.filter(line => line.available).map(line => (
                  <div key={line.productId} className="flex gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-blue-50">
                      {line.imageUrl ? <img src={line.imageUrl} alt={line.title || "Produk"} className="h-full w-full object-contain"/> : <Package className="m-auto mt-4 text-blue-300"/>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-900">{line.title}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        {line.type === "DIGITAL" ? <Download size={12}/> : <Truck size={12}/>}
                        {line.type === "DIGITAL" ? "Digital" : "Fisik"} · {line.quantity} item
                      </p>
                      <p className="mt-1 text-sm font-bold">{formatPrice(line.lineTotal || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between gap-4 text-sm"><span className="text-slate-500">Subtotal</span><strong>{formatPrice(quote.subtotal)}</strong></div>
              <div className="mt-3 flex justify-between gap-4 text-sm"><span className="text-slate-500">Berat paket</span><strong>{quote.delivery.shippingRequired ? quote.delivery.totalWeightGram + " gram" : "Tidak perlu"}</strong></div>
              <div className="mt-3 flex justify-between gap-4 text-sm"><span className="text-slate-500">Ongkos kirim</span><strong>{quote.delivery.shippingRequired ? (selectedRate ? formatPrice(selectedRate.cost) : "Belum dipilih") : formatPrice(0)}</strong></div>
              {selectedRate && quote.delivery.shippingRequired && (
                <div role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
                  <strong>{selectedRate.courier} · {selectedRate.service}</strong>
                  <p>Tarif ditampilkan untuk pratinjau, bukan tagihan akhir.</p>
                </div>
              )}
              {selectedRate && quote.delivery.shippingRequired && (
                <div className="mt-3 flex justify-between gap-4 border-t border-slate-100 pt-3 text-sm"><span className="font-bold text-slate-800">Total estimasi</span><strong className="text-blue-700">{formatPrice(Number(selectedRate.subtotal) + selectedRate.cost)}</strong></div>
              )}
              <div className="mt-5 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-900">
                <MapPin size={15} className="mr-1 inline"/>
                {quote.delivery.shippingRequired ? "Setelah menyimpan draft alamat, tekan Cek ongkir dan pilih layanan ekspedisi. Tarif dapat berubah sebelum pembayaran." : "Pengiriman digital tidak membutuhkan jasa ekspedisi."}
              </div>
              <button type="button" disabled className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 py-3 font-bold text-slate-500"><CreditCard size={18}/> Pembayaran belum tersedia</button>
              <p className="mt-3 text-xs leading-5 text-slate-500">Penyimpanan alamat sementara tidak membuat order, tidak mengurangi stok, dan tidak memproses pembayaran.</p>
            </aside>
          </div>
        )}
      </main>
      <Footer compact/>
    </div>
  );
}
