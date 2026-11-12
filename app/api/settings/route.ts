import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { siteSettingsSchema } from "@/lib/site-settings";
import { readSiteSettings } from "@/lib/site-settings-server";
import { hasSameOrigin } from "@/lib/request-origin";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
export async function GET() {
  try { return NextResponse.json({ success: true, data: await readSiteSettings() }, { headers }); }
  catch { return NextResponse.json({ error: "Pengaturan tidak dapat dimuat." }, { status: 503, headers }); }
}
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  if (!hasSameOrigin(req)) return NextResponse.json({ error: "Forbidden origin" }, { status: 403, headers });
  if (!req.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "JSON required" }, { status: 415, headers });
  try {
    const raw = await req.text();
    if (raw.length > 60000) return NextResponse.json({ error: "Data terlalu besar." }, { status: 413, headers });
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "JSON tidak valid." }, { status: 400, headers }); }
    const parsed = siteSettingsSchema.partial().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Periksa kembali pengaturan.", issues: parsed.error.flatten() }, { status: 400, headers });
    await prisma.$transaction(Object.entries(parsed.data).map(([key, value]) => prisma.siteSetting.upsert({
      where: { key }, update: { value: JSON.stringify(value) }, create: { key, value: JSON.stringify(value) },
    })));
    return NextResponse.json({ success: true }, { headers });
  } catch { return NextResponse.json({ error: "Pengaturan gagal disimpan. Coba lagi." }, { status: 503, headers }); }
}
