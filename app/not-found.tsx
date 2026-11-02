import Link from "next/link";
import { ArrowLeft, ArrowRight, Compass, Home, PackageSearch, SearchX, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden bg-[#f8fcf9] pt-28 font-satoshi text-slate-900">
      <div aria-hidden="true" className="pointer-events-none absolute -left-44 top-36 h-[380px] w-[380px] rounded-full bg-emerald-100/70 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-28 bottom-24 h-[420px] w-[420px] rounded-full bg-lime-100/70 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:py-24">
        <section className="order-2 text-center lg:order-1 lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold tracking-wide text-emerald-700 shadow-sm">
            <Compass size={15} />
            Looks like you took a wrong turn
          </span>
          <div className="mt-6 flex items-center justify-center gap-3 lg:justify-start">
            <span className="text-7xl font-black tracking-[-0.09em] text-emerald-600 sm:text-8xl">404</span>
            <span className="h-12 w-px bg-slate-200" />
            <span className="text-left text-sm font-medium leading-relaxed text-slate-500">PAGE NOT<br />FOUND</span>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Oops! This page went <span className="text-emerald-600">missing.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-slate-500 lg:mx-0">
            The link may have changed, or this product is no longer available.
            There are plenty of other great finds waiting for you.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
              <Home size={18} /> Back to homepage
            </Link>
            <Link href="/product" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-800 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
              <ShoppingBag size={18} /> Browse products <ArrowRight size={16} />
            </Link>
          </div>
          <Link href="/product" className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-slate-500 underline-offset-4 transition hover:text-emerald-700 hover:underline">
            <ArrowLeft size={15} /> Continue exploring our collection
          </Link>
        </section>

        <div className="order-1 mx-auto w-full max-w-md lg:order-2">
          <div className="relative mx-auto flex aspect-square items-center justify-center rounded-[2.75rem] border border-emerald-100 bg-white/75 shadow-[0_30px_90px_rgba(16,185,129,0.09)]">
            <div aria-hidden="true" className="absolute inset-8 rounded-[2rem] border-2 border-dashed border-emerald-100" />
            <div aria-hidden="true" className="absolute left-8 top-9 flex h-14 w-14 -rotate-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-sm">
              <SearchX size={27} />
            </div>
            <div aria-hidden="true" className="absolute bottom-9 right-6 flex h-16 w-16 rotate-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
              <ShoppingBag size={29} />
            </div>
            <div className="relative flex h-44 w-44 rotate-[-7deg] items-center justify-center rounded-[2.5rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-xl shadow-emerald-100 sm:h-52 sm:w-52">
              <PackageSearch className="h-24 w-24 text-emerald-600 sm:h-28 sm:w-28" strokeWidth={1.25} />
            </div>
            <div aria-hidden="true" className="absolute bottom-12 left-8 rounded-xl border border-slate-100 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-md">
              Nothing here... yet!
            </div>
          </div>
        </div>
      </div>
      <p className="relative pb-8 text-center text-xs text-slate-400">Pixel Perfection · Find something you love</p>
    </main>
  );
}
