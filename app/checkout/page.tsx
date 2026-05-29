"use client";
import { useRouter } from "next/navigation";
import { CheckoutPage } from "@/src/components/CheckoutPage";
import { SiteFooter } from "@/src/components/SiteFooter";
import { useCart } from "@/src/context/CartContext";
import { useCartPanel } from "@/src/context/CartPanelContext";
import { useToast } from "@/src/context/ToastContext";
import { useProducts } from "@/src/lib/useProducts";
import { hrefForNavTarget } from "@/src/lib/navigation";

export default function CheckoutRoute() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { openCart } = useCartPanel();
  const { showToast } = useToast();
  const products = useProducts();

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col">
      <div className="flex-1">
        <CheckoutPage
          cart={cart}
          products={products ?? []}
          onClose={() => { router.push("/"); openCart(); }}
          onOrderCreated={(orderId) => { clearCart(); router.push(`/orders?confirm=${orderId}`); }}
          onShowToast={showToast}
        />
      </div>
      <SiteFooter onNavigate={(t) => router.push(hrefForNavTarget(t))} />
    </div>
  );
}
