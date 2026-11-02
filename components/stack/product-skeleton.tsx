type ProductSkeletonGridProps = {
  count?: number;
};

export function ProductSkeletonGrid({ count = 10 }: ProductSkeletonGridProps) {
  return (
    <div role="status" aria-label="Loading products">
      <span className="sr-only">Loading products, please wait...</span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 lg:gap-5">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_5px_20px_rgba(15,23,42,0.04)] motion-safe:animate-pulse"
          >
            <div className="aspect-square bg-slate-100" />
            <div className="space-y-3 p-3.5">
              <div className="h-3 w-1/3 rounded-full bg-emerald-50" />
              <div className="h-4 w-full rounded-md bg-slate-100" />
              <div className="h-4 w-3/4 rounded-md bg-slate-100" />
              <div className="h-5 w-2/3 rounded-md bg-slate-200" />
              <div className="h-3 w-1/2 rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
