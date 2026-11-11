import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { AccountTokenPurpose } from "@prisma/client";

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export const createSecret = () => randomBytes(32).toString("hex");
const scopeHash = (value: string) => tokenHash(value.toLowerCase());

/** Atomic counters in Postgres survive concurrent requests and serverless instances. */
export async function permitAttempt(scope: string, value: string, maximum: number, minutes: number): Promise<boolean> {
  const key = scope + ":" + scopeHash(value || "unknown");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + minutes * 60_000);
  const row = await prisma.authRateLimit.upsert({
    where: { key },
    create: { key, count: 1, expiresAt },
    update: {
      count: { increment: 1 },
    },
  });
  if (row.expiresAt <= now) {
    const reset = await prisma.authRateLimit.updateMany({
      where: { key, expiresAt: { lte: now } },
      data: { count: 1, expiresAt },
    });
    if (reset.count) return true;
    const latest = await prisma.authRateLimit.findUnique({ where: { key }, select: { count: true } });
    return (latest?.count || maximum + 1) <= maximum;
  }
  return row.count <= maximum;
}

export function requestIp(req: { headers: Headers }) {
  // Only trust forwarded headers when configured through a trusted reverse proxy.
  return process.env.AUTH_TRUST_PROXY === "true"
    ? (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown").slice(0, 100)
    : "untrusted-client";
}

export async function issueAccountToken(accountId: string, purpose: AccountTokenPurpose) {
  const token = createSecret();
  const expiresAt = new Date(Date.now() + (purpose === "VERIFY_EMAIL" ? 24 * 60 : 30) * 60_000);
  await prisma.accountActionToken.create({
    data: { accountId, purpose, tokenHash: tokenHash(token), expiresAt },
  });
  return token;
}

export function accountLink(path: string, token: string): string {
  const base = process.env.ACCOUNT_APP_URL || process.env.NEXTAUTH_URL;
  if (!base) throw new Error("ACCOUNT_APP_URL is not configured");
  const url = new URL(base);
  if (url.protocol !== "https:" && !(url.hostname === "localhost" && url.protocol === "http:")) {
    throw new Error("Account links require HTTPS (localhost excepted)");
  }
  const link = new URL(path, url.origin);
  link.searchParams.set("token", token);
  return link.toString();
}

export async function sendAccountEmail(to: string, subject: string, message: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ACCOUNT_EMAIL_FROM;
  if (!key || !from) throw new Error("Transactional email provider is not configured");
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 10000);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        "User-Agent": "PixelPerfection/1.0",
      },
      body: JSON.stringify({ from, to: [to], subject, text: message }),
      cache: "no-store",
      signal: abort.signal,
    });
    if (!response.ok) throw new Error("Transactional email delivery failed");
  } finally {
    clearTimeout(timeout);
  }
}

/** Return generic outcomes for public email-request routes to avoid enumeration. */
export const genericEmailReply = {
  message: "Jika alamat email terdaftar, instruksi akan dikirim jika memenuhi syarat.",
};
