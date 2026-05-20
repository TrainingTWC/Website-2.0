"use client";
import { useRouter } from "next/navigation";
import { PostDetail } from "@/src/components/PostDetail";
import { SiteFooter } from "@/src/components/SiteFooter";
import { MorphingHeader } from "@/src/components/MorphingHeader";
import { useCart } from "@/src/context/CartContext";
import { useCartPanel } from "@/src/context/CartPanelContext";
import { hrefForNavTarget } from "@/src/lib/navigation";

export function PostDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { cartCount } = useCart();
  const { openCart } = useCartPanel();

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col">
      <MorphingHeader
        headerBg="rgba(250,249,246,1)"
        headerBorder="rgba(201,192,183,0.5)"
        headerShadow="0 2px 12px -4px rgba(44,24,16,0.10)"
        onOpenTI={(e) => { e.stopPropagation(); router.push("/ti"); }}
        onOpenCart={openCart}
        onNavTo={(t) => router.push(hrefForNavTarget(t))}
        cartCount={cartCount}
        activeOverride="editorial"
      />
      <div className="flex-1 pt-20">
        <PostDetail
          postId={id}
          onBack={() => router.push("/journal")}
          onProductClick={(productId) => router.push(`/products/${productId}`)}
        />
      </div>
      <SiteFooter onNavigate={(t) => router.push(hrefForNavTarget(t))} />
    </div>
  );
}
