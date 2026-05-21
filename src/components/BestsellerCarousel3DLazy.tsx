"use client";
import dynamic from "next/dynamic";
import { usePerfMode } from "@/src/context/PerfModeContext";
import type { Product } from "../types";

const BestsellerCarousel3DInner = dynamic(
  () =>
    import("./BestsellerCarousel3D").then((m) => ({
      default: m.BestsellerCarousel3D,
    })),
  { ssr: false }
);

const BestsellerCarouselFlatInner = dynamic(
  () =>
    import("./BestsellerCarouselFlat").then((m) => ({
      default: m.BestsellerCarouselFlat,
    })),
  { ssr: false }
);

interface Props {
  products: Product[];
  onSelect: (productId: string) => void;
  onAddToCart: (productName: string) => void;
}

/**
 * Tier-routed bestseller carousel.
 *  - low / reduced-motion → flat scroll-snap strip (no 3D bundle).
 *  - mid / high          → full 3D ring carousel.
 */
export function BestsellerCarousel3D(props: Props) {
  const { tier, reducedMotion } = usePerfMode();
  if (tier === "low" || reducedMotion) {
    return <BestsellerCarouselFlatInner {...props} />;
  }
  return <BestsellerCarousel3DInner {...props} />;
}
