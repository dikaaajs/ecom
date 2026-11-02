import { ProductSkeletonGrid } from "@/components/stack/product-skeleton";

export default function ProductDetailLoading() {
  return (
    <main role="status" aria-label="Loading product details" className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-24 pt-36 font-satoshi sm:px-6">
      <span className="sr-only">Loading product details...</span>
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="aspect-square rounded-3xl bg-slate-100 motion-safe:animate-pulse" />
        <div className="space-y-5 pt-4 motion-safe:animate-pulse">
          <div className="h-5 w-24 rounded-full bg-blue-100" />
          <div className="h-9 w-4/5 rounded-lg bg-slate-200" />
          <div className="h-5 w-1/3 rounded-lg bg-slate-100" />
          <div className="h-10 w-1/2 rounded-lg bg-slate-200" />
          <div className="h-24 w-full rounded-xl bg-slate-100" />
        </div>
      </div>
      <div className="mt-16 space-y-5">
        <div className="h-7 w-48 rounded-lg bg-slate-100 motion-safe:animate-pulse" />
        <ProductSkeletonGrid count={5} />
      </div>
    </main>
  );
}
