"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, MapPin, Loader2 } from "lucide-react";

export function ShippingSetupNotice() {
  const [state, setState] = useState<"loading" | "missing" | "ready" | "error">("loading");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/shipping-origin", { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Cannot check shipping setup");
        return response.json();
      })
      .then(data => { if (!controller.signal.aborted) setState(data.data ? "ready" : "missing"); })
      .catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, []);
  if (state === "loading") return <div role="status" className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Memeriksa alamat pengiriman...</div>;
  if (state === "ready") return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800"><span className="flex items-center gap-2"><CheckCircle2 size={19} /> <strong>Alamat asal pengiriman sudah tersimpan.</strong></span><Link href="/dashboard/settings/shipping" className="font-semibold underline">Ubah alamat</Link></div>;
  return <div role="alert" className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
    <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 shrink-0" size={22} /><div><h2 className="font-bold">{state === "missing" ? "Alamat pengiriman belum diatur" : "Status alamat belum bisa diperiksa"}</h2><p className="mt-1 max-w-2xl text-sm leading-relaxed">Lengkapi alamat gudang dan titik pin pada peta supaya ongkir produk fisik bisa diaktifkan. Katalog serta produk digital tidak terpengaruh.</p></div></div>
    <Link href="/dashboard/settings/shipping" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"><MapPin size={16} /> Atur alamat pengirim</Link>
  </div>;
}
