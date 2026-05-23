"use client";
import { useRouter } from "next/navigation";
import { ProductPage } from "@/src/components/ProductPage";
import { SiteFooter } from "@/src/components/SiteFooter";
import { SmoothScroll } from "@/src/components/SmoothScroll";
import { useCart } from "@/src/context/CartContext";
import { useCartPanel } from "@/src/context/CartPanelContext";
import { hrefForNavTarget } from "@/src/lib/navigation";

export function ProductClient({ slug }: { slug: string }) {
  const router = useRouter();
  const { addToCart, cartCount } = useCart();
  const { openCart } = useCartPanel();

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col">
        <div className="flex-1">
          <ProductPage
            productId={slug}
            onAddToCart={(productId, qty) => { addToCart(productId, qty); openCart(); }}
            onOpenCart={openCart}
            cartCount={cartCount}
            onBack={() => router.back()}
          />
        </div>
        <SiteFooter onNavigate={(t) => router.push(hrefForNavTarget(t))} />
      </div>
    </SmoothScroll>
  );
}
