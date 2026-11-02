"use client";
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
    if (ready) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);
  const addItem = useCallback((productId: string, quantity = 1) => {
    setItems(old => normalizeCart([...old, { productId, quantity }]));
  }, []);
  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems(old => normalizeCart(old.filter(item => item.productId !== productId).concat(quantity > 0 ? [{ productId, quantity }] : [])));
  }, []);
  const removeItem = useCallback((productId: string) => {
    setItems(old => old.filter(item => item.productId !== productId));
  }, []);
  const clearCart = useCallback(() => setItems([]), []);
  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  return <CartContext.Provider value={{ items, ready, count, addItem, setQuantity, removeItem, clearCart }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
