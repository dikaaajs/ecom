import { Badge } from "@/components/ui/badge";
import { tagColorStyles } from "@/data/tag-colors";
import type { Product } from "@/components/table/product/product-column";

type PreviewProduct = Pick<Product, "title" | "description" | "price" | "imageUrl" | "images" | "tags">;

export default function CardProduct({ product }: { product: PreviewProduct }) {
  const images = product.images ?? [];
  return <article aria-label="Pratinjau produk" className="min-w-0 space-y-3 whitespace-normal [overflow-wrap:anywhere]">
    <div className="flex min-w-0 items-start justify-between gap-3">
      <h3 className="min-w-0 flex-1 text-sm font-semibold leading-5">{product.title}</h3>
      <Badge className="max-w-[45%] shrink-0 whitespace-normal bg-emerald-50 text-right text-emerald-700">
        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(product.price))}
      </Badge>
    </div>
    {product.description && <p className="line-clamp-4 text-xs leading-5 text-muted-foreground">{product.description}</p>}
    {product.imageUrl && <div className="flex h-40 items-center justify-center overflow-hidden rounded-lg border bg-white">
      <img src={product.imageUrl} alt={product.title} className="h-full w-full object-contain p-2" />
    </div>}
    {images.length > 0 && <div aria-label="Galeri produk" className="flex flex-wrap gap-2">
      {images.slice(0, 3).map(image => <img key={image.id} src={image.url} alt="" className="h-10 w-10 shrink-0 rounded-md border bg-white object-contain" />)}
      {images.length > 3 && <span className="flex h-10 min-w-10 items-center justify-center rounded-md bg-slate-100 px-2 text-xs text-slate-600">+{images.length - 3}</span>}
    </div>}
    {!!product.tags?.length && <div className="flex min-w-0 flex-wrap gap-1.5">
      {product.tags.map(tag => <Badge key={tag.id} className={"max-w-full whitespace-normal " + tagColorStyles[tag.color]}>{tag.name}</Badge>)}
    </div>}
  </article>;
}
