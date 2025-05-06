"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingCart, Heart, Share2, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/stack/product-card";
import { Footer } from "@/components/stack/footer";
import { use } from "react";
import { products } from "@/app/dummy";

export default function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Find the product by ID
  const { id } = use(params);
  const product: any =
    products.find((p) => p.id === parseInt(id)) || products[0];

  // Get related products
  const relatedProductIds = product.relatedProducts || [];
  const relatedProducts = products
    .filter((p) => p.id !== product.id) // Hindari produk yang sedang ditampilkan
    .sort(() => Math.random() - 0.5) // Acak urutan produk
    .slice(0, 4); // Ambil 4 produk secara acak

  return (
    <div className="min-h-screen flex flex-col mt-[100px] font-satoshi">
      {/* Product Detail */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-gray-100 rounded-lg overflow-hidden relative aspect-square">
            <Image
              src={product.imageUrl || "/placeholder.svg"}
              alt={product.title}
              fill
              className="object-contain p-4"
            />
            {/* Pixel art frame border */}
            <div
              className="absolute inset-0 pointer-events-none border-8 border-transparent"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0H4V4H0V0Z' fill='%233B82F6'/%3E%3Cpath d='M12 0H16V4H12V0Z' fill='%233B82F6'/%3E%3Cpath d='M0 12H4V16H0V12Z' fill='%233B82F6'/%3E%3Cpath d='M12 12H16V16H12V12Z' fill='%233B82F6'/%3E%3C/svg%3E\")",
                backgroundPosition: "0 0, 100% 0, 0 100%, 100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            ></div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{product.title}</h1>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon">
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center mt-2 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-sm text-gray-600 ml-2">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>

              <div className="flex flex-wrap gap-1 mt-4">
                {product.tags.map((tag: any) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="text-2xl font-bold text-blue-700 mb-4">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              }).format(product.price)}
            </div>

            <p className="text-gray-700 mb-6">{product.description}</p>

            <div className="mt-auto">
              <Button className="w-full bg-blue-700 hover:bg-blue-600">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="includes">What's Included</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="p-4 border rounded-b-lg">
              <h3 className="font-bold text-lg mb-2">Product Details</h3>
              <p className="mb-4">
                This high-quality pixel art asset is perfect for game
                developers, digital artists, and collectors. Each pixel is
                carefully placed to create a visually appealing and authentic
                retro aesthetic.
              </p>
              <p>
                Our pixel art is created by professional artists with years of
                experience in the field. All assets are delivered in
                high-resolution formats that can be easily integrated into your
                projects.
              </p>
            </TabsContent>
            <TabsContent value="includes" className="p-4 border rounded-b-lg">
              <h3 className="font-bold text-lg mb-2">What's Included</h3>
              <ul className="list-disc pl-5 space-y-1">
                {product.includes?.map((item: any, index: any) => (
                  <li key={index} className="text-gray-700">
                    {item}
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="reviews" className="p-4 border rounded-b-lg">
              <h3 className="font-bold text-lg mb-2">Customer Reviews</h3>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <div className="flex items-center mb-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < 5
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 font-semibold">Amazing quality!</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    By GameDev123 - 2 weeks ago
                  </p>
                  <p className="mt-2">
                    The detail in this pixel art is incredible. I used it in my
                    indie game and it looks perfect. Highly recommended!
                  </p>
                </div>
                <div className="border-b pb-4">
                  <div className="flex items-center mb-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < 4
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 font-semibold">Great asset</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    By PixelFan - 1 month ago
                  </p>
                  <p className="mt-2">
                    Very well made pixel art. The animation frames are smooth
                    and the character design is excellent.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`}>
                <ProductCard
                  title={product.title}
                  description={product.description}
                  tags={product.tags}
                  price={product.price}
                  imageUrl={product.imageUrl}
                />
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
