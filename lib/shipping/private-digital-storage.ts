import { createClient } from "@supabase/supabase-js";

/** Service credentials never enter a client bundle or public API response. */
export function getPrivateDigitalStorage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_DIGITAL_BUCKET || "digital-products";
  if (!url || !serviceKey) throw new Error("Supabase server storage is not configured");
  if (!/^[a-zA-Z0-9_-]{3,64}$/.test(bucket)) throw new Error("Invalid private bucket name");
  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { client, bucket };
}

/** Fail closed if a merchant accidentally exposes the bucket publicly. */
export async function requirePrivateBucket() {
  const storage = getPrivateDigitalStorage();
  const { data, error } = await storage.client.storage.getBucket(storage.bucket);
  if (error || !data) throw new Error("Private digital bucket does not exist or is inaccessible");
  if (data.public !== false) throw new Error("Digital bucket must be PRIVATE before uploading");
  return storage;
}

const allowed: Record<string, { mime: string; signature: (bytes: Uint8Array) => boolean }> = {
  pdf: {
    mime: "application/pdf",
    signature: b => b[0]===37 && b[1]===80 && b[2]===68 && b[3]===70 && b[4]===45,
  },
  zip: {
    mime: "application/zip",
    signature: b => b[0]===80 && b[1]===75 &&
      ((b[2]===3 && b[3]===4) || (b[2]===5 && b[3]===6)),
  },
  png: {
    mime: "image/png",
    signature: b => b[0]===137 && b[1]===80 && b[2]===78 && b[3]===71 && b[4]===13 && b[5]===10 && b[6]===26 && b[7]===10,
  },
  jpg: {
    mime: "image/jpeg",
    signature: b => b[0]===255 && b[1]===216 && b[2]===255,
  },
  jpeg: {
    mime: "image/jpeg",
    signature: b => b[0]===255 && b[1]===216 && b[2]===255,
  },
  webp: {
    mime: "image/webp",
    signature: b => b[0]===82 && b[1]===73 && b[2]===70 && b[3]===70 &&
      b[8]===87 && b[9]===69 && b[10]===66 && b[11]===80,
  },
};

export const MAX_DIGITAL_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Validate allowed file signature, not browser-provided MIME only. */
export function validateDigitalUpload(file: File, bytes: Uint8Array) {
  const fileName = file.name.split(/[\\/]/).pop()?.trim() || "";
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const type = allowed[ext];
  if (!fileName || fileName.length > 120 || !type) throw new Error("File harus PDF, ZIP, PNG, JPG, atau WEBP (maks. 120 karakter).");
  if (file.size < 8 || file.size > MAX_DIGITAL_UPLOAD_BYTES || bytes.length !== file.size) {
    throw new Error("Ukuran file harus antara 8 byte dan 4 MB.");
  }
  if (!type.signature(bytes)) throw new Error("Isi file tidak cocok dengan format ekstensinya.");
  return { fileName, extension: ext, contentType: type.mime };
}
