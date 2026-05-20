"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export interface Discount {
  code: string;
  discountType: "percent" | "flat";
  amount: number;
  claimedAt?: string;
}

interface DiscountContextValue {
  activeDiscount: Discount | null;
  setActiveDiscount(d: Discount | null): void;
  clearDiscount(): void;
  computeDiscountedSubtotal(subtotal: number): number;
}

const DiscountContext = createContext<DiscountContextValue | null>(null);

export function DiscountProvider({ children }: { children: ReactNode }) {
  const [activeDiscount, setActiveDiscountState] = useState<Discount | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("twc_active_discount");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.code) setActiveDiscountState(parsed as Discount);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setActiveDiscount = useCallback((d: Discount | null) => {
    setActiveDiscountState(d);
    try {
      if (d) {
        localStorage.setItem("twc_active_discount", JSON.stringify(d));
      } else {
        localStorage.removeItem("twc_active_discount");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const clearDiscount = useCallback(() => {
    setActiveDiscountState(null);
    try {
      localStorage.removeItem("twc_active_discount");
    } catch {
      /* ignore */
    }
  }, []);

  const computeDiscountedSubtotal = useCallback(
    (subtotal: number): number => {
      if (!activeDiscount) return subtotal;
      if (activeDiscount.discountType === "flat") {
        return Math.max(0, subtotal - activeDiscount.amount);
      }
      // percent
      return Math.max(0, subtotal * (1 - activeDiscount.amount / 100));
    },
    [activeDiscount]
  );

  return (
    <DiscountContext.Provider
      value={{ activeDiscount, setActiveDiscount, clearDiscount, computeDiscountedSubtotal }}
    >
      {children}
    </DiscountContext.Provider>
  );
}

export function useDiscount(): DiscountContextValue {
  const ctx = useContext(DiscountContext);
  if (!ctx) throw new Error("useDiscount must be used within DiscountProvider");
  return ctx;
}
