"use client";

import React, { useEffect, useState } from "react";
import data from "./product.json";
import tags from "../../../data/tags.json";
import categories from "../../../data/categories.json";
import { DataTable } from "./data-table";
import { getColumns } from "./columns";
import { columnsCategory } from "./column-category";
import { DataTableCategory } from "./data-table-category";
import { Skeleton } from "@/components/ui/skeleton";

export interface ProductsType {
  success: boolean;
  data: [];
  count: number;
}

export default function page() {
  const [products, setProducts] = useState<ProductsType>({
    success: false,
    data: [],
    count: 0,
  });
  const [loading, setLoading] = useState(true);

  const getProducts = async () => {
    try {
      const res = await fetch("/api/products", {
        method: "GET",
        cache: "no-store", // biar ga ke-cache
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  if (loading) {
    return (
      <div className="pt-5">
        <div className="w-[95%] mx-auto space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[20px]">
            <Skeleton className="w-full h-[200px]" />
            <Skeleton className="w-full h-[200px]" />
          </div>
          <Skeleton className="w-full h-[300px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-5">
      <div className="w-[95%] mx-auto space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[20px]">
          {/* category */}
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold text-xl">Category Table</h3>
              <p className="text-muted-foreground text-sm font-normal">
                Here's a list of your Category. data based on
                ./data/category.json
              </p>
            </div>
            <DataTableCategory columns={columnsCategory} data={categories} />
          </div>

          {/* Tag */}
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold text-xl">Tags Table</h3>
              <p className="text-muted-foreground text-sm font-normal">
                Here's a list of your Tags. data based on ./data/tags.json
              </p>
            </div>
            <DataTableCategory columns={columnsCategory} data={tags} />
          </div>
        </div>
        <DataTable
          columns={getColumns(getProducts)}
          data={products.data}
          onUpdated={() => {
            getProducts();
          }}
        />
      </div>
    </div>
  );
}
