// columns.ts
"use client";

import { ButtonEditProduct } from "@/components/button-edit-product";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

export type Product = {
  id: string;
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  tags: string[];
  category: string;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
};

export function getColumns(onUpdated: () => void): ColumnDef<Product>[] {
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
      cell: ({ row }) => (
        <HoverCard>
          <HoverCardTrigger asChild>
            <span className="cursor-pointer">{row.original.title}</span>
          </HoverCardTrigger>
          <HoverCardContent className="z-50 w-[300px] space-y-[15px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium capitalize">
                  {row.original.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {row.original.description}
                </p>
              </div>
              <p className="text-green-500">{`Rp ${Number(
                row.original.price
              ).toLocaleString()}`}</p>
            </div>
            <img
              src={row.original.imageUrl}
              className="w-full rounded-md object-cover h-[200px] border border-slate-100"
              alt=""
            />
            <div className="flex gap-[5px]">
              {row.original.tags.map((tag, idx) => {
                return (
                  <Badge className="rounded-sm" key={idx}>
                    {tag}
                  </Badge>
                );
              })}
            </div>
          </HoverCardContent>
        </HoverCard>
      ),
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
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "inStock",
      header: "In Stock",
      cell: ({ row }) => (row.original.inStock ? "Yes" : "No"),
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
        return <ButtonEditProduct product={product} onUpdated={onUpdated} />;
      },
    },
  ];
}
