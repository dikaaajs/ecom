import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminProductDetail } from "@/components/admin-product-detail";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") redirect("/auth/signin");
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { category: true, tags: true, images: true } });
  if (!product) notFound();
  return <AdminProductDetail product={JSON.parse(JSON.stringify(product))} />;
}
