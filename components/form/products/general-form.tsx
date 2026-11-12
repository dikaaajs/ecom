import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/notify";
import MultipleSelector from "@/components/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Option } from "@/types/option";

type GeneralFormType = {
  tagsOptions: Option[];
  categoryOptions: Option[];
  tagsValue: [];
  setTagsValue: (e: any) => void;
  categoriesValue: string;
  setCategoriesValue: (e: any) => void;
  formData: any;
  setProductType: (type: "PHYSICAL" | "DIGITAL") => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function GeneralForm({
  tagsOptions,
  categoriesValue,
  categoryOptions,
  setCategoriesValue,
  setTagsValue,
  tagsValue,
  formData,
  setProductType,
  handleInputChange,
}: GeneralFormType) {
  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label>Product type</Label>
        <Select value={formData.type ?? "PHYSICAL"} onValueChange={(v) => setProductType(v as "PHYSICAL" | "DIGITAL")}>
          <SelectTrigger><SelectValue placeholder="Select product type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="PHYSICAL">Physical product (requires shipping)</SelectItem>
            <SelectItem value="DIGITAL">Digital product (no shipping)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* title */}
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="buku sihir"
          value={formData.title ?? ""}
          onChange={handleInputChange}
        />
      </div>

      {/* description */}
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          placeholder="persiapan masuk universitas hogwarts"
          value={formData.description ?? ""}
          onChange={handleInputChange}
        />
      </div>

      {/* price */}
      <div className="grid gap-2">
        <Label htmlFor="price">Price</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          required
          placeholder="5000"
          value={formData.price ?? ""}
          onChange={handleInputChange}
        />
      </div>

      {/* tags */}
      <div className="grid gap-2">
        <Label htmlFor="tags">Tags</Label>
        <MultipleSelector
          commandProps={{
            label: "Select tags",
          }}
          value={tagsValue}
          onChange={(e: any) => {
            setTagsValue(e);
          }}
          defaultOptions={tagsOptions}
          placeholder="select tags"
          hideClearAllButton
          hidePlaceholderWhenSelected
          emptyIndicator={
            <p className="text-center text-sm">No results found</p>
          }
          className="w-full"
        />
      </div>

      {/* category */}
      <div className="grid gap-2">
        <Label htmlFor="category">Category</Label>
        <Select
          onValueChange={(e: any) => {
            setCategoriesValue(e);
          }}
          value={categoriesValue}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="select categories" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((c: any) => {
              return (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* stock */}
      <div className="grid gap-2">
        <Label htmlFor="stock">Stock</Label>
        <Input
          id="stock"
          name="stock"
          type="number"
          placeholder="10"
          value={formData.stock ?? ""}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
}
