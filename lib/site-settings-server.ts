import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { decodeSiteSettings, defaultSiteSettings } from "./site-settings";
export const readSiteSettings = cache(async () => decodeSiteSettings(await prisma.siteSetting.findMany({
  where: { key: { in: Object.keys(defaultSiteSettings) } },
})));
export async function storefrontSettings() {
  try { return await readSiteSettings(); } catch { return defaultSiteSettings; }
}
