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
import ButtonCategoryUpload from "@/components/buttons/categories/button-category-upload";
import { toast } from "@/lib/notify";
import ButtonTagUpload from "@/components/buttons/tags/button-tag-upload";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onUpdated: () => void;
}

export function TagTable<TData, TValue>({
  columns,
  data,
  onUpdated,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const table = useReactTable({
    data: data ?? [],
    columns,
    getRowId: (row) => (row as { id: string }).id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  });

  // handle delete
  const handleDelete = async () => {
    if (deleting) return;
    const selectedIds = table
      .getSelectedRowModel()
      .rows.map((row: any) => row.original.id);

    if (selectedIds.length === 0) {
      toast.warning("Tidak ada data yang dipilih");
      return;
    }

    if (!window.confirm("Hapus " + selectedIds.length + " data yang dipilih?")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/tags", {
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

      table.resetRowSelection();
      toast.success("Data berhasil dihapus");
      onUpdated();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Terjadi kesalahan saat menghapus data");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-2 font-satoshi">
      {/* header */}
      <div className="flex justify-between items-center gap-[5px]">
        <Input
          placeholder="Filter name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm text-sm h-[30px]"
        />
        {/* left */}
        <div className="flex gap-[10px]">
          <Button variant={"outline"} size="sm" onClick={handleDelete} disabled={deleting || !table.getSelectedRowModel().rows.length} aria-label="Hapus data terpilih">
            <Trash className="text-red-600" />
          </Button>
          <ButtonTagUpload onUpdated={onUpdated} />
        </div>
      </div>

      {/* body */}
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
                          header.getContext(),
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
                        cell.getContext(),
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
      <div className="mt-[14px]">
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
