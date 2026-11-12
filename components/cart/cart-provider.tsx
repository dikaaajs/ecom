"use client";
import { toast } from "@/lib/notify";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CART_STORAGE_KEY, normalizeCart, type CartItem } from "@/lib/cart";
type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  count: number;
  addItem: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setItems(normalizeCart(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]"))); } catch { setItems([]); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)); }
      catch { toast.warning("Keranjang belum dapat disimpan di perangkat. Jangan tutup halaman sebelum selesai berbelanja.", { id: "cart-storage" }); }
    }
  }, [items, ready]);
  const addItem = useCallback((productId: string, quantity = 1) => {
    setItems(old => normalizeCart([...old, { productId, quantity }]));
    toast.success("Produk ditambahkan ke keranjang.", { id: "cart-action" });
  }, []);
  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems(old => normalizeCart(old.filter(item => item.productId !== productId).concat(quantity > 0 ? [{ productId, quantity }] : [])));
    toast.info("Jumlah produk di keranjang diperbarui.", { id: "cart-action" });
  }, []);
  const removeItem = useCallback((productId: string) => {
    setItems(old => old.filter(item => item.productId !== productId));
    toast.info("Produk dihapus dari keranjang.", { id: "cart-action" });
  }, []);
  const clearCart = useCallback(() => { setItems([]); toast.info("Keranjang dikosongkan.", { id: "cart-action" }); }, []);
  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  return <CartContext.Provider value={{ items, ready, count, addItem, setQuantity, removeItem, clearCart }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
