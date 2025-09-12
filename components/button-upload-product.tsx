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
import { PlusIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import tags from "../data/tags.json";
import categories from "../data/categories.json";
import MultipleSelector from "./multi-select";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ButtonUploadProduct({ onUpdated }: { onUpdated: any }) {
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
  const [tagsValue, setTagsValue] = useState([]);
  const [categoriesValue, setCategoriesValue] = useState("fisik");
  const router = useRouter();

  const [value, setValue] = useState("");

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault(); // blok default paste behavior
    const pastedText = e.clipboardData.getData("text");

    // regex sederhana cek URL gambar
    const isImageUrl = /^https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp)$/i.test(
      pastedText
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
    // cegah ketik manual, hanya izinkan paste
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

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Upload failed");

      toast.success("Product uploaded successfully!");
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
          <PlusIcon />
          <span className="hidden lg:inline">Upload Product</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] font-satoshi">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload Product</DialogTitle>
            <DialogDescription>
              Fill in the product information and upload.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
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
                onChange={(e: any) => {
                  console.log(e);
                  setTagsValue(e);
                }}
                defaultOptions={tagsOption}
                placeholder="Select categories"
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
                onValueChange={(e: any) => {
                  console.log(e);
                  setCategoriesValue(e);
                }}
                value={categoriesValue}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesOption.map((c) => {
                    return (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="inStock" name="inStock" />
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
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
