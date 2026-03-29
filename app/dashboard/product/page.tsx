"use client";

import React, { useEffect, useState } from "react";
// import data from "./product.json";
// import tags from "../../../data/tags.json";
// import categories from "../../../data/categories.json";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductColumn } from "@/components/table/product/product-column";
import { ProductTable } from "@/components/table/product/product-table";
import { CategoryTable } from "@/components/table/categories/category-table";
import { getCategoryColumn } from "@/components/table/categories/category-column";
import { TagTable } from "@/components/table/tags/tag-table";
import { getTagColumn } from "@/components/table/tags/tag-column";

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
  const [categories, setCategories] = useState<any>();
  const [tags, setTags] = useState<any>();
  const [loading, setLoading] = useState(true);

  const getProducts = async () => {
    try {
      const res = await fetch("/api/admin/products", {
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

  // get category & tags
  const getCategories = async () => {
    try {
      const res = await fetch("/api/categories", {
        method: "GET",
        cache: "no-store", // biar ga ke-cache
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTags = async () => {
    try {
      const res = await fetch("/api/tags", {
        method: "GET",
        cache: "no-store", // biar ga ke-cache
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setTags(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProducts();
    getCategories();
    getTags();
  }, []);

  if (loading) {
    return (
      <div className="pt-5 w-full">
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
    <div className="pt-5 w-full overflow-x-hidden">
      <div className="w-full px-[20px] md:w-[95%] mx-auto space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[20px]">
          {/* category */}
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold text-xl">Category Table</h3>
              <p className="paragraf">Here's a list of your Category.</p>
            </div>
            <CategoryTable
              onUpdated={() => {
                getCategories();
              }}
              columns={getCategoryColumn(getCategories)}
              data={categories}
            />
          </div>

          {/* Tag */}
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold text-xl">Tags Table</h3>
              <p className="paragraf">Here's a list of your Tags.</p>
            </div>
            <TagTable
              onUpdated={() => {
                getTags();
              }}
              columns={getTagColumn(getTags)}
              data={tags}
            />
          </div>
        </div>
        <ProductTable
          columns={getProductColumn(getProducts)}
          data={products.data}
          onUpdated={() => {
            getProducts();
          }}
        />
      </div>
    </div>
  );
}
