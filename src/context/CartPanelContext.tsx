"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { CartPanel } from "../components/CartPanel";
import { useCart } from "./CartContext";
import { useDiscount } from "./DiscountContext";
import { useProducts } from "../lib/useProducts";

interface CartPanelContextValue {
  cartOpen: boolean;
  openCart(): void;
  closeCart(): void;
}

const CartPanelContext = createContext<CartPanelContextValue | null>(null);

export function CartPanelProvider({ children }: { children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const router = useRouter();

  const { cart, removeFromCart, updateQty } = useCart();
  const { activeDiscount, clearDiscount, computeDiscountedSubtotal } = useDiscount();
  const products = useProducts();

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const handleCheckout = useCallback(() => {
    setCartOpen(false);
    router.push("/?page=checkout");
  }, [router]);

  const subtotal = useMemo(() => {
    return (products ?? []).reduce((s, p) => {
      const item = cart.find((c) => c.productId === p._id);
      return item ? s + p.price * item.qty : s;
    }, 0);
  }, [products, cart]);

  const discountedSubtotal = activeDiscount
    ? computeDiscountedSubtotal(subtotal)
    : undefined;

  return (
    <CartPanelContext.Provider value={{ cartOpen, openCart, closeCart }}>
      {children}
      <CartPanel
        open={cartOpen}
        onClose={closeCart}
        cart={cart}
        products={products ?? []}
        onRemove={removeFromCart}
        onUpdateQty={updateQty}
        onCheckout={handleCheckout}
        activeDiscount={activeDiscount}
        clearDiscount={clearDiscount}
        discountedSubtotal={discountedSubtotal}
      />
    </CartPanelContext.Provider>
  );
}

export function useCartPanel(): CartPanelContextValue {
  const ctx = useContext(CartPanelContext);
  if (!ctx) throw new Error("useCartPanel must be used within CartPanelProvider");
  return ctx;
}
