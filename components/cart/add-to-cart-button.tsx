"use client";
import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
export function AddToCartButton({ id, disabled = false }: { id: string; disabled?: boolean }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  return (
    <button type="button" disabled={disabled} onClick={() => { addItem(id); setAdded(true); window.setTimeout(() => setAdded(false), 1800); }}
      className="storefront-btn-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 font-bold disabled:opacity-50">
      {added ? <Check size={18} /> : <ShoppingCart size={18} />}
      {disabled ? "Out of stock" : added ? "Added to cart" : "Add to cart"}
    </button>
  );
}
