import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/stack/product-card";
import { Footer } from "@/components/stack/footer";

export const dynamic = "force-dynamic";

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, isPublished: true },
    include: { tags: true, category: true, images: true },
  });
  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: {
      isPublished: true,
      id: { not: product.id },
      ...(product.categoryId ? { categoryId: product.categoryId } : {}),
    },
    include: { tags: true },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const formatPrice = new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(Number(product.price));

  return (
    <div className="min-h-screen flex flex-col mt-[100px] font-satoshi">
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Link href="/product" className="text-sm text-blue-700 hover:underline">← Back to catalog</Link>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <div>
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img src={product.imageUrl || product.images[0]?.url || "/placeholder.svg"} alt={product.title} className="w-full h-full object-contain" />
            </div>
            {product.images.length > 0 && (
              <div className="flex gap-3 mt-3 overflow-x-auto">
                {product.images.map((img) => <img key={img.id} src={img.url} alt={product.title} className="w-20 h-20 rounded object-cover" />)}
              </div>
            )}
          </div>
          <section className="space-y-5">
            <div>
              {product.category && <p className="text-sm text-muted-foreground">{product.category.name}</p>}
              <h1 className="text-3xl font-bold mt-1">{product.title}</h1>
            </div>
            <div className="flex gap-2 flex-wrap">
              {product.tags.map(tag => <span key={tag.id} className="text-xs border rounded-full px-3 py-1">{tag.name}</span>)}
            </div>
            <p className="text-2xl font-bold text-blue-700">{formatPrice}</p>
            <p className="text-sm">{product.type === "DIGITAL" ? "Digital product · No shipping required" : "Physical product · Shipping calculated at checkout"}</p>
            <p className="text-sm">{product.stock > 0 ? `In stock: ${product.stock}` : "Out of stock"}</p>
            <p className="text-gray-700 whitespace-pre-wrap">{product.description || "No description available."}</p>
            <p className="text-sm text-muted-foreground">Shopping cart and checkout will be implemented in the next phase.</p>
          </section>
        </div>
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Related products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map(item => (
                <ProductCard key={item.id} id={item.id} title={item.title} description={item.description} tags={item.tags} price={Number(item.price)} imageUrl={item.imageUrl} type={item.type} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
