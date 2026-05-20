"use client";
import { useRouter } from "next/navigation";
import { CheckoutPage } from "@/src/components/CheckoutPage";
import { SiteFooter } from "@/src/components/SiteFooter";
import { useCart } from "@/src/context/CartContext";
import { useCartPanel } from "@/src/context/CartPanelContext";
import { useToast } from "@/src/context/ToastContext";
import { useDiscount } from "@/src/context/DiscountContext";
import { useProducts } from "@/src/lib/useProducts";

export default function CheckoutRoute() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { openCart } = useCartPanel();
  const { showToast } = useToast();
  const { activeDiscount, clearDiscount, computeDiscountedSubtotal } = useDiscount();
  const products = useProducts();

  // Subtotal before discount — mirrors App.tsx lines 647-649
  const subtotal = (products ?? []).reduce((s, p) => {
    const it = cart.find((c) => c.productId === p._id);
    return it ? s + p.price * it.qty : s;
  }, 0);

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col">
      <div className="flex-1">
        <CheckoutPage
          cart={cart}
          products={products ?? []}
          onClose={() => { router.push("/"); openCart(); }}
          onOrderCreated={(orderId) => { clearCart(); router.push(`/orders?confirm=${orderId}`); }}
          activeDiscount={activeDiscount}
          clearDiscount={clearDiscount}
          discountedSubtotal={activeDiscount ? computeDiscountedSubtotal(subtotal) : undefined}
          onShowToast={showToast}
        />
      </div>
      <SiteFooter onNavigate={(t) => router.push(t === "home" ? "/" : `/${t}`)} />
    </div>
  );
}
