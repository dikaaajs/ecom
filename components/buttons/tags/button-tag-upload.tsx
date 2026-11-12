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
import { PlusIcon } from "lucide-react";
import { TagColor } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import React, { useState } from "react";
import { toast } from "@/lib/notify";
import { Badge } from "@/components/ui/badge";
import { tagColorStyles } from "@/data/tag-colors";
type PropButtonTagUpload = {
  onUpdated: () => void;
};

export default function ButtonTagUpload({ onUpdated }: PropButtonTagUpload) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const colors = Object.values(TagColor);
  const [name, setName] = useState("barang ajaib");
  const [colorSelected, setColorSelected] = useState<TagColor>("GRAY");

  //   submit
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());
    data.color = colorSelected;

    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Upload failed");

      toast.success("Tag berhasil ditambahkan.");
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
      {/* button */}
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon className="w-4 h-4" />
          <span className="hidden lg:inline">Upload</span>
        </Button>
      </DialogTrigger>

      {/* content */}
      <DialogContent className="sm:max-w-[500px] font-satoshi">
        <form onSubmit={handleSubmit}>
          {/* header */}
          <DialogHeader>
            <DialogTitle>Upload Tag</DialogTitle>
            <DialogDescription>Upload the tag information.</DialogDescription>
          </DialogHeader>

          {/* name */}
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="barang ajaib"
                required
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* color pick */}
          <Select
            defaultValue={colorSelected}
            onValueChange={(val) => setColorSelected(val as TagColor)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {colors.map((color) => {
                  return (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* preview */}
          <div className="pt-3 flex flex-col justify-center items-center gap-1">
            <p className="paragraf">preview :</p>
            <Badge className={tagColorStyles[colorSelected]}>{name}</Badge>
          </div>

          {/* action */}
          <DialogFooter className="pt-5">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Loading..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
