"use client";

import { ButtonEditProduct } from "@/components/buttons/products/button-product-edit";
import ButtonCategoryEdit from "@/components/buttons/categories/button-category-edit.";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Category = {
  id: string;
  name: string;
};

export function getCategoryColumn(
  onUpdated: () => void,
): ColumnDef<Category>[] {
  return [
    {
      id: "select",
      size: 40,
      maxSize: 40,
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
      accessorKey: "name",
      header: "Name",
      size: 1000, // kolom utama
    },
    {
      accessorKey: "productCount",
      header: "product count",
      cell(props: any) {
        return (
          <p className="paragraf underline">
            {props.row.original._count.products}
          </p>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      size: 10,
      maxSize: 10,
      cell: ({ row }) => {
        const category = row.original;
        return <ButtonCategoryEdit category={category} onUpdated={onUpdated} />;
      },
    },
  ];
}
