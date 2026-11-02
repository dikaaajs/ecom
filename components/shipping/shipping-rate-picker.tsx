"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, RefreshCw, Truck } from "lucide-react";
import type { CartItem } from "@/lib/cart";
import type { RegionSelection } from "@/lib/shipping/regions";

type CourierRate = {
  courier: string;
  courierCode: string;
  service: string;
  description: string;
  cost: number;
  estimate: string | null;
};
type QuoteResponse = {
  rates: CourierRate[];
  weightGram: number;
  subtotal: string;
  currency: "IDR";
  estimateOnly: boolean;
  checkedAt: string;
  expiresInSeconds: number;
};

export type SelectedShippingRate = {
  courier: string;
  courierCode: string;
  service: string;
  description: string;
  cost: number;
  estimate: string | null;
  subtotal: string;
  weightGram: number;
  checkedAt: string;
};

type Props = {
  items: CartItem[];
  destination: RegionSelection;
  onChange: (rate: SelectedShippingRate | null) => void;
  originConfigured: boolean;
};

function formatRupiah(amount: number | string): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function ShippingRatePicker({ items, destination, onChange, originConfigured }: Props) {
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const itemKey = items.map(item => item.productId + ":" + item.quantity).join("|");
  // A new saved destination or a changed cart means previous estimates are obsolete.
  useEffect(() => {
    setQuote(null);
    setSelected(null);
    setError("");
    onChange(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination.districtId, destination.cityId, destination.provinceId, itemKey]);

  const fetchRates = async () => {
    setLoading(true);
    setError("");
    setQuote(null);
    setSelected(null);
    onChange(null);
    try {
      const response = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, destination }),
        cache: "no-store",
      });
      const data: QuoteResponse & { error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal memuat ongkos kirim.");
      if (!Array.isArray(data.rates)) throw new Error("Respons tarif dari server tidak sesuai.");
      setQuote(data);
      if (!data.rates.length) setError("Tidak ditemukan layanan pengiriman untuk rute dan berat paket ini. Coba alamat lain atau hubungi toko.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil tarif. Coba beberapa saat lagi.");
    } finally {
      setLoading(false);
    }
  };

  const choose = (index: number) => {
    if (!quote || !quote.rates[index]) return;
    const rate = quote.rates[index];
    setSelected(index);
    onChange({
      ...rate,
      subtotal: quote.subtotal,
      weightGram: quote.weightGram,
      checkedAt: quote.checkedAt,
    });
  };

  return (
    <section aria-label="Pilihan ekspedisi dan tarif pengiriman" className="mt-7 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Truck size={23} className="mt-0.5 shrink-0 text-blue-600"/>
        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold text-slate-900">Cek ongkir &amp; pilih ekspedisi</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">Tarif langsung dari RajaOngkir berdasarkan kecamatan tujuan dan berat paket. Cek hanya saat diperlukan untuk menghemat kuota API.</p>
        </div>
      </div>

      {!originConfigured && <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Toko belum mengatur alamat asal pengiriman. Tarif belum dapat dihitung.</p>}
      <button
        type="button" onClick={() => void fetchRates()}
        disabled={!originConfigured || loading || !destination.districtId || !items.length}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
      >
        <RefreshCw size={16} className={loading ? "animate-spin" : ""}/>
        {loading ? "Memeriksa tarif kurir..." : quote ? "Perbarui tarif ongkir" : "Cek ongkir"}
      </button>
      {error && <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><AlertCircle size={17} className="mt-0.5 shrink-0"/>{error}</p>}

      {quote && quote.rates.length > 0 && (
        <div className="mt-4 space-y-2" role="radiogroup" aria-label="Pilih salah satu layanan pengiriman">
          <p className="mb-2 text-xs font-semibold text-slate-600">{quote.rates.length} pilihan layanan · Berat {new Intl.NumberFormat("id-ID").format(quote.weightGram)} gram</p>
          {quote.rates.map((rate, index) => (
            <label key={rate.courierCode + ":" + rate.service + ":" + rate.cost + ":" + index}
              className={"flex cursor-pointer items-start justify-between gap-3 rounded-xl border bg-white p-3 transition " +
                (selected === index ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-300")}>
              <span className="flex min-w-0 items-start gap-3">
                <input type="radio" name="shipping-service" checked={selected === index}
                  onChange={() => choose(index)} className="mt-1 accent-blue-600"/>
                <span className="min-w-0">
                  <strong className="block text-sm text-slate-900">{rate.courier} · {rate.service}</strong>
                  {!!rate.description && <span className="mt-0.5 block text-xs text-slate-500">{rate.description}</span>}
                  {rate.estimate && <span className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500"><Clock3 size={12}/> Estimasi {rate.estimate}</span>}
                </span>
              </span>
              <span className="shrink-0 text-sm font-extrabold text-slate-900">{formatRupiah(rate.cost)}</span>
            </label>
          ))}
          {selected !== null && quote.rates[selected] && (
            <div role="status" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800"><CheckCircle2 size={16}/> Layanan pengiriman dipilih</p>
              <div className="mt-2 flex justify-between gap-3 text-sm text-slate-800"><span>Subtotal + ongkir (estimasi)</span>
                <strong>{formatRupiah(Number(quote.subtotal) + quote.rates[selected].cost)}</strong>
              </div>
            </div>
          )}
          <p className="pt-1 text-xs leading-5 text-slate-500">Tarif hanya estimasi dan dapat berubah. Perbarui jika alamat, produk, atau jumlah berubah. Pesanan belum dapat dibuat atau dibayar.</p>
        </div>
      )}
    </section>
  );
}
