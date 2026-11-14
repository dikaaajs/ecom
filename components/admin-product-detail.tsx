"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ButtonUploadProduct } from "@/components/buttons/products/button-product-upload";
import type { Product } from "@/components/table/product/product-column";

export function AdminProductDetail({ product }: { product: Product & { type: string; categoryId: string } }) {
  const router = useRouter();
  const images = [...new Set([product.imageUrl, ...product.images.map(image => image.url)].filter(Boolean))];
  return <main className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8">
    <Link href="/dashboard/product" className="text-sm font-medium text-blue-700 hover:underline">← Kembali ke daftar produk</Link>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="text-2xl font-bold">{product.title}</h2><p className="mt-2 text-sm text-muted-foreground">{product.type === "DIGITAL" ? "Produk digital" : "Produk fisik"} · {product.isPublished ? "Dipublikasikan" : "Disembunyikan"}</p></div>
      <ButtonUploadProduct products={product} onUpdated={() => router.refresh()} />
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-3">{images.length ? images.map((url, i) => <img key={url} src={url} alt={product.title + " — gambar " + (i + 1)} className="w-full rounded-xl border object-contain" />) : <p className="rounded-xl border p-6 text-sm text-muted-foreground">Belum ada gambar.</p>}</div>
      <div className="space-y-5 rounded-xl border bg-white p-6">
        <p className="text-2xl font-bold">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(product.price))}</p>
        <p className="whitespace-pre-wrap text-sm leading-6">{product.description}</p>
        <dl className="space-y-3 text-sm">{[
          ["Stok", product.stock], ["Kategori", product.category?.name || "Tanpa kategori"],
          ["Tag", product.tags.map(tag => tag.name).join(", ") || "Tanpa tag"],
          ...(product.type === "PHYSICAL" ? [["Berat", product.weight + " gram"], ["Dimensi (P × L × T)", [product.length, product.width, product.height].map(value => value ?? "—").join(" × ") + " cm"]] : []),
          ["Terakhir diperbarui", new Date(product.updatedAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB"],
        ].map(([label, value]) => <div key={label} className="border-t pt-3"><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}</dl>
        {product.type === "DIGITAL" && <Link href="/dashboard/digital-assets" className="inline-block text-sm font-semibold text-blue-700 hover:underline">Kelola file digital →</Link>}
      </div>
    </div>
  </main>;
}
