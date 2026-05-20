"use client";
import { useRouter } from "next/navigation";
import { ShopPage } from "@/src/components/ShopPage";
import { SiteFooter } from "@/src/components/SiteFooter";
import { useCart } from "@/src/context/CartContext";
import { useCartPanel } from "@/src/context/CartPanelContext";
import { useToast } from "@/src/context/ToastContext";

export default function ShopRoute() {
  const router = useRouter();
  const { cart, addToCart } = useCart();
  const { openCart } = useCartPanel();
  const { showToast } = useToast();

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col">
      <div className="flex-1">
        <ShopPage
          cart={cart}
          onAddToCart={(productId) => { addToCart(productId); showToast("Added to cart"); }}
          onProductClick={(slug) => router.push(`/products/${slug}`)}
          onGoToCart={openCart}
        />
      </div>
      <SiteFooter onNavigate={(t) => router.push(t === "home" ? "/" : `/${t}`)} />
    </div>
  );
}
