import { z } from "zod";

export const regionSelectionSchema = z.object({
  province: z.string().trim().min(2).max(100),
  provinceId: z.number().int().positive(),
  city: z.string().trim().min(2).max(100),
  cityId: z.number().int().positive(),
  district: z.string().trim().min(2).max(100),
  districtId: z.number().int().positive(),
});

export type RegionSelection = z.infer<typeof regionSelectionSchema>;
export const emptyRegionSelection: RegionSelection = {
  province: "", provinceId: 0, city: "", cityId: 0, district: "", districtId: 0,
};

export type RegionOption = { id: number; name: string; zipCode: string | null };
export type RegionLevel = "province" | "city" | "district";

const providerItem = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  zip_code: z.union([z.string(), z.number()]).optional().nullable(),
});
const providerResponse = z.object({
  meta: z.object({ status: z.string().optional(), code: z.number().optional() }).optional(),
  data: z.array(providerItem),
});

export class ShippingRegionError extends Error {
  constructor(message: string, public readonly status = 502) { super(message); }
}

/** Server-only RajaOngkir Shipping Cost API (step-by-step region hierarchy). */
export async function fetchShippingRegions(level: RegionLevel, parentId?: number): Promise<RegionOption[]> {
  const apiKey = process.env.RAJAONGKIR_API_KEY;
  if (!apiKey) throw new ShippingRegionError("Shipping Cost API key belum diatur di server.", 503);
  if (level !== "province" && (!Number.isSafeInteger(parentId) || !parentId || parentId < 1)) {
    throw new ShippingRegionError("ID wilayah induk tidak valid.", 400);
  }
  const suffix = level === "province" ? "province" : level === "city" ? `city/${parentId}` : `district/${parentId}`;
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 10000);
  try {
    const response = await fetch(`https://rajaongkir.komerce.id/api/v1/destination/${suffix}`, {
      headers: { key: apiKey, Accept: "application/json" },
      next: { revalidate: 86400 },
      signal: abort.signal,
    });
    if (response.status === 401 || response.status === 403) throw new ShippingRegionError("API key Shipping Cost ditolak RajaOngkir.", 503);
    if (!response.ok) throw new ShippingRegionError("Layanan wilayah RajaOngkir tidak tersedia.");
    const parsed = providerResponse.safeParse(await response.json());
    if (!parsed.success || parsed.data.meta?.status === "error" || (parsed.data.meta?.code && parsed.data.meta.code !== 200)) {
      throw new ShippingRegionError("Format respons wilayah RajaOngkir tidak sesuai.");
    }
    return parsed.data.data.map(entry => ({
      id: entry.id, name: entry.name,
      zipCode: entry.zip_code === null || entry.zip_code === undefined ? null : String(entry.zip_code),
    }));
  } catch (error) {
    if (error instanceof ShippingRegionError) throw error;
    throw new ShippingRegionError("Tidak dapat menghubungi layanan wilayah RajaOngkir.");
  } finally { clearTimeout(timer); }
}

/** Validate all client-supplied IDs AND names before persisting merchant origin. */
export async function verifyRegionSelection(region: RegionSelection): Promise<boolean> {
  if (!regionSelectionSchema.safeParse(region).success) return false;
  const provinces = await fetchShippingRegions("province");
  if (!provinces.some(item => item.id === region.provinceId && item.name === region.province)) return false;
  const cities = await fetchShippingRegions("city", region.provinceId);
  if (!cities.some(item => item.id === region.cityId && item.name === region.city)) return false;
  const districts = await fetchShippingRegions("district", region.cityId);
  return districts.some(item => item.id === region.districtId && item.name === region.district);
}
