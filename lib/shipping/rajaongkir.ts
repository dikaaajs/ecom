import { z } from "zod";

/**
 * Server-only adapter for RajaOngkir/Komerce Shipping Cost API.
 * Never import into a client component. Keep the key in server environment variables.
 * No fallback price: provider failures must block rate selection.
 */
const rawRate = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  service: z.string().optional(),
  description: z.string().optional(),
  cost: z.number().nonnegative().optional(),
  etd: z.string().optional(),
}).passthrough();

export type RajaOngkirRate = {
  courier: string;
  service: string;
  description: string;
  cost: number;
  estimate: string | null;
};

export async function getRajaOngkirRates(args: {
  originId: number; destinationId: number; weightGram: number; couriers: string;
}): Promise<RajaOngkirRate[]> {
  const apiKey = process.env.RAJAONGKIR_API_KEY;
  if (!apiKey) throw new Error("Shipping provider not configured");
  if (!Number.isSafeInteger(args.originId) || args.originId < 1 ||
      !Number.isSafeInteger(args.destinationId) || args.destinationId < 1 ||
      !Number.isSafeInteger(args.weightGram) || args.weightGram < 1 ||
      !/^[a-z]+(?::[a-z]+)*$/.test(args.couriers)) {
    throw new Error("Invalid shipping rate parameters");
  }
  const body = new URLSearchParams({
    origin: String(args.originId),
    destination: String(args.destinationId),
    weight: String(args.weightGram),
    courier: args.couriers,
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch("https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost", {
      method: "POST",
      headers: { key: apiKey, "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Shipping provider failed: " + response.status);
    const payload: unknown = await response.json();
    // Provider shapes can change; reject unfamiliar formats instead of silently quoting 0.
    if (!payload || typeof payload !== "object" || !("data" in payload) ||
        !Array.isArray((payload as { data: unknown }).data)) {
      throw new Error("Unexpected shipping provider response");
    }
    const result: RajaOngkirRate[] = [];
    for (const entry of (payload as { data: unknown[] }).data) {
      const parsed = rawRate.safeParse(entry);
      if (!parsed.success || typeof parsed.data.cost !== "number") continue;
      result.push({
        courier: parsed.data.name || parsed.data.code || "",
        service: parsed.data.service || "",
        description: parsed.data.description || "",
        cost: parsed.data.cost,
        estimate: parsed.data.etd || null,
      });
    }
    return result;
  } finally {
    clearTimeout(timeout);
  }
}
