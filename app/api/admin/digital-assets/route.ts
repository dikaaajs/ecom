import { randomUUID } from "node:crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  MAX_DIGITAL_UPLOAD_BYTES, requirePrivateBucket, validateDigitalUpload,
} from "@/lib/shipping/private-digital-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "admin";
}
const errorResponse = (error: string, status: number) =>
  NextResponse.json({ error }, { status, headers });

export async function GET() {
  if (!(await isAdmin())) return errorResponse("Forbidden", 403);
  try {
    const products = await prisma.product.findMany({
      where: { type: "DIGITAL" },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true, title: true, slug: true, isPublished: true,
        digitalAsset: { select: { id: true, fileName: true, contentType: true, updatedAt: true } },
      },
    });
    return NextResponse.json({ products }, { headers });
  } catch (error) {
    console.error("Unable to list admin digital products", error);
    return errorResponse("Gagal memuat produk digital.", 500);
  }
}

/**
 * Small-file upload only (Vercel function request limit is 4.5 MB).
 * No unsigned URLs, object paths or service-role secrets returned to the client.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) return errorResponse("Forbidden", 403);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return errorResponse("Forbidden origin", 403);
  const length = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(length) && length > MAX_DIGITAL_UPLOAD_BYTES + 65536) {
    return errorResponse("File terlalu besar. Maksimum 4 MB.", 413);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    return errorResponse("Gunakan multipart/form-data.", 415);
  }

  let productId: string;
  let file: File;
  try {
    const form = await request.formData();
    const candidate = form.get("productId");
    const incoming = form.get("file");
    const result = z.string().min(1).max(128).safeParse(candidate);
    if (!result.success || !(incoming instanceof File)) return errorResponse("Pilih produk dan file.", 400);
    productId = result.data;
    file = incoming;
  } catch {
    return errorResponse("Form unggahan tidak valid.", 400);
  }
  if (file.size > MAX_DIGITAL_UPLOAD_BYTES) return errorResponse("Maksimum file adalah 4 MB.", 413);

  let storageObject: { bucket: string; path: string } | null = null;
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, type: true, digitalAsset: { select: { bucket: true, objectPath: true } } },
    });
    if (!product || product.type !== "DIGITAL") return errorResponse("Produk digital tidak ditemukan.", 404);

    // Replacements could break already-paid buyer entitlements. Block until
    // versioned digital assets and ownership-based fulfillment are implemented.
    const paidItems = await prisma.orderItem.count({
      where: { productId, order: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] } } },
    });
    if (paidItems > 0) return errorResponse("Produk sudah memiliki pesanan terbayar. Versi file harus dikelola terpisah.", 409);

    const { client, bucket } = await requirePrivateBucket();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const valid = validateDigitalUpload(file, bytes);
    const path = `products/${productId}/${randomUUID()}.${valid.extension}`;
    const upload = await client.storage.from(bucket).upload(path, bytes, {
      contentType: valid.contentType,
      cacheControl: "3600",
      upsert: false,
    });
    if (upload.error) throw new Error("Private storage upload failed: " + upload.error.message);
    storageObject = { bucket, path };

    try {
      await prisma.digitalAsset.upsert({
        where: { productId },
        create: {
          productId, bucket, objectPath: path,
          fileName: valid.fileName, contentType: valid.contentType,
        },
        update: {
          bucket, objectPath: path, fileName: valid.fileName, contentType: valid.contentType,
        },
      });
    } catch (dbError) {
      await client.storage.from(bucket).remove([path]);
      storageObject = null;
      throw dbError;
    }

    // Delete the replaced object only after the metadata has been saved.
    // If removal fails, log for operator cleanup; never delete the new object.
    if (product.digitalAsset && product.digitalAsset.objectPath !== path) {
      const old = product.digitalAsset;
      if (old.bucket === bucket) {
        const cleanup = await client.storage.from(bucket).remove([old.objectPath]);
        if (cleanup.error) console.error("Old digital object needs cleanup for product", productId);
      }
    }
    storageObject = null;
    return NextResponse.json({ success: true, message: "File tersimpan di bucket private.", fileName: valid.fileName }, { headers });
  } catch (error) {
    if (storageObject) {
      try {
        const { client } = await requirePrivateBucket();
        await client.storage.from(storageObject.bucket).remove([storageObject.path]);
      } catch { console.error("Digital upload cleanup required", productId); }
    }
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("File ") || message.startsWith("Isi file") || message.startsWith("Ukuran file")) {
      return errorResponse(message, 400);
    }
    console.error("Admin digital upload failed", error);
    return errorResponse("Tidak dapat mengunggah file. Pastikan Supabase bucket private dan kredensial server tersedia.", 500);
  }
}
