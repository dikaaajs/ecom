import Link from "next/link";
import { Heart, ArrowUpRight, Package, Sparkles } from "lucide-react";
import type { Tag } from "@prisma/client";
import { Badge } from "../ui/badge";
import { tagColorStyles } from "@/data/tag-colors";

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
  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(price));

  const card = (
    <article className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-[#e6eeff] bg-white shadow-[0_10px_32px_rgba(79,124,255,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(79,124,255,0.19)]">
      {/* container */}
      <div className="storefront-card-hero relative flex aspect-[5/4] items-center justify-center overflow-hidden">
        {/* image banner */}
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={title}
          loading="lazy"
          className="max-h-full max-w-full object-contain drop-shadow-[0_12px_12px_rgba(34,57,113,0.16)] transition duration-500 group-hover:scale-105"
        />

        {/* like button */}
        <span
          aria-hidden="true"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-[#4f7cff] shadow-sm backdrop-blur-sm"
        >
          <Heart size={19} />
        </span>
      </div>
      <div className="relative -mt-5 flex flex-1 flex-col rounded-t-[24px] bg-white p-4 sm:p-5">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-[#4f7cff]">
          {type === "DIGITAL" ? <Sparkles size={14} /> : <Package size={14} />}
          <span>
            {categoryName ||
              (type === "DIGITAL" ? "Digital product" : "Physical product")}
          </span>
        </div>
        <h3 className="line-clamp-2 min-h-[2.75rem] text-lg font-extrabold leading-snug tracking-tight text-[#17172f] sm:text-xl">
          {title}
        </h3>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.slice(0, 2).map((tag) => (
              <Badge className={tagColorStyles[tag.color]} key={tag.id}>
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
        <p className="mt-3 line-clamp-3 min-h-[3.6rem] text-xs leading-5 text-slate-500 sm:text-sm">
          {description || "Discover something special from our collection."}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          {/* information price */}
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Price
            </p>
            <p className="mt-1 text-base font-extrabold tracking-tight text-[#17172f] sm:text-lg">
              {formattedPrice}
            </p>
            {stock !== undefined && (
              <p className="mt-1 text-[10px] text-slate-400">
                {stock > 0 ? "Ready stock" : "Out of stock"}
              </p>
            )}
          </div>

          {/* button */}
          <span className="w-fit storefront-btn-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white sm:px-4 sm:text-sm">
            Details <ArrowUpRight size={16} />
          </span>
        </div>
      </div>
    </article>
  );

  return id ? (
    <Link
      href={"/product/" + id}
      className="block h-full rounded-[26px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f7cff]"
    >
      {card}
    </Link>
  ) : (
    card
  );
}
