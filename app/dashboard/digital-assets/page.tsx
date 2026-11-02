"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileArchive, FileLock2, FileUp, RefreshCw, ShieldCheck } from "lucide-react";

type DigitalProduct = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  digitalAsset: null | { id: string; fileName: string; contentType: string | null; updatedAt: string };
};

const MAX_SIZE = 4 * 1024 * 1024;

export default function DigitalAssetsPage() {
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/digital-assets", { cache: "no-store", signal });
      if (!response.ok) throw new Error("Tidak dapat memuat produk digital.");
      const payload: { products: DigitalProduct[] } = await response.json();
      if (!signal?.aborted) setProducts(payload.products);
    } catch (caught) {
      if (!signal?.aborted) setError(caught instanceof Error ? caught.message : "Gagal memuat data.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const pickFile = (productId: string, event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setNotice("");
    const file = event.target.files?.[0] || null;
    if (file && file.size > MAX_SIZE) {
      setFiles(prev => ({ ...prev, [productId]: null }));
      setError("File melebihi 4 MB. Gunakan file yang lebih kecil terlebih dahulu.");
      event.target.value = "";
      return;
    }
    setFiles(prev => ({ ...prev, [productId]: file }));
    // Allow choosing the same file again after a failed upload.
    event.target.value = "";
  };

  const upload = async (productId: string) => {
    const file = files[productId];
    if (!file || uploadingId) return;
    setUploadingId(productId);
    setError("");
    setNotice("");
    try {
      const form = new FormData();
      form.set("productId", productId);
      form.set("file", file);
      const response = await fetch("/api/admin/digital-assets", {
        method: "POST", body: form, cache: "no-store",
      });
      const result: { error?: string; message?: string } = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal mengunggah file.");
      setNotice("File berhasil disimpan secara private untuk produk digital.");
      setFiles(prev => ({ ...prev, [productId]: null }));
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tidak dapat mengunggah file.");
    } finally {
      setUploadingId(null);
    }
  };

  const ready = products.filter(p => p.digitalAsset).length;
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"><FileLock2 size={14}/> Digital Delivery</div>
          <h1 className="text-2xl font-bold text-slate-900">File Produk Digital</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Unggah PDF, ZIP, atau gambar digital ke Supabase Storage private. File tidak akan tersedia untuk pembeli sebelum autentikasi dan pembayaran diverifikasi.</p>
        </div>
        <button type="button" disabled={loading || !!uploadingId} onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50"><RefreshCw size={16}/> Muat ulang</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Produk digital</p><p className="mt-2 text-2xl font-extrabold">{products.length}</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">File tersimpan</p><p className="mt-2 text-2xl font-extrabold text-emerald-700">{ready}</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Belum memiliki file</p><p className="mt-2 text-2xl font-extrabold text-amber-700">{products.length - ready}</p></div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <ShieldCheck className="mt-0.5 shrink-0" size={20}/>
        <div><strong>File tidak dipublikasikan.</strong><p className="mt-1 leading-6">Gunakan bucket Supabase Storage private bernama <code>digital-products</code> atau atur <code>SUPABASE_DIGITAL_BUCKET</code> pada environment server. Maksimum 4 MB per file untuk unggahan melalui Vercel Function. File besar membutuhkan metode upload langsung ke storage pada pengembangan berikutnya.</p></div>
      </div>

      {!!error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertTriangle className="mt-0.5 shrink-0" size={18}/>{error}</div>}
      {!!notice && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 shrink-0" size={18}/>{notice}</div>}

      <div className="overflow-hidden rounded-xl border bg-white">
        {loading ? <div className="p-10 text-center text-sm text-slate-500">Memuat produk digital...</div> :
          products.length === 0 ? (
            <div className="p-12 text-center">
              <FileArchive className="mx-auto mb-3 text-slate-400" size={35}/>
              <h2 className="font-bold text-slate-900">Belum ada produk digital</h2>
              <p className="mt-2 text-sm text-slate-500">Buat produk dengan jenis DIGITAL terlebih dahulu.</p>
              <Link href="/dashboard/product" className="mt-4 inline-block text-sm font-semibold text-blue-700 underline">Kelola produk</Link>
            </div>
          ) : (
            <div className="divide-y">
              {products.map(product => (
                <div key={product.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-slate-900">{product.title}</h2>
                      <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " +
                        (product.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}>
                        {product.isPublished ? "Dipublikasikan" : "Draft"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{product.digitalAsset ?
                      <>File private: <strong className="font-semibold text-slate-700">{product.digitalAsset.fileName}</strong> · diperbarui {new Date(product.digitalAsset.updatedAt).toLocaleDateString("id-ID")}</> :
                      "Belum ada file digital yang diunggah."}
                    </p>
                  </div>
                  <div className="flex w-full max-w-lg flex-col gap-2 sm:flex-row sm:items-end">
                    <label className="min-w-0 flex-1 text-xs font-semibold text-slate-700">
                      {product.digitalAsset ? "Ganti file produk" : "Pilih file produk"}
                      <input
                        type="file" accept=".pdf,.zip,.png,.jpg,.jpeg,.webp"
                        disabled={!!uploadingId}
                        onChange={e => pickFile(product.id, e)}
                        className="mt-1 block w-full cursor-pointer rounded-lg border p-2 text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:font-semibold file:text-blue-700 disabled:opacity-50"/>
                      {!!files[product.id] && <span className="mt-1 block truncate text-xs text-blue-700">Dipilih: {files[product.id]?.name}</span>}
                    </label>
                    <button type="button" disabled={!files[product.id] || !!uploadingId} onClick={() => void upload(product.id)}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                      <FileUp size={16}/>{uploadingId === product.id ? "Mengunggah..." : product.digitalAsset ? "Ganti file" : "Unggah"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
      <p className="text-xs leading-5 text-slate-500">Belum ada tombol download pembeli atau URL file publik. Sistem unduhan setelah pembayaran akan ditambahkan ketika autentikasi pelanggan dan webhook payment gateway selesai.</p>
    </div>
  );
}
