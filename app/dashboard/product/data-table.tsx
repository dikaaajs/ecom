"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/data-table-pagination";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { PlusIcon, Trash } from "lucide-react";
import { ButtonUploadProduct } from "@/components/button-upload-product";
import { toast } from "sonner";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onUpdated: any;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onUpdated,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  });

  const handleDelete = async () => {
    const selectedIds = table
      .getSelectedRowModel()
      .rows.map((row: any) => row.original.id);

    if (selectedIds.length === 0) {
      toast.error("Tidak ada data yang dipilih");
      return;
    }

    try {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus data");
      }

      const data = await res.json();
      console.log("Delete response:", data);

      // ✅ Bisa reload data table atau trigger re-fetch
      table.resetRowSelection(); // hapus checkbox yang masih kepilih
      toast.success("Data berhasil dihapus");
      onUpdated();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Terjadi kesalahan saat menghapus data");
    }
  };

  return (
    <div className="space-y-2 font-satoshi">
      {/* header */}
      <div className="flex justify-between items-center">
        <Input
          placeholder="Filter titles..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm h-[30px]"
        />
        {/* left */}
        <div className="flex gap-[10px]">
          <Button variant={"outline"} size="sm" onClick={handleDelete}>
            <Trash className="text-red-600" />
          </Button>
          <ButtonUploadProduct onUpdated={onUpdated} />
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      <span>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </span>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* pagination */}
      <div className="mt-[14px]">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
