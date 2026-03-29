"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { tagColorStyles } from "@/data/tag-colors";
import { ColumnDef } from "@tanstack/react-table";
import { Tag } from "@prisma/client";
import ButtonTagEdit from "@/components/buttons/tags/button-tag-edit.";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type TagTable = {
  id: string;
  name: string;
};

export function getTagColumn(onUpdated: () => void): ColumnDef<TagTable>[] {
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
      size: 1000,
      cell({ row }) {
        const tag = row.original as Tag;
        return <Badge className={tagColorStyles[tag.color]}>{tag.name}</Badge>;
      },
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
        const tag = row.original as Tag;
        return <ButtonTagEdit tag={tag} onUpdated={onUpdated} />;
      },
    },
  ];
}
