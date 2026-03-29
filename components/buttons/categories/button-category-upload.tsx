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

import React, { useState } from "react";
import { toast } from "sonner";
type PropButtonCategoryUpload = {
  onUpdated: () => void;
};

export default function ButtonCategoryUpload({
  onUpdated,
}: PropButtonCategoryUpload) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  //   submit
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Upload failed");

      toast.success("Category uploaded successfully!");
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
          <PlusIcon className="w-4 h-4" />
          <span className="hidden lg:inline">Upload</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] font-satoshi">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload Category</DialogTitle>
            <DialogDescription>
              Upload the category information.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
          </div>

          <DialogFooter>
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
