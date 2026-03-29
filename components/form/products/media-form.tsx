import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createPortal } from "react-dom";

import { Trash, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type MediaFormProps = {
  imageBanner: string;
  setImageBanner: (url: string) => void;
  imageProduct: string[];
  setImageProduct: React.Dispatch<React.SetStateAction<string[]>>;
};

export default function MediaForm({
  imageBanner,
  setImageBanner,
  imageProduct,
  setImageProduct,
}: MediaFormProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const checkStringUrl = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault(); // blok default paste behavior
    const pastedText = e.clipboardData.getData("text");

    // regex sederhana cek URL gambar
    const isImageUrl = /^https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp)$/i.test(
      pastedText,
    );

    return { isImageUrl, pastedText };
  };

  //   handle paste for image banner
  const handlePasteImageBanner = (
    e: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    const { isImageUrl, pastedText } = checkStringUrl(e);
    if (isImageUrl) {
      setImageBanner(pastedText);
      toast.success("Valid image URL pasted!");
    } else {
      setImageBanner("");
      toast.error("The pasted text is not a valid image URL!");
    }
  };

  const handlePasteImagesProduct = (
    e: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    const { isImageUrl, pastedText } = checkStringUrl(e);

    if (isImageUrl) {
      setImageProduct((prev) => [...prev, pastedText]);
      toast.success("Valid image URL pasted!");
    } else {
      toast.error("The pasted text is not a valid image URL!");
    }
  };

  const handleRemoveImage = (url: string) => {
    setImageProduct((prev) => prev.filter((img) => img !== url));
    toast.success("Image removed!");
  };

  //   cegah untuk user hanya bisa paste saja
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "v" || !(e.ctrlKey || e.metaKey)) {
      e.preventDefault();
    }
  };

  return (
    <div className="grid gap-4 py-2">
      {/* image banner */}
      <div className="grid gap-2">
        <Label htmlFor="imageBanner">Image banner</Label>
        {imageBanner && (
          <img
            src={imageBanner}
            className="w-full rounded-md object-cover h-[200px] border border-slate-100 shadow-sm"
            alt=""
          />
        )}
        <Input
          id="imageBanner"
          name="imageBanner"
          value={imageBanner}
          onPaste={handlePasteImageBanner}
          onKeyDown={handleKeyDown}
          placeholder="paste image link here"
          readOnly
        />
      </div>

      {/* image product */}
      <div className="grid gap-2">
        <Label htmlFor="imageUrl">Image product</Label>
        {imageProduct && (
          <div className="flex gap-2 flex-wrap">
            {imageProduct.map((image: string, idx: number) => {
              return (
                <div key={`${image}-${idx}`} className="relative group">
                  {/* IMAGE */}
                  <img
                    src={image}
                    onClick={() => setPreviewImage(image)}
                    className="rounded-md object-cover h-[100px] w-[100px] border border-slate-100 shadow-sm cursor-pointer hover:opacity-80 transition"
                    alt=""
                  />

                  {/* DELETE BUTTON */}
                  <Button
                    type="button"
                    onClick={() => handleRemoveImage(image)}
                    className="absolute top-1 right-1 bg-black/60 hover:text-red-600 text-xs px-1 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    <Trash className="h-1 w-1" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        <Input
          id="imageUrl"
          name="imageUrl"
          onPaste={handlePasteImagesProduct}
          onKeyDown={handleKeyDown}
          placeholder="paste image link here"
          readOnly
        />
      </div>

      {/* preview image */}
      {previewImage &&
        createPortal(
          <div
            // 1. Z-INDEX HARUS SANGAT TINGGI (di atas 50 milik Dialog)
            // 2. pointer-events-auto memaksa elemen ini bisa diklik meskipun body di-lock
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImage(null);
            }}
          >
            <div className="relative max-h-[90%] max-w-[90%] flex items-center justify-center">
              <img
                src={previewImage}
                onClick={(e) => e.stopPropagation()} // Cegah klik gambar menutup overlay
                className="max-h-[80vh] rounded-lg shadow-2xl object-contain"
                alt="Preview"
              />

              {/* Pindahkan Button ke dalam div relative yang sama dengan gambar */}
              {/* Tambahkan TooltipProvider jika tombol masih tidak responsif */}
              <Button
                variant="outline"
                size="icon"
                type="button" // Pastikan type button agar tidak submit form
                className="absolute -top-4 -right-4 z-[10000] rounded-full bg-white hover:bg-slate-100 text-black shadow-md"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPreviewImage(null);
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close preview image</span>
              </Button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
