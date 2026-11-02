import Link from "next/link";
import { ArrowUpRight, Package, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { tagColorStyles } from "@/data/tag-colors";
import type { Tag } from "@prisma/client";

interface ProductCardProps {
  id?: string;
  title: string;
  description: string | null;
  tags: Tag[];
  price: number | string;
  imageUrl: string | null;
  type?: "PHYSICAL" | "DIGITAL";
  categoryName?: string | null;
  stock?: number;
}

export function ProductCard({
  id,
  title,
  description,
  tags,
  price,
  imageUrl,
  type,
  categoryName,
  stock,
}: ProductCardProps) {
  const content = (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.035)] transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_14px_35px_rgba(15,23,42,0.10)]">
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {type && (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-lg border border-white/70 bg-white/95 px-2.5 py-1.5 text-[10px] font-bold text-blue-700 shadow-sm sm:text-xs">
            {type === "DIGITAL" ? <Sparkles size={13} /> : <Package size={13} />}
            {type === "DIGITAL" ? "Digital" : "Physical"}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-3 sm:p-4">
        <div>
          {categoryName && <p className="mb-1.5 truncate text-[11px] font-semibold text-blue-700">{categoryName}</p>}
          <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold leading-snug text-slate-800 sm:text-[15px]">{title}</h3>
        </div>
        <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{description || "Explore this product in our collection."}</p>
        <div className="mt-auto">
          <p className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(Number(price))}
          </p>
          {stock !== undefined && (
            <p className="mt-1.5 text-[11px] font-medium text-slate-500">
              {stock > 0 ? "Ready stock" : "Out of stock"}
            </p>
          )}
        </div>
        {tags.length > 0 && (
          <div className="flex gap-1.5 overflow-hidden pt-1">
            {tags.slice(0, 2).map((tag) => (
              <Badge key={tag.id} className={"max-w-[95px] truncate border-0 text-[10px] " + tagColorStyles[tag.color]}>{tag.name}</Badge>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs font-bold text-blue-700">
          <span>View details</span>
          <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </article>
  );

  return id ? (
    <Link href={"/product/" + id} className="block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
      {content}
    </Link>
  ) : content;
}
