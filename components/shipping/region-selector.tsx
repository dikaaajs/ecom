"use client";

import { useEffect, useState } from "react";
import type { RegionLevel, RegionOption, RegionSelection } from "@/lib/shipping/regions";

type Props = {
  value: RegionSelection;
  onChange: (region: RegionSelection) => void;
  disabled?: boolean;
};
const selectClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

async function fetchOptions(level: RegionLevel, parentId: number | undefined, signal: AbortSignal): Promise<RegionOption[]> {
  const query = new URLSearchParams({ level });
  if (parentId) query.set("parentId", String(parentId));
  const response = await fetch(`/api/shipping/regions?${query.toString()}`, { signal });
  const result: { data?: RegionOption[]; error?: string } = await response.json();
  if (!response.ok || !Array.isArray(result.data)) throw new Error(result.error || "Wilayah tidak dapat dimuat.");
  return result.data;
}

export function RegionSelector({ value, onChange, disabled = false }: Props) {
  const [provinces, setProvinces] = useState<RegionOption[]>([]);
  const [cities, setCities] = useState<RegionOption[]>([]);
  const [districts, setDistricts] = useState<RegionOption[]>([]);
  const [busy, setBusy] = useState({ province: false, city: false, district: false });
  const [errors, setErrors] = useState<Record<RegionLevel, string>>({ province: "", city: "", district: "" });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const abort = new AbortController();
    setBusy(prev => ({ ...prev, province: true }));
    fetchOptions("province", undefined, abort.signal)
      .then(data => { if (!abort.signal.aborted) { setProvinces(data); setErrors(prev => ({ ...prev, province: "" })); } })
      .catch(err => { if (!abort.signal.aborted) setErrors(prev => ({ ...prev, province: String(err instanceof Error ? err.message : err) })); })
      .finally(() => { if (!abort.signal.aborted) setBusy(prev => ({ ...prev, province: false })); });
    return () => abort.abort();
  }, [retry]);

  useEffect(() => {
    const abort = new AbortController();
    setCities([]); setDistricts([]);
    if (!value.provinceId) { setBusy(prev => ({ ...prev, city: false })); return () => abort.abort(); }
    setBusy(prev => ({ ...prev, city: true }));
    fetchOptions("city", value.provinceId, abort.signal)
      .then(data => { if (!abort.signal.aborted) { setCities(data); setErrors(prev => ({ ...prev, city: "" })); } })
      .catch(err => { if (!abort.signal.aborted) setErrors(prev => ({ ...prev, city: String(err instanceof Error ? err.message : err) })); })
      .finally(() => { if (!abort.signal.aborted) setBusy(prev => ({ ...prev, city: false })); });
    return () => abort.abort();
  }, [value.provinceId, retry]);

  useEffect(() => {
    const abort = new AbortController();
    setDistricts([]);
    if (!value.cityId) { setBusy(prev => ({ ...prev, district: false })); return () => abort.abort(); }
    setBusy(prev => ({ ...prev, district: true }));
    fetchOptions("district", value.cityId, abort.signal)
      .then(data => { if (!abort.signal.aborted) { setDistricts(data); setErrors(prev => ({ ...prev, district: "" })); } })
      .catch(err => { if (!abort.signal.aborted) setErrors(prev => ({ ...prev, district: String(err instanceof Error ? err.message : err) })); })
      .finally(() => { if (!abort.signal.aborted) setBusy(prev => ({ ...prev, district: false })); });
    return () => abort.abort();
  }, [value.cityId, retry]);

  const changeProvince = (raw: string) => {
    const found = provinces.find(option => option.id === Number(raw));
    onChange({
      province: found?.name || "", provinceId: found?.id || 0,
      city: "", cityId: 0, district: "", districtId: 0,
    });
  };
  const changeCity = (raw: string) => {
    const found = cities.find(option => option.id === Number(raw));
    onChange({
      province: value.province, provinceId: value.provinceId,
      city: found?.name || "", cityId: found?.id || 0, district: "", districtId: 0,
    });
  };
  const changeDistrict = (raw: string) => {
    const found = districts.find(option => option.id === Number(raw));
    onChange({ ...value, district: found?.name || "", districtId: found?.id || 0 });
  };

  const renderSelect = (
    level: RegionLevel, label: string, selectedId: number, options: RegionOption[],
    canUse: boolean, change: (v: string) => void,
  ) => (
    <label className="block text-sm font-medium text-slate-700">
      {label} <span className="text-rose-500">*</span>
      <select value={selectedId || ""} onChange={event => change(event.target.value)}
        disabled={disabled || !canUse || busy[level] || !!errors[level]}
        required
        className={selectClass}>
        <option value="">{busy[level] ? "Memuat data..." : !canUse ? "Pilih wilayah sebelumnya" : "Pilih " + label.toLowerCase()}</option>
        {options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
      {!!selectedId && !options.some(option => option.id === selectedId) && !busy[level] && (
        <p className="mt-1 text-xs text-amber-700">Wilayah tersimpan tidak ditemukan. Pilih lagi untuk memperbarui.</p>
      )}
      {errors[level] && <p role="alert" className="mt-1 text-xs text-rose-700">{errors[level]}</p>}
    </label>
  );

  return (
    <div className="sm:col-span-2">
      <div className="mb-2 text-sm font-bold text-slate-800">Wilayah pengiriman RajaOngkir</div>
      <div className="grid gap-4 sm:grid-cols-2">
        {renderSelect("province", "Provinsi", value.provinceId, provinces, true, changeProvince)}
        {renderSelect("city", "Kota/kabupaten", value.cityId, cities, !!value.provinceId, changeCity)}
        {renderSelect("district", "Kecamatan", value.districtId, districts, !!value.cityId, changeDistrict)}
      </div>
      {Object.values(errors).some(Boolean) && (
        <button type="button" className="mt-3 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600" onClick={() => setRetry(v => v + 1)}>Coba muat ulang wilayah</button>
      )}
      <p className="mt-2 text-xs leading-5 text-slate-500">Wilayah diperoleh dari RajaOngkir. Jika token belum diatur, daftar wilayah tidak akan tersedia. Nama dan ID disimpan bersama alamat.</p>
    </div>
  );
}
