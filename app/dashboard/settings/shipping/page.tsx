"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, ChevronRight, LocateFixed, MapPin, Save, Truck, AlertCircle } from "lucide-react";
import type { ShippingOriginInput, SavedShippingOrigin } from "@/lib/shipping/origin";
import { shippingOriginSchema } from "@/lib/shipping/origin";

const OriginMap = dynamic(() => import("@/components/shipping/origin-map"), {
  ssr: false,
  loading: () => <div className="flex h-[320px] items-center justify-center rounded-2xl bg-blue-50 text-sm text-slate-500 sm:h-[410px]">Memuat peta...</div>,
});

type Fields = Omit<ShippingOriginInput, "latitude" | "longitude">;
type Coords = { latitude: number; longitude: number };
const initialFields: Fields = {
  storeName: "", senderName: "", phone: "", addressLine: "", village: "",
  district: "", city: "", province: "", postalCode: "", notes: "",
};

const fields: Array<{ name: keyof Fields; label: string; placeholder: string; required?: boolean; span?: boolean }> = [
  { name: "storeName", label: "Nama toko / gudang", placeholder: "Contoh: Pixel Perfection Bandung", required: true },
  { name: "senderName", label: "Nama pengirim", placeholder: "Nama penanggung jawab paket", required: true },
  { name: "phone", label: "Nomor HP pengirim", placeholder: "08xxxxxxxxxx", required: true },
  { name: "province", label: "Provinsi", placeholder: "Jawa Barat", required: true },
  { name: "city", label: "Kota / kabupaten", placeholder: "Kota Bandung", required: true },
  { name: "district", label: "Kecamatan", placeholder: "Coblong", required: true },
  { name: "village", label: "Kelurahan / desa", placeholder: "Dago" },
  { name: "postalCode", label: "Kode pos", placeholder: "40135", required: true },
];

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60";

export default function ShippingOriginSettingsPage() {
  const [fieldsValue, setFieldsValue] = useState<Fields>(initialFields);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/shipping-origin", { cache: "no-store" });
      if (!res.ok) throw new Error("Tidak dapat mengambil data alamat pengirim");
      const response: { data: SavedShippingOrigin | null } = await res.json();
      if (response.data) {
        const { latitude, longitude, updatedAt, ...rest } = response.data;
        setFieldsValue(rest);
        setCoords({ latitude, longitude });
        setUpdatedAt(updatedAt);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data alamat");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const changeField = (name: keyof Fields, value: string) => {
    setNotice("");
    setIssues(prev => ({ ...prev, [name]: [] }));
    setFieldsValue(prev => ({ ...prev, [name]: value }));
  };

  const changeCoords = (value: Coords) => {
    setCoords(value);
    setNotice("");
    setIssues(prev => ({ ...prev, latitude: [], longitude: [] }));
  };

  const useCurrentLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Browser tidak mendukung lokasi perangkat. Pilih titik langsung di peta.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        if (latitude < -11.5 || latitude > 6.5 || longitude < 94 || longitude > 142) {
          setError("Lokasi perangkat berada di luar Indonesia. Pilih titik pengiriman secara manual.");
        } else {
          changeCoords({
            latitude: Number(latitude.toFixed(6)),
            longitude: Number(longitude.toFixed(6)),
          });
        }
        setLocating(false);
      },
      () => {
        setError("Lokasi tidak tersedia atau izin ditolak. Kamu tetap bisa memilih titik di peta.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIssues({});
    if (!coords) {
      setError("Pilih titik lokasi pengiriman di peta sebelum menyimpan.");
      return;
    }
    const payload = { ...fieldsValue, ...coords };
    const validated = shippingOriginSchema.safeParse(payload);
    if (!validated.success) {
      setIssues(validated.error.flatten().fieldErrors);
      setError("Beberapa kolom belum benar. Periksa isian yang ditandai.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/shipping-origin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated.data),
      });
      const response = await res.json();
      if (!res.ok) {
        if (response?.issues) setIssues(response.issues);
        throw new Error(response?.error || "Tidak dapat menyimpan alamat");
      }
      const data = response.data as SavedShippingOrigin;
      setUpdatedAt(data.updatedAt);
      setNotice("Alamat asal pengiriman berhasil disimpan dan akan digunakan sebagai pengaturan toko.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan alamat");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50/70 px-4 py-6 md:px-6 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <ChevronRight size={14}/>
          <span>Pengaturan toko</span>
          <ChevronRight size={14}/>
          <span className="text-slate-900">Alamat pengirim</span>
        </div>
        <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"><Truck size={14}/> Pengiriman &amp; logistik</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Alamat asal pengiriman</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Atur dari mana pesanan toko kamu dikirim. Isi alamat lengkap dan tandai titik toko atau gudang di peta, tanpa mengedit kode program.</p>
          </div>
          <span className={updatedAt ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700" : "inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700"}>
            {updatedAt ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
            {updatedAt ? "Alamat tersimpan" : "Belum dikonfigurasi"}
          </span>
        </div>

        {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
        {notice && <div role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"><CheckCircle2 size={17}/>{notice}</div>}

        <form onSubmit={save} className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><MapPin size={20}/></span>
              <div><h2 className="font-bold text-slate-900">1. Detail alamat toko</h2><p className="text-xs text-slate-500">Informasi ini digunakan untuk alamat asal paket.</p></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map(field => (
                <label key={field.name} className="block text-sm font-medium text-slate-700">
                  {field.label}{field.required && <span className="ml-1 text-rose-500">*</span>}
                  <input
                    name={field.name}
                    autoComplete="off"
                    required={field.required}
                    type={field.name === "phone" ? "tel" : "text"}
                    inputMode={field.name === "postalCode" ? "numeric" : undefined}
                    maxLength={field.name === "postalCode" ? 5 : field.name === "phone" ? 20 : 100}
                    value={fieldsValue[field.name]}
                    onChange={e => changeField(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    disabled={loading || saving}
                    className={inputClass}
                    aria-invalid={!!issues[field.name]?.length}
                  />
                  {!!issues[field.name]?.length && <span className="mt-1 block text-xs text-rose-600">{issues[field.name][0]}</span>}
                </label>
              ))}
            </div>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Alamat jalan &amp; nomor bangunan <span className="text-rose-500">*</span>
              <textarea
                required
                rows={3}
                maxLength={300}
                disabled={loading || saving}
                className={inputClass + " resize-y"}
                value={fieldsValue.addressLine}
                onChange={e => changeField("addressLine", e.target.value)}
                placeholder="Nama jalan, nomor rumah/ruko, RT/RW, patokan lokasi..."
                aria-invalid={!!issues.addressLine?.length}
              />
              {!!issues.addressLine?.length && <span className="mt-1 block text-xs text-rose-600">{issues.addressLine[0]}</span>}
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Catatan untuk kurir <span className="text-xs font-normal text-slate-400">(opsional)</span>
              <textarea rows={2} maxLength={300} disabled={loading || saving} className={inputClass + " resize-y"} value={fieldsValue.notes}
                onChange={e => changeField("notes", e.target.value)} placeholder="Contoh: Ruko warna biru, samping minimarket."/>
            </label>
          </section>

          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><MapPin size={20}/></span>
                  <div><h2 className="font-bold text-slate-900">2. Tandai lokasi di peta</h2><p className="text-xs text-slate-500">Klik peta atau geser pin ke lokasi toko.</p></div>
                </div>
              </div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-500">Geser peta untuk mencari alamatmu.</span>
                <button type="button" onClick={useCurrentLocation} disabled={loading || saving || locating}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50">
                  <LocateFixed size={15}/>{locating ? "Mencari lokasi..." : "Gunakan lokasi saya"}
                </button>
              </div>
              <div className="relative isolate overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                {!loading && <OriginMap value={coords} onChange={changeCoords} />}
                {loading && <div className="flex h-[320px] items-center justify-center text-sm text-slate-500 sm:h-[410px]">Memuat alamat toko...</div>}
              </div>
              <div className={coords ? "mt-3 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-900" : "mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900"}>
                <MapPin size={16} className="mt-0.5 shrink-0"/>
                {coords ? <span><strong>Titik sudah dipilih.</strong> Latitude {coords.latitude.toFixed(6)}, Longitude {coords.longitude.toFixed(6)}. Pastikan pin tepat di toko atau gudang.</span> : <span>Belum ada titik. Klik lokasi pada peta atau gunakan lokasi perangkat agar titik dapat disimpan.</span>}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">Titik peta membantu menentukan lokasi gudang, tetapi tidak otomatis mengisi kecamatan dan alamat. Pastikan alamat tertulis sudah benar sebelum menyimpan.</p>
              <p className="mt-2 text-xs text-slate-400">Peta © OpenStreetMap contributors. Fitur lokasi perangkat hanya digunakan setelah kamu memberi izin.</p>
            </section>
            <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
              <h3 className="font-semibold text-slate-900">Siap untuk integrasi ongkir</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Alamat ini tersimpan di pengaturan toko. Pada integrasi berikutnya, kota/kecamatan akan dicocokkan dengan lokasi layanan kurir agar ongkir dihitung dari gudang yang dipilih.</p>
              {updatedAt && <p className="mt-2 text-xs text-slate-500">Terakhir disimpan: {new Date(updatedAt).toLocaleString("id-ID")}</p>}
              <button type="submit" disabled={loading || saving || !coords}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? "Menyimpan..." : <><Save size={18}/> Simpan alamat pengiriman</>}
              </button>
            </section>
          </div>
        </form>
      </div>
    </div>
  );
}
