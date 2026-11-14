import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyRegionSelection, ShippingRegionError } from "@/lib/shipping/regions";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  savedShippingOriginSchema,
  legacyShippingOriginSchema,
  shippingOriginWithRegionsSchema,
  SHIPPING_ORIGIN_SETTING_KEY,
} from "@/lib/shipping/origin";

export const dynamic = "force-dynamic";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "admin";
}

const privateHeaders = { "Cache-Control": "private, no-store" };

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const stored = await prisma.siteSetting.findUnique({
      where: { key: SHIPPING_ORIGIN_SETTING_KEY }, select: { value: true },
    });
    if (!stored) return NextResponse.json({ data: null }, { headers: privateHeaders });
    const raw: unknown = JSON.parse(stored.value);
    const modern = savedShippingOriginSchema.safeParse(raw);
    if (modern.success) return NextResponse.json({ data: modern.data }, { headers: privateHeaders });
    const legacy = legacyShippingOriginSchema.extend({ updatedAt: z.string().datetime() }).safeParse(raw);
    if (!legacy.success) throw new Error("Stored shipping origin has an unexpected format");
    // Preserve existing address details, but require a fresh region selection.
    return NextResponse.json({ data: {
      ...legacy.data, provinceId: 0, cityId: 0, districtId: 0, requiresRegionSelection: true,
    } }, { headers: privateHeaders });
  } catch (error) {
    console.error("Shipping origin read failed", error);
    return NextResponse.json({ error: "Gagal memuat alamat pengirim" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "Expected application/json" }, { status: 415 });
  }
  let payload: unknown;
  try {
    const body = await request.text();
    if (body.length > 10_000) {
      return NextResponse.json({ error: "Data alamat terlalu besar" }, { status: 413 });
    }
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }
  const parsed = shippingOriginWithRegionsSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({
      error: "Periksa kembali data alamat dan titik pin",
      issues: parsed.error.flatten().fieldErrors,
    }, { status: 400 });
  }
  try {
    const verified = await verifyRegionSelection(parsed.data);
    if (!verified) return NextResponse.json({ error: "Wilayah tidak cocok dengan data RajaOngkir. Pilih ulang provinsi, kota, dan kecamatan." }, { status: 422 });
  } catch (error) {
    if (error instanceof ShippingRegionError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Shipping region verification failed", error);
    return NextResponse.json({ error: "Gagal memverifikasi wilayah pengiriman." }, { status: 503 });
  }
  const value = savedShippingOriginSchema.parse({
    ...parsed.data, updatedAt: new Date().toISOString(),
  });
  try {
    await prisma.siteSetting.upsert({
      where: { key: SHIPPING_ORIGIN_SETTING_KEY },
      create: { key: SHIPPING_ORIGIN_SETTING_KEY, value: JSON.stringify(value) },
      update: { value: JSON.stringify(value) },
    });
    return NextResponse.json({ data: value, message: "Alamat pengirim berhasil disimpan" }, { headers: privateHeaders });
  } catch (error) {
    console.error("Shipping origin save failed", error);
    return NextResponse.json({ error: "Gagal menyimpan alamat pengirim" }, { status: 500 });
  }
}
