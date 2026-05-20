"use client";
import { useRouter } from "next/navigation";
import { ProductPage } from "@/src/components/ProductPage";
import { SiteFooter } from "@/src/components/SiteFooter";
import { useCart } from "@/src/context/CartContext";
import { useCartPanel } from "@/src/context/CartPanelContext";

export function ProductClient({ slug }: { slug: string }) {
  const router = useRouter();
  const { addToCart, cartCount } = useCart();
  const { openCart } = useCartPanel();

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col">
      <div className="flex-1">
        <ProductPage
          productId={slug}
          onAddToCart={(productId, qty) => { addToCart(productId, qty); openCart(); }}
          onOpenCart={openCart}
          cartCount={cartCount}
        />
      </div>
      <SiteFooter onNavigate={(t) => router.push(t === "home" ? "/" : `/${t}`)} />
    </div>
  );
}
