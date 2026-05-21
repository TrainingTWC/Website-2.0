"use client";
import { useMemo } from "react";
import { ShoppingCart, Star } from "lucide-react";
import { SmartImage } from "./SmartImage";
import type { Product } from "../types";

/**
 * Flat low-tier alternative to {@link BestsellerCarousel3D}.
 *
 * Horizontal scroll-snap strip — no 3D, no transforms, no rAF.
 * Used when `usePerfMode().tier === "low"` (or reduced motion) so weak
 * devices still get a usable bestseller view without paying for
 * R3F + drei + Three.js.
 *
 * Keyboard: ← / → arrows scroll the strip by one card.
 */

interface CarouselProps {
  products: Product[];
  onSelect: (productId: string) => void;
  onAddToCart: (productName: string) => void;
}

const CARD_W = 240; // px

export function BestsellerCarouselFlat({ products, onSelect, onAddToCart }: CarouselProps) {
  const top = useMemo(
    () =>
      [...products]
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 8),
    [products],
  );

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      el.scrollBy({ left: CARD_W, behavior: "smooth" });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      el.scrollBy({ left: -CARD_W, behavior: "smooth" });
    }
  };

  return (
    <div
      role="region"
      aria-label="Bestseller coffees"
      tabIndex={0}
      onKeyDown={onKey}
      className="w-full flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 px-4 outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-xl"
      style={{ scrollbarWidth: "thin" }}
    >
      {top.map((p) => (
        <article
          key={p._id}
          className="snap-start shrink-0 w-[240px] rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden flex flex-col"
        >
          <button
            type="button"
            onClick={() => onSelect(p._id)}
            className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label={`View ${p.name}`}
          >
            <div className="relative w-full" style={{ aspectRatio: "4 / 5" }}>
              <SmartImage
                src={p.imageUrl}
                blur={p.imageBlur}
                alt={p.name}
                className="object-cover object-center"
                wrapperClassName="w-full h-full"
                sizes="240px"
              />
            </div>
            <div className="p-4 space-y-1">
              <h3 className="text-base font-semibold text-white truncate">{p.name}</h3>
              {p.rating != null && (
                <div className="flex items-center gap-1 text-amber-300 text-xs">
                  <Star size={12} fill="currentColor" />
                  <span>{p.rating.toFixed(1)}</span>
                  {p.reviewCount != null && (
                    <span className="text-white/50">({p.reviewCount})</span>
                  )}
                </div>
              )}
              <div className="text-white/90 text-sm">${p.price.toFixed(2)}</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onAddToCart(p.name)}
            className="mx-4 mb-4 inline-flex items-center justify-center gap-2 rounded-full bg-white text-black text-sm font-medium px-4 py-2 hover:bg-white/90 transition"
          >
            <ShoppingCart size={14} />
            Add to cart
          </button>
        </article>
      ))}
    </div>
  );
}
