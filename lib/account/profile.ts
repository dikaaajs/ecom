import { z } from "zod";
const phone = z.string().trim().regex(/^\+?[0-9][0-9\s()-]{6,19}$/, "Nomor telepon tidak valid").max(20);
export const profileInput = z.object({
  name: z.string().trim().min(2,"Nama minimal 2 karakter").max(100),
  phone: z.union([z.literal(""), phone]),
  removeAvatar: z.boolean().optional(),
}).strict();
export const addressInput = z.object({
  label: z.string().trim().max(60), recipient: z.string().trim().min(2).max(100), phone,
  addressLine: z.string().trim().min(8).max(300), province: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100), district: z.string().trim().min(2).max(100),
  postalCode: z.string().regex(/^\d{5}$/,"Kode pos harus 5 angka"), isDefault: z.boolean(),
}).strict();
export const emailChangeInput = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(200)),
  password: z.string().min(1).max(128),
}).strict();
export type SavedAddress = z.infer<typeof addressInput> & { id: string };
export type CustomerProfile = { name: string; phone: string; email: string; avatarUrl: string | null; hasAvatar:boolean; emailVerifiedAt: string | null };
export type ProfileResponse = { profile: CustomerProfile; addresses: SavedAddress[] };
