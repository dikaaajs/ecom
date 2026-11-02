"use client";

import { Footer } from "@/components/stack/footer";
import { ProductCard } from "@/components/stack/product-card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Map, Search, SearchX, Sparkles, X } from "lucide-react";
import Image from "next/image";
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

export default function Home() {
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
      <div className="relative h-screen w-full font-satoshi">
        {/* Hero Background */}
        <Image
          src="/wallpaper.gif"
          alt="banner"
          layout="fill"
          objectFit="cover"
          className="absolute top-0 left-0 w-full h-full"
        />

        {/* Overlay Gelap */}
        <div className="absolute top-0 left-0 w-full h-full bg-black/40  "></div>

        {/* Konten Hero (Opsional) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
          <h1 className="text-4xl font-extrabold font-satoshi">
            Pixel Perfection
          </h1>
          <p className="text-lg font-satoshi">
            Discover a collection of exclusive, high-quality pixel art. From
            classic characters to fantasy worlds—find the perfect piece for you!
          </p>
          <div className="flex gap-5 justify-center">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
              onClick={() => router.push("/product")}
            >
              <Globe />
              Explore
            </Button>
          </div>
        </div>

        {/* card glass */}
        <div className="w-[200px] text-white absolute left-3 bottom-3 p-3 rounded-xl bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-30 border border-neutral-100/50">
          <h5 className="font-bold text-[1.5rem]">{loading ? "Explore" : products.count + " designs"}</h5>
          <p className="text-[.8rem]">
            Choose from Over 55 Unique Designs for Your Need
          </p>
        </div>
      </div>

      {/* explore */}
      <section className="relative bg-[#f7faf8] px-4 pb-20 pt-24 font-satoshi md:px-6 lg:px-8" id="explore">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold tracking-wide text-emerald-700">
                <Sparkles size={14} /> CURATED FOR YOU
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Explore our <span className="text-emerald-600">collection</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                Find unique physical and digital creations, handpicked for your next project or everyday inspiration.
              </p>
            </div>
            <a href="/product" className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 sm:self-auto">
              Browse all products <ArrowRight size={17} />
            </a>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-[0_8px_35px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <label htmlFor="home-product-search" className="relative block min-w-0 flex-1">
                <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
                <input
                  id="home-product-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search products, categories, or tags..."
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-[#f9fbfa] pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
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
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
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
                <button type="button" className="text-xs font-bold text-emerald-700 hover:underline" onClick={() => { setSearchQuery(""); setSelectedType("all"); }}>
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
              <button type="button" onClick={getProducts} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">Try again</button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-white px-6 py-16 text-center">
              <SearchX size={36} className="text-emerald-500" />
              <h3 className="text-lg font-bold text-slate-800">No products found</h3>
              <p className="text-sm text-slate-500">Try another keyword or explore all product types.</p>
              <button type="button" className="mt-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700" onClick={() => { setSearchQuery(""); setSelectedType("all"); }}>View all products</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 lg:gap-5">
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

      {/* find us */}
      <div className="pt-[200px] px-5 md:px-6 lg:px-8 bg-gray-50 flex justify-center gap-10 flex-col md:flex-row h-fit">
        {/* text */}
        <div className="w-full md:w-1/2 font-satoshi">
          <h2 className="text-[7rem] font-extrabold mb-4 leading-[100px]">
            Find Our Place
          </h2>
          <p className="w-full">
            Step into a space where colors speak, pixels breathe, and every
            detail tells a story. This is where imagination finds its shape —
            and you, your place.
          </p>
        </div>

        {/* image */}
        <div className="w-full md:w-1/2 h-[280px]">
          <div className="w-full bg-black h-full relative rounded-md">
            <Image
              src="/store.webp"
              alt="location"
              layout="fill"
              objectFit="cover"
              className="shadow-lg rounded-md"
            />
            <div className="flex flex-col justify-center gap-[10px] w-[200px] h-[200px] bg-white shadow-xl border-neutral-900/10 border-1 absolute -bottom-[100px] left-5 rounded-md text-center">
              <Image
                alt="pin map"
                src={"/pin.png"}
                width={50}
                height={100}
                className="mx-auto"
              />
              <div>
                <p className="font-bold font-satoshi">jl Cisaranten no 28</p>
                <p className="font-satoshi text-[.8rem] font-medium leading-[15px]">
                  Visit our store
                </p>
              </div>
              <Button className="mx-[10px]">
                <Map /> maps
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* faq */}
      <div className="pt-[200px]">
        {/* header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold">FAQ ?</h2>
          <p>some frequently asked questions</p>
        </div>

        {/* body */}
        <div className="w-[90%] md:w-1/2 mx-auto !font-satoshi">
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger className="font-bold font-satoshi text-lg">
                What products do you sell?
              </AccordionTrigger>
              <AccordionContent>
                We offer a variety of pixel art-themed accessories including
                keychains, tote bags, stickers, and custom prints.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="font-bold font-satoshi text-lg">
                Can I request a custom pixel art design?
              </AccordionTrigger>
              <AccordionContent>
                Yes! We accept custom orders for pixel art designs. Just send us
                your concept or reference, and we’ll create it for you.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="font-bold font-satoshi text-lg">
                What printing methods do you use?
              </AccordionTrigger>
              <AccordionContent>
                We use high-quality digital printing for vibrant pixel details,
                and we also offer heat press for textile items like shirts and
                tote bags.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="font-bold font-satoshi text-lg">
                Do you ship internationally?
              </AccordionTrigger>
              <AccordionContent>
                Yes, we ship worldwide. Shipping fees and delivery times vary
                based on your location.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="font-bold font-satoshi text-lg">
                How can I place an order?
              </AccordionTrigger>
              <AccordionContent>
                You can place an order through our website or contact us
                directly on Instagram or WhatsApp for custom requests.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* footer */}
      <Footer />
    </div>
  );
}
