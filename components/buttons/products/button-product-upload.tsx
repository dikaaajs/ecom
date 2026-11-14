"use client";

import { useEffect, useState } from "react";
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
import { PencilIcon, PlusIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeneralForm from "@/components/form/products/general-form";
import DimentionFrom from "@/components/form/products/dimention-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import MediaForm from "@/components/form/products/media-form";
import { toast } from "@/lib/notify";
import { FormDataProductType } from "@/types/product/form-data";
import { Option } from "@/types/option";

export function ButtonUploadProduct({
  onUpdated,
  products,
}: {
  onUpdated: any;
  products: any;
}) {
  let isEdit = false;
  if (products) isEdit = true;

  //   state for options
  const [tagsOptions, setTagsOptions] = useState<Option[]>([]);
  const [categoryOptions, setCategoriesOptions] = useState<Option[]>([]);

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // state form
  const [imageProduct, setImageProduct] = useState<string[]>([]);
  const [imageBanner, setImageBanner] = useState("");
  const [tagsValue, setTagsValue] = useState<[]>([]);
  const [categoriesValue, setCategoriesValue] = useState("");
  const [formData, setFormData] = useState<FormDataProductType>({
    type: "PHYSICAL",
    title: null,
    description: null,
    price: null,
    stock: null,
    weight: null,
    length: null,
    width: null,
    height: null,
  });

  // Di dalam ButtonUploadProduct
  useEffect(() => {
    if (open && products) {
      // 1. Populate data teks & angka
      setFormData({
        type: products.type || "PHYSICAL",
        title: products.title || "",
        description: products.description || "",
        price: products.price ?? null,
        stock: products.stock ?? null,
        weight: products.weight || null,
        length: products.length || null,
        width: products.width || null,
        height: products.height || null,
      });

      // 2. Populate Media
      setImageBanner(products.imageUrl || "");
      setImageProduct(products.images?.map((e: any) => e.url) || []);

      // 3. Populate Selects (Category & Tags)
      setCategoriesValue(products.categoryId || "");

      // Asumsi tags di data products berbentuk array objek {id, name}
      if (products.tags) {
        setTagsValue(
          products.tags.map((t: any) => ({
            value: t.id,
            label: t.name.charAt(0).toUpperCase() + t.name.slice(1),
          })),
        );
      }
    } else if (!open) {
      // Reset form saat dialog ditutup (opsional)
      resetForm();
    }
  }, [open, products]);

  // Fungsi helper reset form
  const resetForm = () => {
    setFormData({
      type: "PHYSICAL",
      title: null,
      description: null,
      price: null,
      stock: null,
      weight: null,
      length: null,
      width: null,
      height: null,
    });
    setImageBanner("");
    setImageProduct([]);
    setCategoriesValue("");
    setTagsValue([]);
  };

  // Fungsi handler untuk update state
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? value === ""
            ? null
            : Number(value)
          : value === ""
            ? null
            : value,
    }));
  };

  // get data option tags dan category
  useEffect(() => {
    if (!open) return;
    void Promise.all([fetchTags(), fetchCategories()]).catch(() => toast.error("Gagal memuat kategori atau tag. Tutup formulir lalu coba lagi."));
  }, [open]);

  const fetchTags = async () => {
    const res = await fetch("/api/tags");
    if (!res.ok) throw new Error("Gagal memuat tag");
    const data = await res.json();

    setTagsOptions(
      data.map((item: any) => ({
        value: item.id,
        label: item.name.charAt(0).toUpperCase() + item.name.slice(1),
      })),
    );
  };

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    if (!res.ok) throw new Error("Gagal memuat kategori");
    const data = await res.json();

    setCategoriesOptions(
      data.map((item: any) => ({
        value: item.id,
        label: item.name.charAt(0).toUpperCase() + item.name.slice(1),
      })),
    );
  };

  //   submit
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const restBody = {
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock ?? 0),
      weight: formData.type === "DIGITAL" ? 0 : Number(formData.weight ?? 0),
      length: formData.type === "DIGITAL" ? null : formData.length,
      width: formData.type === "DIGITAL" ? null : formData.width,
      height: formData.type === "DIGITAL" ? null : formData.height,
      imageUrl: imageBanner,
      categoryId: categoriesValue,
      tagIds: tagsValue.map((tag: any) => tag.value),
      images: imageProduct,
      isPublished: isEdit ? products.isPublished : true,
    };
    setLoading(true);

    try {
      // Tentukan URL dan Method
      const url = isEdit
        ? `/api/admin/products/${products.id}`
        : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restBody),
      });

      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        const details = Object.values(result.issues?.fieldErrors || {}).flat().join(" ");
        throw new Error(details || result.error || (isEdit ? "Gagal memperbarui produk" : "Gagal membuat produk"));
      }

      toast.success(isEdit ? "Produk berhasil diperbarui." : "Produk berhasil ditambahkan.");
      setOpen(false);
      onUpdated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      name: "General",
      value: "general",
      content: (
        <GeneralForm
          categoriesValue={categoriesValue}
          categoryOptions={categoryOptions}
          tagsOptions={tagsOptions}
          setCategoriesValue={setCategoriesValue}
          setTagsValue={setTagsValue}
          tagsValue={tagsValue}
          formData={formData}
          setProductType={(type) => setFormData((prev) => ({ ...prev, type }))}
          handleInputChange={handleInputChange}
        />
      ),
    },
    {
      name: "Dimensions",
      value: "dimensions",
      content:
        formData.type === "PHYSICAL" ? (
          <DimentionFrom
            formData={formData}
            handleInputChange={handleInputChange}
          />
        ) : (
          <p className="py-4 text-sm">
            Digital products do not require shipping dimensions.
          </p>
        ),
    },
    {
      name: "Media",
      value: "media",
      content: (
        <MediaForm
          imageBanner={imageBanner}
          setImageBanner={setImageBanner}
          imageProduct={imageProduct}
          setImageProduct={setImageProduct}
        />
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* button */}
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={isEdit ? "Edit Product" : "Upload Product"}>
          {isEdit ? <PencilIcon /> : <PlusIcon />}
          <span className="hidden lg:inline">
            {isEdit ? "Edit Product" : "Upload Product"}
          </span>
        </Button>
      </DialogTrigger>

      {/* form */}
      <DialogContent
        className="sm:max-w-[500px] max-h-[90%] font-satoshi"
        onPointerDownOutside={(e) => {
          // e.preventDefault();
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* header */}
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Product" : "Upload Product"}</DialogTitle>
            <DialogDescription>
              Fill in the product information and upload.
            </DialogDescription>
          </DialogHeader>

          {/* tabs form */}
          <div>
            <Tabs defaultValue="general" className="gap-1 pt-2">
              <TabsList className="bg-background mx-auto">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="data-[state=active]:border-border data-[state=active]:shadow-none!"
                  >
                    {tab.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              <ScrollArea className="flex max-h-[60vh] flex-col overflow-hidden">
                {tabs.map((tab) => (
                  <TabsContent
                    key={tab.value}
                    value={tab.value}
                    className="px-3"
                  >
                    {tab.content}
                  </TabsContent>
                ))}
              </ScrollArea>
            </Tabs>
          </div>

          <DialogFooter className="flex-row items-center justify-end border-t px-6 py-4">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading
                ? isEdit
                  ? "Updating..."
                  : "Uploading..."
                : isEdit
                  ? "Save Changes"
                  : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
