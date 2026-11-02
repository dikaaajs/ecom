import type { Category, ProductType, Tag } from "@prisma/client";

export type StorefrontProduct = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: string | number;
  type: ProductType;
  stock: number;
  category: Category | null;
  tags: Tag[];
};
