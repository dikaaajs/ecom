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
import { Pencil, PlusIcon } from "lucide-react";
import { Tag, TagColor } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import React, { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { tagColorStyles } from "@/data/tag-colors";
type PropButtonTagEdit = {
  tag: Tag;
  onUpdated: () => void;
};

export default function ButtonTagEdit({ tag, onUpdated }: PropButtonTagEdit) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const colors = Object.values(TagColor);
  const [name, setName] = useState(tag.name);
  const [colorSelected, setColorSelected] = useState<TagColor>(tag.color);

  //   submit
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());
    data.color = colorSelected;

    try {
      const res = await fetch(`/api/tags/${tag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Upload failed");

      toast.success("tags uploaded successfully!");
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
          <Pencil className="w-4 h-4" />
          <span className="hidden lg:inline">Edit</span>
        </Button>
      </DialogTrigger>

      {/* content */}
      <DialogContent className="sm:max-w-[500px] font-satoshi">
        <form onSubmit={handleSubmit}>
          {/* header */}
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>Edit the tag information.</DialogDescription>
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
                defaultValue={name}
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
