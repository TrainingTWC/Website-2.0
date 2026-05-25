"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { CartItem } from "../components/CartPanel";
import { capture } from "../lib/posthog";
import { track } from "../lib/analytics";

interface CartContextValue {
  cart: CartItem[];
  addToCart(productId: string, qty?: number): void;
  removeFromCart(productId: string): void;
  updateQty(productId: string, delta: number): void;
  clearCart(): void;
  cartCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("twc_cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCart(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist every cart change to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("twc_cart", JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart]);

  const addToCart = useCallback((productId: string, qty = 1) => {
    capture("add_to_cart", { product_id: productId, qty });
    track("cart_item_added", { productId, qty }, { stage: 3 });
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.productId === productId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, { productId, qty }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    track("cart_item_removed", { productId }, { stage: 3 });
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }, []);

  const updateQty = useCallback((productId: string, delta: number) => {
    track("cart_item_quantity_changed", { productId, delta }, { stage: 3 });
    setCart((prev) =>
      prev.map((c) =>
        c.productId === productId ? { ...c, qty: Math.max(1, c.qty + delta) } : c
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    track("cart_emptied_manually", {}, { stage: 3 });
    setCart([]);
    try {
      localStorage.removeItem("twc_cart");
    } catch {
      /* ignore */
    }
  }, []);

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQty, clearCart, cartCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
