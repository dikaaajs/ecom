"use client";
import { toast } from "@/lib/notify";

import dynamic from "next/dynamic";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, LocateFixed, MapPin, Save, Trash2 } from "lucide-react";
import { RegionSelector } from "@/components/shipping/region-selector";
import type { RegionSelection } from "@/lib/shipping/regions";
import type { CartItem } from "@/lib/cart";
import { ShippingRatePicker, type SelectedShippingRate } from "@/components/shipping/shipping-rate-picker";
import {
  BUYER_ADDRESS_DRAFT_KEY, buyerAddressSchema,
  emptyBuyerAddress, type BuyerAddress,
} from "@/lib/shipping/buyer-address";

const LocationMap = dynamic(() => import("@/components/shipping/origin-map"), {
  ssr: false,
  loading: () => <div className="flex h-64 items-center justify-center rounded-xl bg-blue-50 text-sm text-slate-500">Memuat peta...</div>,
});

type Field = keyof Pick<BuyerAddress,
  "recipient" | "phone" | "email" | "village" | "postalCode" | "addressLine" | "notes"
>;

const fields: Array<{ name: Field; label: string; hint: string; required?: boolean }> = [
  { name: "recipient", label: "Nama lengkap penerima", hint: "Nama penerima paket", required: true },
  { name: "phone", label: "Nomor WhatsApp / HP", hint: "08xxxxxxxxxx", required: true },
  { name: "email", label: "Email pembeli", hint: "email@contoh.com", required: true },
  { name: "village", label: "Kelurahan / Desa", hint: "Contoh: Dago", required: true },
  { name: "postalCode", label: "Kode pos", hint: "5 digit", required: true },
  { name: "addressLine", label: "Alamat lengkap (jalan, nomor, RT/RW)", hint: "Nama jalan, nomor rumah, RT/RW, patokan...", required: true },
  { name: "notes", label: "Catatan untuk kurir (opsional)", hint: "Contoh: pagar berwarna biru" },
];

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export function BuyerAddressForm({ items, originConfigured, onRateChange, onAddressSaved }: {
  items: CartItem[];
  originConfigured: boolean;
  onRateChange: (rate: SelectedShippingRate | null) => void;
  onAddressSaved: (address: BuyerAddress | null) => void;
}) {
  const [draft, setDraft] = useState<BuyerAddress>(emptyBuyerAddress);
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    try {
      const data = sessionStorage.getItem(BUYER_ADDRESS_DRAFT_KEY);
      if (data) {
        const parsed = buyerAddressSchema.safeParse(JSON.parse(data));
        if (parsed.success) {
          setDraft(parsed.data);
          setSaved(true);
          onAddressSaved(parsed.data);
        } else {
          sessionStorage.removeItem(BUYER_ADDRESS_DRAFT_KEY);
        }
      }
    } catch {
      // Private browsing or storage restrictions should not prevent form use.
    } finally {
      setHydrated(true);
    }
  }, []);

  const update = (name: Field, value: string) => {
    setDraft(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: [] }));
    setSaved(false);
    onAddressSaved(null);
    onRateChange(null);
    setMessage("");
  };
  const setRegion = (region: RegionSelection) => {
    setDraft(prev => ({ ...prev, ...region }));
    setErrors(prev => ({ ...prev, province: [], provinceId: [], city: [], cityId: [], district: [], districtId: [] }));
    setSaved(false);
    onAddressSaved(null);
    onRateChange(null);
    setMessage("");
  };
  const setPin = (point: { latitude: number; longitude: number }) => {
    setDraft(prev => ({ ...prev, ...point }));
    setErrors(prev => ({ ...prev, latitude: [] }));
    setSaved(false);
    onAddressSaved(null);
    onRateChange(null);
    setMessage("");
  };

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      toast.warning("Browser tidak mendukung geolokasi. Kamu bisa klik titik di peta.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        if (latitude < -11.5 || latitude > 6.5 || longitude < 94 || longitude > 142) {
          toast.warning("Lokasi perangkat di luar area Indonesia. Pilih pin manual.");
        } else {
          setPin({ latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)) });
        }
        setLocating(false);
      },
      () => {
        toast.warning("Izin lokasi tidak diberikan atau lokasi tidak tersedia. Pilih pin manual jika diinginkan.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setMessage("");
    const parsed = buyerAddressSchema.safeParse(draft);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const [key, messages] of Object.entries(parsed.error.flatten().fieldErrors)) {
        if (messages) fieldErrors[key] = messages;
      }
      setErrors(fieldErrors);
      setSaved(false);
      toast.warning("Periksa kembali kolom yang diberi tanda merah.");
      return;
    }
    try {
      sessionStorage.setItem(BUYER_ADDRESS_DRAFT_KEY, JSON.stringify(parsed.data));
      setDraft(parsed.data);
      setSaved(true);
      onAddressSaved(parsed.data);
      toast.success("Alamat disimpan sementara di tab browser ini. Belum ada pesanan yang dibuat.");
    } catch {
      setSaved(false);
      toast.error("Browser tidak mengizinkan penyimpanan sementara. Periksa pengaturan browser.");
    }
  };

  const clear = () => {
    try { sessionStorage.removeItem(BUYER_ADDRESS_DRAFT_KEY); } catch {}
    setDraft({ ...emptyBuyerAddress });
    setSaved(false);
    onAddressSaved(null);
    onRateChange(null);
    setErrors({});
    toast.info("Alamat sementara telah dikosongkan.");
  };

  if (!hydrated) return <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-slate-500">Memuat form alamat...</div>;

  return (
    <form onSubmit={save} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Alamat pengiriman</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Isi alamat tujuan paket. Titik peta opsional untuk mempermudah penentuan lokasi.</p>
        </div>
        {saved && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={14} /> Draft tersimpan</span>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <RegionSelector value={{ province: draft.province, provinceId: draft.provinceId,
          city: draft.city, cityId: draft.cityId, district: draft.district, districtId: draft.districtId }}
          onChange={setRegion} />
        {fields.map(field => {
          const isLong = field.name === "addressLine" || field.name === "notes";
          return (
            <label key={field.name} className={"block text-sm font-semibold text-slate-700" + (isLong ? " sm:col-span-2" : "")}>
              {field.label}{field.required && <span className="ml-1 text-rose-500">*</span>}
              {isLong ? (
                <textarea rows={field.name === "addressLine" ? 3 : 2} value={draft[field.name]}
                  maxLength={300} placeholder={field.hint} onChange={event => update(field.name, event.target.value)}
                  required={field.required} aria-invalid={!!errors[field.name]?.length} className={inputClass + " resize-y"}/>
              ) : (
                <input type={field.name === "email" ? "email" : field.name === "phone" ? "tel" : "text"}
                  inputMode={field.name === "postalCode" ? "numeric" : undefined}
                  autoComplete={field.name === "recipient" ? "name" : field.name === "email" ? "email" : field.name === "phone" ? "tel" : field.name === "postalCode" ? "postal-code" : "off"}
                  required={field.required} maxLength={field.name === "postalCode" ? 5 : field.name === "phone" ? 20 : field.name === "email" ? 200 : 100}
                  value={draft[field.name]} placeholder={field.hint}
                  onChange={event => update(field.name, event.target.value)}
                  aria-invalid={!!errors[field.name]?.length} className={inputClass}/>
              )}
              {!!errors[field.name]?.length && <span className="mt-1 block text-xs text-rose-600">{errors[field.name][0]}</span>}
            </label>
          );
        })}
      </div>
      <div className="mt-7 border-t border-slate-100 pt-6">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <MapPin size={18} className="mt-0.5 text-blue-600" />
            <div><h3 className="font-bold text-slate-900">Titik lokasi penerima <span className="text-xs font-normal text-slate-400">(opsional)</span></h3><p className="text-xs text-slate-500">Klik peta atau geser pin. Alamat tertulis tetap wajib diisi.</p></div>
          </div>
          <button type="button" disabled={locating} onClick={useDeviceLocation}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50">
            <LocateFixed size={15} /> {locating ? "Mencari lokasi..." : "Gunakan lokasi saya"}
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <LocationMap ariaLabel="Peta lokasi penerima. Klik peta untuk menaruh pin alamat pembeli."
            value={draft.latitude !== null && draft.longitude !== null ? { latitude: draft.latitude, longitude: draft.longitude } : null} onChange={setPin}/>
        </div>
        {draft.latitude !== null && draft.longitude !== null && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-800">
            <span>Pin: {draft.latitude.toFixed(6)}, {draft.longitude.toFixed(6)}</span>
            <button type="button" className="font-semibold underline" onClick={() => { setDraft(prev => ({ ...prev, latitude: null, longitude: null })); setSaved(false); onAddressSaved(null); onRateChange(null); setMessage(""); }}>Hapus pin</button>
          </div>
        )}
      </div>
      {message && <p role="status" className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{message}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" className="storefront-btn-primary inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"><Save size={17}/> Simpan alamat sementara</button>
        <button type="button" onClick={clear} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Trash2 size={16}/> Hapus</button>
      </div>
      {saved && <ShippingRatePicker items={items} originConfigured={originConfigured}
        destination={{ province: draft.province, provinceId: draft.provinceId,
          city: draft.city, cityId: draft.cityId, district: draft.district, districtId: draft.districtId }}
        onChange={onRateChange} />}
      <p className="mt-4 text-xs leading-5 text-slate-500">Data hanya disimpan di sessionStorage tab ini, tidak dikirim ke database dan belum menjadi pesanan. Tutup tab untuk mengakhiri sesi. Alamat dan lokasi akan divalidasi ulang saat checkout sungguhan tersedia.</p>
    </form>
  );
}
