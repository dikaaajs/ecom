import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchShippingRegions, ShippingRegionError } from "@/lib/shipping/regions";

export const dynamic = "force-dynamic";

// Best-effort local request guard. Distributed rate limits needed for larger deployments.
const requests = new Map<string, { count: number; expires: number }>();
const WINDOW = 60_000;
const MAX_REQUESTS = 40;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = z.object({
    level: z.enum(["province", "city", "district"]),
    parentId: z.coerce.number().int().positive().max(10000000).optional(),
  }).strict().safeParse(Object.fromEntries(params.entries()));
  if (!parsed.success || (parsed.data.level !== "province" && !parsed.data.parentId) ||
      (parsed.data.level === "province" && parsed.data.parentId !== undefined)) {
    return NextResponse.json({ error: "Parameter wilayah tidak valid." }, { status: 400 });
  }
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const old = requests.get(key);
  const entry = old && old.expires > now ? { count: old.count + 1, expires: old.expires } : { count: 1, expires: now + WINDOW };
  requests.set(key, entry);
  if (requests.size > 1500) {
    for (const [ip, row] of requests) if (row.expires < now) requests.delete(ip);
    if (requests.size > 1500) requests.clear();
  }
  if (entry.count > MAX_REQUESTS) return NextResponse.json(
    { error: "Terlalu banyak permintaan. Coba lagi sebentar." }, { status: 429, headers: { "Cache-Control": "no-store" } },
  );
  try {
    const data = await fetchShippingRegions(parsed.data.level, parsed.data.parentId);
    return NextResponse.json({ data }, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    if (error instanceof ShippingRegionError) return NextResponse.json(
      { error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
    console.error("Shipping region lookup failed", error);
    return NextResponse.json({ error: "Gagal memuat wilayah." }, { status: 502 });
  }
}
