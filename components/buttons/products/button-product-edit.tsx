"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import tags from "@/data/tags.json";
import categories from "@/data/categories.json";
import MultipleSelector from "@/components/multi-select";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ButtonEditProduct({
  product,
  onUpdated,
}: {
  product: any;
  onUpdated: () => void;
}) {
  const tagsOption = tags.map((item) => ({
    value: item.name,
    label: item.name.charAt(0).toUpperCase() + item.name.slice(1),
  }));

  const categoriesOption = categories.map((item) => ({
    value: item.name,
    label: item.name.charAt(0).toUpperCase() + item.name.slice(1),
  }));

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const [tagsValue, setTagsValue] = useState(
    product?.tags?.map((t: string) => ({ value: t, label: t })) || [],
  );
  const [categoriesValue, setCategoriesValue] = useState(
    product?.category || "fisik",
  );
  const [value, setValue] = useState(product?.imageUrl || "");

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const isImageUrl = /^https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp)$/i.test(
      pastedText,
    );

    if (isImageUrl) {
      setValue(pastedText);
      toast.success("Valid image URL pasted!");
    } else {
      setValue("");
      toast.error("The pasted text is not a valid image URL!");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "v" || !(e.ctrlKey || e.metaKey)) {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());
    data.inStock = formData.get("inStock") === "on";
    data.tags = tagsValue.map((item: any) => item.value);
    data.category = categoriesValue;
    data.imageUrl = value;

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Update failed");

      toast.success("Product updated successfully!");
      setOpen(false);
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="w-4 h-4" />
          <span className="hidden lg:inline">Edit</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] font-satoshi">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product information.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={product?.title}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                defaultValue={product?.description}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                defaultValue={product?.price}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              {value && (
                <img
                  src={value}
                  className="w-full rounded-md object-cover h-[200px] border border-slate-100 shadow-sm"
                  alt=""
                />
              )}
              <Input
                id="imageUrl"
                name="imageUrl"
                value={value}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                placeholder="Paste image URL here"
                readOnly
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Tags</Label>
              <MultipleSelector
                commandProps={{
                  label: "Select tags",
                }}
                value={tagsValue}
                onChange={(e: any) => setTagsValue(e)}
                defaultOptions={tagsOption}
                placeholder="Select tags"
                hideClearAllButton
                hidePlaceholderWhenSelected
                emptyIndicator={
                  <p className="text-center text-sm">No results found</p>
                }
                className="w-full"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                onValueChange={(e: any) => setCategoriesValue(e)}
                value={categoriesValue}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesOption.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="inStock"
                name="inStock"
                defaultChecked={product?.inStock}
              />
              <Label htmlFor="inStock">In Stock</Label>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
