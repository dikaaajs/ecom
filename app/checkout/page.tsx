"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, CreditCard, Download, MapPin, Package, ShoppingBag, Truck } from "lucide-react";
import { Footer } from "@/components/stack/footer";
import { BuyerAddressForm } from "@/components/shipping/buyer-address-form";
import type { SelectedShippingRate } from "@/components/shipping/shipping-rate-picker";
import type { BuyerAddress } from "@/lib/shipping/buyer-address";
import { CHECKOUT_STORAGE_KEY, type CheckoutSession } from "@/lib/payment/constants";
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
  digitalAssetReady: boolean;
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
  const [savedAddress, setSavedAddress] = useState<BuyerAddress | null>(null);
  const [digitalContact, setDigitalContact] = useState({ recipient: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const checkoutTokenRef = useRef<string | null>(null);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError("");
    setQuote(null);
    setSelectedRate(null);
    checkoutTokenRef.current = null;
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

  const beginPayment = async () => {
    if (!quote || submitting || !quote.valid || !quote.digitalAssetReady) return;
    const physical = quote.delivery.shippingRequired;
    if (physical && (!savedAddress || !selectedRate || !quote.shippingOriginConfigured)) return;
    const contact = physical && savedAddress ? {
      recipient: savedAddress.recipient, email: savedAddress.email, phone: savedAddress.phone,
    } : digitalContact;

    setPaymentError("");
    setSubmitting(true);
    try {
      if (!checkoutTokenRef.current) {
        const bytes = new Uint8Array(32);
        crypto.getRandomValues(bytes);
        checkoutTokenRef.current = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
      }
      const response = await fetch("/api/checkout/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          items,
          accessToken: checkoutTokenRef.current,
          address: physical ? savedAddress : null,
          contact,
          shipping: physical && selectedRate ? {
            courierCode: selectedRate.courierCode, service: selectedRate.service,
          } : null,
        }),
      });
      const result: Partial<CheckoutSession> & { error?: string } = await response.json();
      if (!response.ok || !result.orderId || !result.orderNumber || !result.redirectUrl) {
        throw new Error(result.error || "Gagal membuat pesanan.");
      }
      const session: CheckoutSession = {
        orderId: result.orderId, orderNumber: result.orderNumber,
        redirectUrl: result.redirectUrl, sandbox: !!result.sandbox,
        accessToken: checkoutTokenRef.current,
      };
      sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(session));
      // Payment status comes from the verified Midtrans webhook, NEVER from the redirect.
      window.location.assign(session.redirectUrl);
    } catch (caught) {
      setPaymentError(caught instanceof Error ? caught.message : "Gagal memulai pembayaran.");
    } finally {
      setSubmitting(false);
    }
  };
  const contactReady = quote?.delivery.shippingRequired
    ? !!savedAddress
    : digitalContact.recipient.trim().length >= 2 &&
      /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(digitalContact.email) &&
      digitalContact.phone.trim().length >= 8;
  const canPay = !!quote?.valid && quote.digitalAssetReady && !!contactReady &&
    (!quote.delivery.shippingRequired || (quote.shippingOriginConfigured && !!selectedRate));

  return (
    <div className="min-h-screen bg-[#f6f9ff] pt-28 font-satoshi">
      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"><ArrowLeft size={16}/> Kembali ke keranjang</Link>
        <div className="mb-8 mt-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"><ShoppingBag size={14}/> Checkout &amp; pembayaran</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Detail pengiriman</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Lengkapi detail pesanan. Server akan memverifikasi ulang harga, stok, dan ongkir sebelum membuat sesi pembayaran Midtrans.</p>
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
              {!quote.digitalAssetReady && (
                <div role="alert" className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 shrink-0" size={20}/>
                  <p><strong>File produk digital belum disiapkan.</strong> Penjual perlu mengunggah file private sebelum transaksi digital dapat diaktifkan.</p>
                </div>
              )}
              {quote.delivery.shippingRequired ? (
                <>
                  {!quote.shippingOriginConfigured && (
                    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      <AlertTriangle size={20} className="mt-0.5 shrink-0"/>
                      <div><strong>Pengiriman toko belum dikonfigurasi.</strong><p className="mt-1 leading-6">Kamu boleh mengisi draft alamat, tetapi ongkir dan pembelian produk fisik tetap tidak bisa diproses sampai penjual mengatur alamat asal.</p></div>
                    </div>
                  )}
                  <BuyerAddressForm items={items} originConfigured={quote.shippingOriginConfigured} onRateChange={setSelectedRate} onAddressSaved={setSavedAddress}/>
                </>
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-white p-7 shadow-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="shrink-0 text-emerald-600" size={28}/>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">Tidak perlu alamat pengiriman</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">Semua produk di keranjang berupa produk digital, sehingga kamu tidak perlu mengisi alamat fisik atau memilih kurir.</p>
                      <p className="mt-2 text-xs text-slate-500">Isi kontak pembeli untuk menerima informasi pesanan. Unduhan file tetap memerlukan verifikasi kepemilikan setelah pembayaran.</p>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {([
                          ["recipient", "Nama penerima", "Nama lengkap"],
                          ["email", "Email pembeli", "nama@contoh.com"],
                          ["phone", "Nomor HP", "08xxxxxxxxxx"],
                        ] as const).map(([name, label, placeholder]) => (
                          <label key={name} className="text-sm font-semibold text-slate-700">
                            {label}
                            <input value={digitalContact[name]} placeholder={placeholder}
                              type={name === "email" ? "email" : name === "phone" ? "tel" : "text"}
                              onChange={e => { setDigitalContact(old => ({ ...old, [name]: e.target.value })); checkoutTokenRef.current = null; }}
                              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:border-blue-400 focus:outline-none"/>
                          </label>
                        ))}
                      </div>
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
              {paymentError && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{paymentError}</p>}
              <button type="button" onClick={() => void beginPayment()} disabled={!canPay || submitting}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">
                <CreditCard size={18}/>{submitting ? "Membuat pesanan..." : "Buat pesanan & lanjut bayar"}
              </button>
              <p className="mt-3 text-xs leading-5 text-slate-500">Pastikan data sudah benar. Pembayaran diproses di Midtrans; status PAID hanya ditentukan melalui webhook terverifikasi. Jika Midtrans belum dikonfigurasi, server akan menolak transaksi.</p>
            </aside>
          </div>
        )}
      </main>
      <Footer compact/>
    </div>
  );
}
