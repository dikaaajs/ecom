import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
}

export function ProductCard({ id, title, description, tags, price, imageUrl, type }: ProductCardProps) {
  const content = (
    <Card className="overflow-hidden transition-all hover:shadow-md pt-0 font-satoshi shadow-lg h-full">
      <div className="aspect-square relative overflow-hidden">
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={title}
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
        <div className="px-2 py-0.5 bottom-3 right-3 absolute z-20 rounded-md border border-gray-100 bg-white/90">
          <p className="font-bold text-[.8rem]">
            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(price))}
          </p>
        </div>
      </div>
      <CardHeader>
        <h3 className="font-extrabold text-md">{title}</h3>
        {type && <span className="text-xs text-muted-foreground">{type === "DIGITAL" ? "Digital product" : "Physical product"}</span>}
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map((tag) => (
            <Badge key={tag.id} className={tagColorStyles[tag.color]}>{tag.name}</Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2">{description || "No description available."}</p>
      </CardContent>
    </Card>
  );
  return id ? <Link href={`/product/${id}`} className="block h-full">{content}</Link> : content;
}
