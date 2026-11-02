"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/stack/product-card";
import { Footer } from "@/components/stack/footer";
import type { Tag, Category, ProductType } from "@prisma/client";

type CatalogProduct = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: string | number;
  type: ProductType;
  stock: number;
  category: Category | null;
  tags: Tag[];
};

export default function CatalogPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
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
      } catch (err) {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  const categories = useMemo(() => Array.from(new Map(products.filter(p => p.category).map(p => [p.category!.id, p.category!])).values()), [products]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = products.filter(p =>
      (!query || p.title.toLowerCase().includes(query) || (p.description || "").toLowerCase().includes(query)) &&
      (category === "all" || p.category?.id === category) &&
      (type === "all" || p.type === type)
    );
    if (sort === "price-asc") list.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-desc") list.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "name") list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [products, search, category, type, sort]);

  return (
    <div className="min-h-screen pt-32 font-satoshi bg-gray-50">
      <main className="container mx-auto px-4 md:px-6 pb-24">
        <h1 className="text-3xl font-bold">Product catalog</h1>
        <p className="mt-2 text-muted-foreground">Discover physical and digital products from our collection.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-8">
          <input aria-label="Search products" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="border rounded-md p-3 bg-white" />
          <select aria-label="Filter category" className="border rounded-md p-3 bg-white" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select aria-label="Filter product type" className="border rounded-md p-3 bg-white" value={type} onChange={e => setType(e.target.value)}>
            <option value="all">All product types</option>
            <option value="PHYSICAL">Physical products</option>
            <option value="DIGITAL">Digital products</option>
          </select>
          <select aria-label="Sort products" className="border rounded-md p-3 bg-white" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </div>
        {loading ? <p role="status">Loading products...</p> : error ? <p role="alert">Unable to load products. Please refresh and try again.</p> : filtered.length === 0 ? <p>No products match your filters.</p> : (
          <>
            <p className="mb-5 text-sm text-muted-foreground">{filtered.length} products found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map(p => <ProductCard key={p.id} id={p.id} title={p.title} description={p.description} tags={p.tags} price={p.price} imageUrl={p.imageUrl} type={p.type} />)}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
