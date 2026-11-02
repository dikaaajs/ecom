export type CartItem = { productId: string; quantity: number };
export const CART_STORAGE_KEY = "ecom-cart-v1";
export function normalizeCart(input: unknown): CartItem[] {
  if (!Array.isArray(input)) return [];
  const result = new Map<string, number>();
  for (const entry of input) {
    if (!entry || typeof entry !== "object") continue;
    const { productId, quantity } = entry as Record<string, unknown>;
    if (typeof productId !== "string" || !productId || productId.length > 128) continue;
    if (!Number.isInteger(quantity) || (quantity as number) < 1) continue;
    result.set(productId, Math.min(99, (result.get(productId) || 0) + (quantity as number)));
    if (result.size >= 50) break;
  }
  return Array.from(result, ([productId, quantity]) => ({ productId, quantity }));
}
