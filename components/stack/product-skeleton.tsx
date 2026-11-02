type ProductSkeletonGridProps = { count?: number };

export function ProductSkeletonGrid({ count = 8 }: ProductSkeletonGridProps) {
  return (
    <div role="status" aria-label="Loading products">
      <span className="sr-only">Loading products, please wait...</span>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} aria-hidden="true" className="overflow-hidden rounded-[26px] border border-[#e6eeff] bg-white shadow-[0_10px_32px_rgba(79,124,255,0.08)] motion-safe:animate-pulse">
            <div className="storefront-card-hero aspect-[5/4]" />
            <div className="relative -mt-5 space-y-3 rounded-t-[24px] bg-white p-5">
              <div className="h-3 w-24 rounded-full bg-blue-100" />
              <div className="h-6 w-4/5 rounded-lg bg-slate-200" />
              <div className="h-6 w-1/2 rounded-full bg-blue-50" />
              <div className="h-4 w-full rounded-md bg-slate-100" />
              <div className="h-4 w-5/6 rounded-md bg-slate-100" />
              <div className="flex items-end justify-between gap-4 pt-4">
                <div className="space-y-2"><div className="h-3 w-10 rounded bg-slate-100" /><div className="h-6 w-24 rounded bg-slate-200" /></div>
                <div className="h-11 w-28 rounded-xl bg-blue-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
