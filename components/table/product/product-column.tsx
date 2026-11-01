// columns.ts
"use client";

import { ButtonEditProduct } from "@/components/buttons/products/button-product-edit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { tagColorStyles } from "@/data/tag-colors";
import { Tag, ProductImage } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import { ButtonUploadProduct } from "@/components/buttons/products/button-product-upload";
import CardProduct from "@/components/cards/product";
import { useRouter } from "next/navigation";

export type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: string;
  stock: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  imageUrl: string;
  category: {
    id: string;
    name: string;
  };
  isPublished: boolean;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
};

export function getProductColumn(onUpdated: () => void): ColumnDef<Product>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const router = useRouter();
        return (
          <HoverCard>
            <HoverCardTrigger asChild>
              <span
                className="cursor-pointer"
                onClick={() => router.push(`product/${row.original.id}`)}
              >
                {row.original.title}
              </span>
            </HoverCardTrigger>
            <HoverCardContent className="w-[300px]">
              <CardProduct row={row} />
            </HoverCardContent>
          </HoverCard>
        );
      },
    },
    {
      accessorFn: (row) => row.description,
      header: "Description",
    },
    {
      accessorKey: "price",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="justify-start"
          >
            Price
            <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => `Rp ${Number(row.original.price).toLocaleString()}`,
      enableSorting: true,
    },
    {
      accessorKey: "stock",
      header: "stock",
    },
    {
      accessorKey: "weight",
      header: "weight",
    },
    {
      accessorKey: "length",
      header: "length",
    },
    {
      accessorKey: "width",
      header: "width",
    },
    {
      accessorKey: "height",
      header: "height",
    },
    {
      accessorFn: (row) => row.category?.name,
      header: "Category",
    },
    {
      accessorKey: "updatedAt",
      header: "Last Update",
      cell: ({ row }) => new Date(row.original.updatedAt).toLocaleString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const product = row.original;
        return <ButtonUploadProduct products={product} onUpdated={onUpdated} />;
      },
    },
    {
      accessorKey: "isPublished",
      header: "Published",
      cell: ({ row }) => {
        const product = row.original;
        const [isPublished, setIsPublished] = useState(product.isPublished);
        const [loading, setLoading] = useState(false);

        const togglePublish = async (value: boolean) => {
          try {
            setLoading(true);

            const response = await fetch(`/api/admin/products/${product.id}`, {
              method: "PATCH",
              body: JSON.stringify({ isPublished: value }),
            });

            if (!response.ok) {
              throw new Error("Failed to update product");
            }

            setIsPublished(value);
            toast.success("berhasil mengubah data");
          } catch (error) {
            console.error("Error publishing product:", error);
            // Optionally show error toast/notification here
          } finally {
            setLoading(false);
          }
        };
        return (
          <Switch
            checked={isPublished}
            disabled={loading}
            onCheckedChange={togglePublish}
          />
        );
      },
    },
  ];
}
