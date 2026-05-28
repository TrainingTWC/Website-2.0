"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { CartItem } from "../components/CartPanel";
import { capture } from "../lib/posthog";
import { track } from "../lib/analytics";

interface CartWarning {
  productId: string;
  status: "out-of-stock" | "insufficient-stock" | "exceeds-moq" | "removed";
  effectiveMOQ?: number;
  remainingQty?: number | null;
}

interface CartContextValue {
  cart: CartItem[];
  addToCart(productId: string, qty?: number): void;
  removeFromCart(productId: string): void;
  updateQty(productId: string, delta: number): void;
  clearCart(): void;
  cartCount: number;
  getMOQ(productId: string): number;
  cartWarnings: CartWarning[];
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

  // ── Live MOQ + stock validation from server ────────────────────────────────
  // price: 0 here — we care about MOQ/stock status, not price-change detection.
  // Price reconciliation is done server-side in submitOrder.
  const validateItems = cart.map((c) => ({ productId: c.productId, qty: c.qty, price: 0 }));
  const validationResults = useQuery(
    api.inventory.cartValidate,
    cart.length > 0 ? { items: validateItems } : "skip"
  );

  const moqMap = useMemo(() => {
    const map = new Map<string, number>();
    if (validationResults) {
      for (const r of validationResults) {
        map.set(r.productId, r.effectiveMOQ);
      }
    }
    return map;
  }, [validationResults]);

  const cartWarnings: CartWarning[] = useMemo(() => {
    if (!validationResults) return [];
    return validationResults
      .filter(
        (r) =>
          r.status === "out-of-stock" ||
          r.status === "insufficient-stock" ||
          r.status === "exceeds-moq" ||
          r.status === "removed"
      )
      .map((r) => ({
        productId: r.productId,
        status: r.status as CartWarning["status"],
        effectiveMOQ: r.effectiveMOQ,
        remainingQty: r.remainingQty,
      }));
  }, [validationResults]);

  const getMOQ = useCallback(
    (productId: string): number => {
      return moqMap.get(productId) ?? 10; // 10 = default while loading or no tracking
    },
    [moqMap]
  );

  // ── Cart mutations (MOQ-aware) ─────────────────────────────────────────────
  const addToCart = useCallback(
    (productId: string, qty = 1) => {
      capture("add_to_cart", { product_id: productId, qty });
      track("cart_item_added", { productId, qty }, { stage: 3 });
      setCart((prev) => {
        const maxQty = moqMap.get(productId) ?? 10;
        const idx = prev.findIndex((c) => c.productId === productId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], qty: Math.min(next[idx].qty + qty, maxQty) };
          return next;
        }
        return [...prev, { productId, qty: Math.min(qty, maxQty) }];
      });
    },
    [moqMap]
  );

  const removeFromCart = useCallback((productId: string) => {
    track("cart_item_removed", { productId }, { stage: 3 });
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }, []);

  const updateQty = useCallback(
    (productId: string, delta: number) => {
      track("cart_item_quantity_changed", { productId, delta }, { stage: 3 });
      setCart((prev) =>
        prev.map((c) => {
          if (c.productId !== productId) return c;
          const maxQty = moqMap.get(productId) ?? 10;
          const newQty = Math.max(1, Math.min(c.qty + delta, maxQty));
          return { ...c, qty: newQty };
        })
      );
    },
    [moqMap]
  );

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
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        cartCount,
        getMOQ,
        cartWarnings,
      }}
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
