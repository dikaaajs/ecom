import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  savedShippingOriginSchema,
  shippingOriginSchema,
  SHIPPING_ORIGIN_SETTING_KEY,
} from "@/lib/shipping/origin";
import { getSavedShippingOrigin } from "@/lib/shipping/get-origin";

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
    const data = await getSavedShippingOrigin();
    return NextResponse.json({ data }, { headers: privateHeaders });
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
  const parsed = shippingOriginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({
      error: "Periksa kembali data alamat dan titik pin",
      issues: parsed.error.flatten().fieldErrors,
    }, { status: 400 });
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
