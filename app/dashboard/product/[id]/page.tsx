"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, ShoppingCart, Minus, Plus } from "lucide-react";

// Sample product data
const PRODUCT_DATA = {
  id: "cmnb46lue0013twl8rkhwnm3m",
  title: "asuka",
  slug: "asuka",
  description: "best tsundere ever",
  price: "15000",
  stock: 1,
  weight: 111,
  length: 100,
  width: 377,
  height: 455,
  imageUrl:
    "https://i.pinimg.com/1200x/50/d7/e7/50d7e7bcbbdada5a5b92219d4e122e97.jpg",
  categoryId: "cmnb0dr6x000xtwl8xtem8nwi",
  isPublished: true,
  createdAt: "2026-03-29T02:02:37.741Z",
  updatedAt: "2026-03-29T02:02:37.741Z",
  category: {
    id: "cmnb0dr6x000xtwl8xtem8nwi",
    name: "waifu",
    slug: "waifu",
    createdAt: "2026-03-29T00:16:13.546Z",
  },
  tags: [
    {
      id: "cmnb0atkz000ttwl8e19butbm",
      name: "calm",
      slug: "calm",
      color: "LIME",
      createdAt: "2026-03-29T00:13:56.373Z",
    },
    {
      id: "cmnb0by5o000vtwl8ojdh1z1z",
      name: "tsundere",
      slug: "tsundere",
      color: "ROSE",
      createdAt: "2026-03-29T00:14:48.825Z",
    },
  ],
  images: [
    {
      id: "cmnb46lue0014twl82sg1qek4",
      url: "https://i.pinimg.com/736x/5c/49/38/5c49383093f435797fcac96c4f4b2756.jpg",
      productId: "cmnb46lue0013twl8rkhwnm3m",
    },
    {
      id: "cmnb46lue0015twl88cdeqs1f",
      url: "https://i.pinimg.com/1200x/0c/81/57/0c815732ccdd7d60a0760f771da52a41.jpg",
      productId: "cmnb46lue0013twl8rkhwnm3m",
    },
    {
      id: "cmnb46luf0016twl8ux2juz1u",
      url: "https://i.pinimg.com/736x/23/85/af/2385af5fca130e96378c6ca9250b6db7.jpg",
      productId: "cmnb46lue0013twl8rkhwnm3m",
    },
    {
      id: "cmnb46luf0017twl8m74xd980",
      url: "https://i.pinimg.com/736x/8c/22/b1/8c22b1b41768b52bbdb858e7a2f8b72d.jpg",
      productId: "cmnb46lue0013twl8rkhwnm3m",
    },
    {
      id: "cmnb46luf0018twl89smq16yk",
      url: "https://i.pinimg.com/736x/06/3b/1d/063b1dffa7ec822548532956e1b908c1.jpg",
      productId: "cmnb46lue0013twl8rkhwnm3m",
    },
    {
      id: "cmnb46luf0018tasdasdsad89smq16yk",
      url: "https://i.pinimg.com/736x/06/3b/1d/063b1dffa7ec822548532956e1b908c1.jpg",
      productId: "cmnb46lue0013twl8rkhwnm3m",
    },
  ],
};

const TAG_COLOR_MAP: Record<string, string> = {
  LIME: "bg-lime-100 text-lime-800",
  ROSE: "bg-rose-100 text-rose-800",
  BLUE: "bg-blue-100 text-blue-800",
  PURPLE: "bg-purple-100 text-purple-800",
  ORANGE: "bg-orange-100 text-orange-800",
  GRAY: "bg-gray-100 text-gray-800",
};

export default function ProductDetailPage() {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const selectedImage =
    PRODUCT_DATA.images[selectedImageIndex]?.url || PRODUCT_DATA.imageUrl;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity > 0 && newQuantity <= PRODUCT_DATA.stock) {
      setQuantity(newQuantity);
    }
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(price));
  };

  return (
    <main className="min-h-screen from-slate-50 to-slate-100 py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square w-full bg-slate-100 rounded-md overflow-hidden">
              <img
                src={selectedImage}
                alt={PRODUCT_DATA.title}
                className="object-cover h-full w-full"
              />

              {/* Thumbnail Gallery */}
              <div className="flex gap-1 bg-white absolute bottom-2 left-2 p-1 rounded-md">
                {PRODUCT_DATA.images.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative h-10 w-10 md:h-14 md:w-14 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? "shadow-sm shadow-gray-200 ring-2 ring-blue-100"
                        : ""
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={`${PRODUCT_DATA.title} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Title and Category */}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 capitalize mb-2">
                    {PRODUCT_DATA.title}
                  </h1>
                </div>
              </div>
              <p className="paragraph">{PRODUCT_DATA.description}</p>
            </div>

            {/* Tags */}
            {PRODUCT_DATA.tags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_DATA.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      className={`capitalize ${
                        TAG_COLOR_MAP[tag.color] ||
                        "bg-slate-100 text-slate-800"
                      }`}
                      variant="outline"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Price and Stock */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">
                    Harga
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {formatPrice(PRODUCT_DATA.price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-600 mb-1">
                    Stok Tersedia
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {PRODUCT_DATA.stock} unit
                  </p>
                </div>
              </div>
            </Card>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Jumlah</p>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="w-20 text-center font-semibold text-lg">
                  {quantity}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= PRODUCT_DATA.stock}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                size="lg"
                className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <ShoppingCart className="w-5 h-5" />
                Tambah ke Keranjang
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsFavorite(!isFavorite)}
                className={
                  isFavorite ? "bg-rose-50 border-rose-200 text-rose-600" : ""
                }
              >
                <Heart
                  className="w-5 h-5"
                  fill={isFavorite ? "currentColor" : "none"}
                />
              </Button>
            </div>

            {/* Product Specifications */}
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Spesifikasi Produk
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Berat</span>
                  <span className="font-semibold text-slate-900">
                    {PRODUCT_DATA.weight} g
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Panjang</span>
                  <span className="font-semibold text-slate-900">
                    {PRODUCT_DATA.length} mm
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Lebar</span>
                  <span className="font-semibold text-slate-900">
                    {PRODUCT_DATA.width} mm
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Tinggi</span>
                  <span className="font-semibold text-slate-900">
                    {PRODUCT_DATA.height} mm
                  </span>
                </div>
              </div>
            </Card>

            {/* Additional Info */}
            <Card className="p-4 bg-slate-50">
              <p className="text-xs text-slate-500 mb-2">
                <span className="font-semibold">Terakhir diperbarui:</span>{" "}
                {new Date(PRODUCT_DATA.updatedAt).toLocaleDateString("id-ID")}
              </p>
              {PRODUCT_DATA.stock === 0 && (
                <p className="text-sm font-semibold text-rose-600">
                  ⚠️ Produk saat ini tidak tersedia
                </p>
              )}
              {PRODUCT_DATA.stock <= 3 && PRODUCT_DATA.stock > 0 && (
                <p className="text-sm font-semibold text-orange-600">
                  ⚡ Hanya tinggal {PRODUCT_DATA.stock} unit
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
