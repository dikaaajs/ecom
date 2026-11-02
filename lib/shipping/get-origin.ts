import { prisma } from "@/lib/prisma";
import {
  savedShippingOriginSchema,
  SHIPPING_ORIGIN_SETTING_KEY,
  type SavedShippingOrigin,
} from "@/lib/shipping/origin";

/** Returns the merchant-defined origin, not an environment-configured address. */
export async function getSavedShippingOrigin(): Promise<SavedShippingOrigin | null> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: SHIPPING_ORIGIN_SETTING_KEY },
    select: { value: true },
  });
  if (!setting) return null;
  const parsed = savedShippingOriginSchema.safeParse(JSON.parse(setting.value));
  if (!parsed.success) throw new Error("Stored shipping origin is invalid");
  return parsed.data;
}
