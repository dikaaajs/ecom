import { z } from "zod";

export const SHIPPING_ORIGIN_SETTING_KEY = "shippingOrigin";

export const shippingOriginSchema = z.object({
  storeName: z.string().trim().min(2, "Nama toko minimal 2 karakter").max(100),
  senderName: z.string().trim().min(2, "Nama pengirim minimal 2 karakter").max(100),
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s()-]{6,19}$/, "Nomor telepon tidak valid").max(20),
  addressLine: z.string().trim().min(8, "Alamat jalan minimal 8 karakter").max(300),
  village: z.string().trim().max(100),
  district: z.string().trim().min(2, "Kecamatan harus diisi").max(100),
  city: z.string().trim().min(2, "Kota/kabupaten harus diisi").max(100),
  province: z.string().trim().min(2, "Provinsi harus diisi").max(100),
  postalCode: z.string().regex(/^[0-9]{5}$/, "Kode pos harus 5 digit"),
  latitude: z.number().finite().min(-11.5).max(6.5),
  longitude: z.number().finite().min(94).max(142),
  notes: z.string().trim().max(300),
}).strict();

export const savedShippingOriginSchema = shippingOriginSchema.extend({
  updatedAt: z.string().datetime(),
});

export type ShippingOriginInput = z.infer<typeof shippingOriginSchema>;
export type SavedShippingOrigin = z.infer<typeof savedShippingOriginSchema>;
