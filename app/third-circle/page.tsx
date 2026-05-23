"use client";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { EditorialHub } from "@/src/components/EditorialHub";
import { PostDetail } from "@/src/components/PostDetail";
import { SiteFooter } from "@/src/components/SiteFooter";
import { MorphingHeader } from "@/src/components/MorphingHeader";
import { useCart } from "@/src/context/CartContext";
import { useCartPanel } from "@/src/context/CartPanelContext";
import { hrefForNavTarget } from "@/src/lib/navigation";

type FilterType = "all" | "flash-sale" | "cafe-news" | "brand-story" | "champion";
const VALID_FILTERS: FilterType[] = ["all", "flash-sale", "cafe-news", "brand-story", "champion"];

function ThirdCircleContent() {
  const router = useRouter();
  const { cartCount } = useCart();
  const { openCart } = useCartPanel();
  const searchParams = useSearchParams();

  const postId = searchParams.get("postId");
  const filterParam = searchParams.get("filter") as FilterType | null;
  const filter: FilterType = filterParam && VALID_FILTERS.includes(filterParam) ? filterParam : "all";

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
      <motion.div
        className="flex-1 pt-20"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {postId ? (
          <PostDetail
            postId={postId}
            onBack={() => router.push("/third-circle/")}
            onProductClick={(id) => router.push(`/products/${id}`)}
          />
        ) : (
          <EditorialHub
            filter={filter}
            onProductClick={(id) => router.push(`/products/${id}`)}
            onPostOpen={(id) => router.push(`/third-circle/?postId=${id}`)}
          />
        )}
      </motion.div>
      <SiteFooter onNavigate={(t) => router.push(hrefForNavTarget(t))} />
    </div>
  );
}

export default function ThirdCircleRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-natural-bg" />}>
      <ThirdCircleContent />
    </Suspense>
  );
}