"use client";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductColumn, type Product } from "@/components/table/product/product-column";
import { ProductTable } from "@/components/table/product/product-table";
import { CategoryTable } from "@/components/table/categories/category-table";
import { getCategoryColumn, type Category } from "@/components/table/categories/category-column";
import { TagTable } from "@/components/table/tags/tag-table";
import { getTagColumn, type TagTable as TagRow } from "@/components/table/tags/tag-column";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setRefreshing(true);
    setError("");
    try {
      const values = await Promise.all(["/api/admin/products", "/api/categories", "/api/tags"].map(async url => {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error("Gagal memuat katalog. Periksa koneksi dan sesi admin, lalu coba lagi.");
        return response.json();
      }));
      setProducts(values[0].data);
      setCategories(values[1]);
      setTags(values[2]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat katalog.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const onUpdated = () => { void load(); };
  if (loading) return <div className="space-y-4 p-6"><Skeleton className="h-48 w-full" /><Skeleton className="h-80 w-full" /></div>;
  return <main className="w-full space-y-6 overflow-x-hidden p-4 md:p-6">
    <div className="flex items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">Kelola katalog</h2><p className="mt-1 text-sm text-muted-foreground">Produk, kategori, tag dan publikasi toko.</p></div>
      <button type="button" onClick={onUpdated} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-50"><RefreshCw size={16} />{refreshing ? "Memuat…" : "Muat ulang"}</button>
    </div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="min-w-0 space-y-3"><h3 className="text-lg font-semibold">Kategori</h3><CategoryTable columns={getCategoryColumn(onUpdated)} data={categories} onUpdated={onUpdated} /></section>
      <section className="min-w-0 space-y-3"><h3 className="text-lg font-semibold">Tag</h3><TagTable columns={getTagColumn(onUpdated)} data={tags} onUpdated={onUpdated} /></section>
    </div>
    <section className="min-w-0 space-y-3"><h3 className="text-lg font-semibold">Produk</h3><ProductTable columns={getProductColumn(onUpdated)} data={products} onUpdated={onUpdated} /></section>
  </main>;
}
