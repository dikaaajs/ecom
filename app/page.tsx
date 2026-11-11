"use client";

import { Footer } from "@/components/stack/footer";
import { ProductCard } from "@/components/stack/product-card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Map, Search, SearchX, Sparkles, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect, useMemo, useState } from "react";
import { ProductSkeletonGrid } from "@/components/stack/product-skeleton";
import type { StorefrontProduct } from "@/types/storefront";
import type { ProductsType } from "@/types/products";

import { useSiteSettings } from "@/components/providers/site-settings-provider";

export default function Home() {
  const { settings: site } = useSiteSettings();
  const router = useRouter();

  const [products, setProducts] = useState<ProductsType<StorefrontProduct>>({
    success: false,
    data: [],
    count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const getProducts = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/products", {
        method: "GET",
        cache: "no-store", // biar ga ke-cache
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.data.filter((product) => {
      const searchable = [product.title, product.description || "", product.category?.name || "", ...product.tags.map((tag) => tag.name)].join(" ").toLowerCase();
      return (!query || searchable.includes(query)) && (selectedType === "all" || product.type === selectedType);
    });
  }, [products.data, searchQuery, selectedType]);

  return (
    <div>
      {/* hero */}
      <div className="relative h-screen w-full bg-slate-900 font-satoshi">
        {/* Hero Background */}
        {site.heroImage && <Image
          unoptimized
          src={site.heroImage}
          alt="banner"
          layout="fill"
          objectFit="cover"
          className="absolute top-0 left-0 w-full h-full"
        />}

        {/* Overlay Gelap */}
        <div className="absolute inset-0 bg-black" style={{ opacity: site.heroOverlay / 100 }} />
        {site.announcement && <p className="absolute left-4 right-4 top-28 rounded-xl bg-black/40 p-3 text-center text-sm text-white">{site.announcement}</p>}

        {/* Konten Hero (Opsional) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
          <h1 className="text-4xl font-extrabold font-satoshi">
            {site.heroTitle}
          </h1>
          <p className="text-lg font-satoshi">
            {site.heroDescription}
          </p>
          <div className="flex gap-5 justify-center">
            <Button
              className="storefront-btn-primary cursor-pointer"
              onClick={() => router.push(site.heroButtonLink || "/product")}
            >
              <Globe />
              {site.heroButtonText}
            </Button>
          </div>
        </div>

        {/* card glass */}
        <div className="w-[200px] text-white absolute left-3 bottom-3 p-3 rounded-xl bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-30 border border-neutral-100/50">
          <h5 className="font-bold text-[1.5rem]">{loading ? "Explore" : products.count + " produk"}</h5>
          <p className="text-[.8rem]">
            Pilihan produk untuk kebutuhanmu
          </p>
        </div>
      </div>

      {/* explore */}
      <section className="relative bg-[#f6f9ff] px-4 pb-20 pt-24 font-satoshi md:px-6 lg:px-8" id="explore">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold tracking-wide text-blue-700">
                <Sparkles size={14} /> CURATED FOR YOU
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                {site.collectionTitle}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                {site.collectionDescription}
              </p>
            </div>
            <Link href="/product" className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50 sm:self-auto">
              Browse all products <ArrowRight size={17} />
            </Link>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-[0_8px_35px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <label htmlFor="home-product-search" className="relative block min-w-0 flex-1">
                <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" />
                <input
                  id="home-product-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search products, categories, or tags..."
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-[#f8faff] pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800">
                    <X size={17} />
                  </button>
                )}
              </label>
              <div role="group" aria-label="Filter product type" className="flex flex-wrap items-center gap-2">
                {[
                  { value: "all", label: "All products" },
                  { value: "PHYSICAL", label: "Physical" },
                  { value: "DIGITAL", label: "Digital" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selectedType === option.value}
                    onClick={() => setSelectedType(option.value)}
                    className={"rounded-xl border px-4 py-2.5 text-sm font-semibold transition " + (
                      selectedType === option.value
                        ? "storefront-btn-primary border-blue-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {!loading && !loadError && (
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500"><span className="font-bold text-slate-800">{filteredProducts.length}</span> products found</p>
              {(searchQuery || selectedType !== "all") && (
                <button type="button" className="text-xs font-bold text-blue-700 hover:underline" onClick={() => { setSearchQuery(""); setSelectedType("all"); }}>
                  Reset filters
                </button>
              )}
            </div>
          )}

          {loading ? (
            <ProductSkeletonGrid count={10} />
          ) : loadError ? (
            <div role="alert" className="flex flex-col items-center gap-4 rounded-2xl border border-rose-100 bg-white px-6 py-16 text-center">
              <SearchX size={34} className="text-rose-400" />
              <h3 className="text-xl font-bold text-slate-800">We could not load the products</h3>
              <p className="text-sm text-slate-500">Check your connection and try again.</p>
              <button type="button" onClick={getProducts} className="storefront-btn-primary rounded-xl px-5 py-2.5 text-sm font-bold text-white">Try again</button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-blue-200 bg-white px-6 py-16 text-center">
              <SearchX size={36} className="text-blue-500" />
              <h3 className="text-lg font-bold text-slate-800">No products found</h3>
              <p className="text-sm text-slate-500">Try another keyword or explore all product types.</p>
              <button type="button" className="storefront-btn-primary mt-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white" onClick={() => { setSearchQuery(""); setSelectedType("all"); }}>View all products</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  type={product.type}
                  title={product.title}
                  description={product.description}
                  tags={product.tags}
                  price={product.price}
                  imageUrl={product.imageUrl}
                  stock={product.stock}
                  categoryName={product.category?.name}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {site.showLocation && <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 md:grid-cols-2">
        <div><h2 className="text-3xl font-bold">{site.locationTitle}</h2><p className="mt-4 whitespace-pre-line">{site.locationDescription}</p><p className="mt-5 whitespace-pre-line">{site.storeAddress}</p>{site.mapsUrl && <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="storefront-btn-primary mt-6 inline-block rounded-xl px-5 py-3">Buka peta</a>}</div>
        {site.locationImage && <img src={site.locationImage} alt={site.locationTitle} className="h-72 w-full rounded-2xl object-cover"/>}
      </section>}
      {site.showFaq && <section className="mx-auto max-w-3xl px-6 py-20"><h2 className="mb-6 text-center text-3xl font-bold">{site.faqTitle}</h2><Accordion type="single" collapsible>{site.faqItems.map((item,i)=><AccordionItem key={i} value={String(i)}><AccordionTrigger className="text-left font-bold">{item.question}</AccordionTrigger><AccordionContent className="whitespace-pre-line">{item.answer}</AccordionContent></AccordionItem>)}</Accordion></section>}

      {/* footer */}
      <Footer />
    </div>
  );
}
