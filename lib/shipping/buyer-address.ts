import { z } from "zod";

/**
 * Guest delivery details are a draft only. They must be validated again on the
 * server before any future order is created or quoted with a shipping provider.
 */
export const BUYER_ADDRESS_DRAFT_KEY = "ecom-buyer-delivery-draft-v1";

export const buyerAddressSchema = z.object({
  recipient: z.string().trim().min(2, "Nama penerima minimal 2 karakter").max(100),
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s()-]{6,19}$/, "Nomor HP tidak valid").max(20),
  email: z.email("Alamat email tidak valid").max(200),
  province: z.string().trim().min(2, "Provinsi wajib diisi").max(100),
  city: z.string().trim().min(2, "Kota/kabupaten wajib diisi").max(100),
  district: z.string().trim().min(2, "Kecamatan wajib diisi").max(100),
  village: z.string().trim().min(2, "Kelurahan/desa wajib diisi").max(100),
  postalCode: z.string().trim().regex(/^[0-9]{5}$/, "Kode pos harus 5 angka"),
  addressLine: z.string().trim().min(8, "Alamat lengkap minimal 8 karakter").max(300),
  notes: z.string().trim().max(300),
  latitude: z.number().finite().min(-11.5).max(6.5).nullable(),
  longitude: z.number().finite().min(94).max(142).nullable(),
}).strict().refine(
  input => (input.latitude === null) === (input.longitude === null),
  { path: ["latitude"], message: "Koordinat peta tidak lengkap" },
);

export type BuyerAddress = z.infer<typeof buyerAddressSchema>;

export const emptyBuyerAddress: BuyerAddress = {
  recipient: "", phone: "", email: "", province: "", city: "",
  district: "", village: "", postalCode: "", addressLine: "",
  notes: "", latitude: null, longitude: null,
};
