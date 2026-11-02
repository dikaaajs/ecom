"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, SearchX, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { ProductCard } from "@/components/stack/product-card";
import { ProductSkeletonGrid } from "@/components/stack/product-skeleton";
import { Footer } from "@/components/stack/footer";
import type { StorefrontProduct } from "@/types/storefront";

export default function CatalogPage() {
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/products", { signal: controller.signal });
        if (!response.ok) throw new Error("Products unavailable");
        const payload = await response.json();
        setProducts(payload.data || []);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  const categories = useMemo(
    () => Array.from(new Map(products.filter((p) => p.category).map((p) => [p.category!.id, p.category!])).values()),
    [products],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = products.filter((p) => {
      const text = [p.title, p.description || "", p.category?.name || "", ...p.tags.map((tag) => tag.name)].join(" ").toLowerCase();
      return (!query || text.includes(query)) &&
        (category === "all" || p.category?.id === category) &&
        (type === "all" || p.type === type);
    });
    if (sort === "price-asc") list.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-desc") list.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "name") list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [products, search, category, type, sort]);

  function resetFilters() {
    setSearch("");
    setCategory("all");
    setType("all");
    setSort("newest");
  }

  return (
    <div className="min-h-screen bg-[#f7faf8] pt-28 font-satoshi sm:pt-32">
      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-500 px-6 py-10 text-white sm:px-10 sm:py-12">
          <div aria-hidden="true" className="absolute -right-10 -top-24 h-72 w-72 rounded-full border-[45px] border-white/10" />
          <div className="relative max-w-2xl">
            <Link href="/" className="text-xs font-semibold text-emerald-50/80 hover:underline">Home</Link>
            <span className="mx-2 text-emerald-100/60">/</span>
            <span className="text-xs font-semibold">Catalog</span>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold">
              <Sparkles size={14} /> DISCOVER SOMETHING NEW
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Explore our collection</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-emerald-50 sm:text-base">Shop unique physical and digital creations, curated for you.</p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
            <SlidersHorizontal size={17} className="text-emerald-600" />
            Find the right product
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label htmlFor="catalog-product-search" className="relative block sm:col-span-2 lg:col-span-1">
              <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
              <input
                id="catalog-product-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-[#f9fbfa] pl-11 pr-10 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
              {search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700"><X size={16} /></button>}
            </label>
            <select aria-label="Filter category" className="h-12 w-full rounded-xl border border-slate-200 bg-[#f9fbfa] px-3.5 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select aria-label="Filter product type" className="h-12 w-full rounded-xl border border-slate-200 bg-[#f9fbfa] px-3.5 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10" value={type} onChange={(event) => setType(event.target.value)}>
              <option value="all">All product types</option>
              <option value="PHYSICAL">Physical products</option>
              <option value="DIGITAL">Digital products</option>
            </select>
            <select aria-label="Sort products" className="h-12 w-full rounded-xl border border-slate-200 bg-[#f9fbfa] px-3.5 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="newest">Newest first</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>

        {loading ? (
          <ProductSkeletonGrid count={10} />
        ) : error ? (
          <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-20 text-center">
            <SearchX size={38} className="text-rose-400" />
            <h2 className="text-xl font-bold text-slate-800">Unable to load products</h2>
            <p className="text-sm text-slate-500">Please refresh the page and try again.</p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500"><strong className="text-slate-800">{filtered.length}</strong> products found</p>
              {(search || category !== "all" || type !== "all" || sort !== "newest") && (
                <button type="button" className="text-sm font-bold text-emerald-700 hover:underline" onClick={resetFilters}>Reset filters</button>
              )}
            </div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-white px-6 py-16 text-center">
                <SearchX size={38} className="text-emerald-600" />
                <h2 className="text-xl font-bold text-slate-800">No products found</h2>
                <p className="text-sm text-slate-500">Try a different keyword or remove some filters.</p>
                <button type="button" onClick={resetFilters} className="mt-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">View all products</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 lg:gap-5">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    description={product.description}
                    tags={product.tags}
                    price={product.price}
                    imageUrl={product.imageUrl}
                    type={product.type}
                    stock={product.stock}
                    categoryName={product.category?.name}
                  />
                ))}
              </div>
            )}
          </>
        )}
        <div className="mt-14 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ArrowRight size={14} /> More new finds are added to the collection as they become available.
        </div>
      </main>
      <Footer compact />
    </div>
  );
}
