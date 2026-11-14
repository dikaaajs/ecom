import { z } from "zod";

/** Server-only adapter. Never import into browser components. */
const rawRate = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  service: z.string().optional(),
  description: z.string().optional(),
  cost: z.number().int().nonnegative(),
  etd: z.union([z.string(), z.number()]).nullable().optional(),
}).passthrough();
const providerResponse = z.object({
  meta: z.object({
    code: z.number().optional(),
    status: z.string().optional(),
  }).optional(),
  data: z.array(rawRate),
});

export type RajaOngkirRate = {
  courier: string;
  courierCode: string;
  service: string;
  description: string;
  cost: number;
  estimate: string | null;
};

export class ShippingRateError extends Error {
  constructor(message: string, public readonly status = 502) { super(message); }
}

const TTL_MS = 5 * 60_000;
const cache = new Map<string, { expires: number; data: RajaOngkirRate[] }>();

/** Price preview only. Final order submission must re-quote server-side. */
export async function getRajaOngkirRates(args: {
  originId: number; destinationId: number; weightGram: number; couriers: string;
}): Promise<RajaOngkirRate[]> {
  const apiKey = process.env.RAJAONGKIR_API_KEY;
  if (!apiKey) throw new ShippingRateError("Shipping Cost API key belum dikonfigurasi.", 503);
  if (!Number.isSafeInteger(args.originId) || args.originId < 1 ||
      !Number.isSafeInteger(args.destinationId) || args.destinationId < 1 ||
      !Number.isSafeInteger(args.weightGram) || args.weightGram < 1 || args.weightGram > 100000 ||
      !/^[a-z]+(?::[a-z]+)*$/.test(args.couriers) || args.couriers.length > 200) {
    throw new ShippingRateError("Parameter pengecekan ongkir tidak valid.", 400);
  }

  const key = [args.originId, args.destinationId, args.weightGram, args.couriers].join(":");
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.data;

  const body = new URLSearchParams({
    origin: String(args.originId),
    destination: String(args.destinationId),
    weight: String(args.weightGram),
    courier: args.couriers,
    price: "lowest",
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch("https://rajaongkir.komerce.id/api/v1/calculate/district/domestic-cost", {
      method: "POST",
      headers: { key: apiKey, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
      signal: controller.signal,
      cache: "no-store",
    });
    if (response.status === 401 || response.status === 403) {
      throw new ShippingRateError("Shipping Cost API key ditolak RajaOngkir.", 503);
    }
    if (response.status === 429) throw new ShippingRateError("Kuota/rate limit RajaOngkir tercapai. Coba lagi nanti.", 429);
    if (!response.ok) throw new ShippingRateError("RajaOngkir gagal menghitung ongkir untuk rute ini.");
    const parsed = providerResponse.safeParse(await response.json());
    if (!parsed.success || parsed.data.meta?.status === "error" ||
        (parsed.data.meta?.code && parsed.data.meta.code !== 200)) {
      throw new ShippingRateError("Format respons ongkir RajaOngkir tidak sesuai.");
    }
    const rates: RajaOngkirRate[] = parsed.data.data.flatMap(entry => {
      if (!entry.code || !entry.service || !entry.name || entry.cost > 100_000_000) return [];
      return [{
        courier: entry.name,
        courierCode: entry.code,
        service: entry.service,
        description: entry.description || "",
        cost: entry.cost,
        estimate: entry.etd === null || entry.etd === undefined ? null : String(entry.etd),
      }];
    }).sort((a, b) => a.cost - b.cost).slice(0, 80);

    // Keep estimates short-lived and only cache success, not provider errors.
    if (cache.size > 400) {
      for (const [entryKey, row] of cache) if (row.expires <= now) cache.delete(entryKey);
      if (cache.size > 400) cache.clear();
    }
    cache.set(key, { expires: now + TTL_MS, data: rates });
    return rates;
  } catch (error) {
    if (error instanceof ShippingRateError) throw error;
    throw new ShippingRateError("Tidak dapat terhubung ke layanan cek ongkir.");
  } finally {
    clearTimeout(timeout);
  }
}
