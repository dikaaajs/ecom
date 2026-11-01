import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import slugify from "slugify";
import type { ProductInput } from "@/lib/validations/product";

export function productData(input: ProductInput): Prisma.ProductCreateInput {
  return {
    title: input.title,
    slug: slugify(input.title, { lower: true, strict: true }),
    description: input.description ?? null,
    price: input.price,
    stock: input.stock,
    type: input.type,
    weight: input.type === "DIGITAL" ? 0 : input.weight ?? 0,
    length: input.type === "DIGITAL" ? null : input.length ?? null,
    width: input.type === "DIGITAL" ? null : input.width ?? null,
    height: input.type === "DIGITAL" ? null : input.height ?? null,
    imageUrl: input.imageUrl || null,
    isPublished: input.isPublished,
    category: input.categoryId ? { connect: { id: input.categoryId } } : undefined,
    tags: { connect: input.tagIds.map(id => ({ id })) },
    images: { create: input.images.map(url => ({ url })) },
  };
}

export async function createProduct(input: ProductInput) {
  return prisma.product.create({ data: productData(input) });
}

export async function updateProduct(id: string, input: ProductInput) {
  const data = productData(input);
  return prisma.product.update({
    where: { id },
    data: {
      ...data,
      category: input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true },
      tags: { set: input.tagIds.map(id => ({ id })) },
      images: { deleteMany: {}, create: input.images.map(url => ({ url })) },
    },
  });
}
