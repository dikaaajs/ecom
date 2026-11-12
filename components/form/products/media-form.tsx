"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash } from "lucide-react";

type MediaFormProps = {
  imageBanner: string;
  setImageBanner: (url: string) => void;
  imageProduct: string[];
  setImageProduct: React.Dispatch<React.SetStateAction<string[]>>;
};
export default function MediaForm({ imageBanner, setImageBanner, imageProduct, setImageProduct }: MediaFormProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  function addImage() {
    const value = imageUrl.trim();
    try {
      const url = new URL(value);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error();
      if (imageProduct.includes(value)) { toast.error("Gambar sudah ada."); return; }
      setImageProduct(images => [...images, value]);
      setImageUrl("");
    } catch { toast.error("Masukkan tautan gambar http atau https yang valid."); }
  }
  return <div className="grid gap-4 py-2">
    <div className="grid gap-2">
      <Label htmlFor="imageBanner">Gambar utama (tautan URL)</Label>
      {imageBanner && <img src={imageBanner} alt="Gambar utama produk" className="h-48 w-full rounded-md border object-contain" />}
      <Input id="imageBanner" type="url" value={imageBanner} onChange={event => setImageBanner(event.target.value)} placeholder="https://contoh.com/produk.jpg" />
    </div>
    <div className="grid gap-2">
      <Label htmlFor="galleryImageUrl">Galeri produk (tautan URL)</Label>
      <div className="flex gap-2"><Input id="galleryImageUrl" type="url" value={imageUrl} onChange={event => setImageUrl(event.target.value)} placeholder="https://contoh.com/detail.jpg" onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); addImage(); } }} /><Button type="button" variant="outline" onClick={addImage}>Tambah gambar</Button></div>
      <p className="text-xs text-muted-foreground">Masukkan tautan gambar yang dapat diakses publik, lalu tekan Tambah gambar. Periksa pratinjau sebelum menyimpan.</p>
      <div className="flex flex-wrap gap-3">{imageProduct.map((image, index) => <div key={image + index} className="space-y-1">
        <button type="button" aria-label={"Lihat gambar " + (index + 1)} onClick={() => setPreviewImage(image)}><img src={image} alt={"Galeri produk " + (index + 1)} className="h-24 w-24 rounded-md border object-cover" /></button>
        <Button type="button" size="sm" variant="outline" aria-label={"Hapus gambar " + (index + 1)} onClick={() => setImageProduct(images => images.filter((_, i) => i !== index))}><Trash size={14} />Hapus</Button>
      </div>)}</div>
    </div>
    <Dialog open={!!previewImage} onOpenChange={open => { if (!open) setPreviewImage(null); }}>
      <DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle>Pratinjau gambar</DialogTitle><DialogDescription>Periksa gambar galeri produk.</DialogDescription></DialogHeader>
        {previewImage && <img src={previewImage} alt="Pratinjau galeri produk" className="max-h-[70vh] w-full object-contain" />}
      </DialogContent>
    </Dialog>
  </div>;
}
