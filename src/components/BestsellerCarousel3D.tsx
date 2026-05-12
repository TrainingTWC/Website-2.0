import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useAnimationFrame,
  PanInfo,
} from "motion/react";
import { ShoppingCart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { SmartImage } from "./SmartImage";
import type { Product } from "../types";

/**
 * 3D bestseller carousel — the new hero centerpiece.
 *
 * - Renders the top-N products on a horizontal "ring" in 3D space.
 * - Drag horizontally OR scroll OR click side arrows to rotate.
 * - Active card sits dead-center, scaled up; siblings recede with
 *   depth + opacity falloff.
 * - Plays with momentum and spring physics so it feels alive.
 */

interface CarouselProps {
  products: Product[];
  onSelect: (productId: string) => void;
  onAddToCart: (productName: string) => void;
}

const RADIUS = 380; // px — how far cards orbit from the center
const AUTO_ROTATE_INTERVAL = 6000; // ms — idle auto-advance
const DRAG_SENSITIVITY = 0.4; // deg per px

export function BestsellerCarousel3D({ products, onSelect, onAddToCart }: CarouselProps) {
  const top5 = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const score = (p: Product) =>
          (p.reviewCount ?? 0) * 1 + (p.rating ?? 0) * 50;
        return score(b) - score(a);
      })
      .slice(0, 5);
  }, [products]);

  const count = top5.length;
  const stepAngle = count > 0 ? 360 / count : 0;

  // Rotation in degrees. Continuous (not wrapped) so animations feel smooth.
  const rotation = useMotionValue(0);
  const spring = useSpring(rotation, { stiffness: 90, damping: 22, mass: 0.9 });

  const containerRef = useRef<HTMLDivElement>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const [isDragging, setIsDragging] = useState(false);

  // Snap to nearest card after release
  const snapToNearest = () => {
    const current = rotation.get();
    const nearest = Math.round(current / stepAngle) * stepAngle;
    rotation.set(nearest);
    lastInteractionRef.current = Date.now();
  };

  // Idle auto-rotate when user hasn't interacted for AUTO_ROTATE_INTERVAL
  useAnimationFrame((_, delta) => {
    if (isDragging || count === 0) return;
    const idle = Date.now() - lastInteractionRef.current;
    if (idle < AUTO_ROTATE_INTERVAL) return;
    // gentle drift — 1 full rotation every ~80s
    rotation.set(rotation.get() - (delta / 1000) * (360 / 80));
  });

  // Snap whenever a slow drift crosses a step boundary on idle pause
  useEffect(() => {
    if (count === 0) return;
    const id = setInterval(() => {
      const idle = Date.now() - lastInteractionRef.current;
      if (idle > AUTO_ROTATE_INTERVAL + 1000 && !isDragging) {
        // every few seconds during idle drift, gently snap to nearest
        if (Math.abs(rotation.get() % stepAngle) < 1) return;
      }
    }, 2500);
    return () => clearInterval(id);
  }, [count, stepAngle, isDragging, rotation]);

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    rotation.set(rotation.get() + info.delta.x * DRAG_SENSITIVITY);
    lastInteractionRef.current = Date.now();
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // momentum
    rotation.set(rotation.get() + info.velocity.x * 0.12);
    setIsDragging(false);
    // small delay so spring resolves before snap
    setTimeout(snapToNearest, 250);
  };

  const stepBy = (dir: 1 | -1) => {
    rotation.set(rotation.get() - dir * stepAngle);
    lastInteractionRef.current = Date.now();
  };

  // Determine the "active" product index from current rotation
  const activeIdx = useTransform(spring, (r) => {
    if (count === 0) return 0;
    const normalized = ((-r % 360) + 360) % 360;
    return Math.round(normalized / stepAngle) % count;
  });
  const [activeIdxState, setActiveIdxState] = useState(0);
  useEffect(() => {
    const unsub = activeIdx.on("change", (v) => setActiveIdxState(v));
    return unsub;
  }, [activeIdx]);

  if (count === 0) return null;
  const active = top5[activeIdxState];

  return (
    <div className="relative w-full">
      {/* ── Top label ──────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <span className="h-px w-12 bg-white/40" />
        <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/85">
          Bestsellers · Drag to explore
        </span>
        <span className="h-px w-12 bg-white/40" />
      </div>

      {/* ── 3D Stage ───────────────────────────────────────────── */}
      <motion.div
        ref={containerRef}
        className="relative w-full h-[440px] cursor-grab active:cursor-grabbing select-none touch-none"
        style={{ perspective: 1400 }}
        onPanStart={() => { setIsDragging(true); lastInteractionRef.current = Date.now(); }}
        onPan={handleDrag}
        onPanEnd={handleDragEnd}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            rotateY: spring,
          }}
        >
          {top5.map((p, i) => (
            <CarouselCard
              key={p._id}
              product={p}
              angle={i * stepAngle}
              radius={RADIUS}
              onClick={() => {
                if (i === activeIdxState) {
                  onSelect(p._id);
                } else {
                  // rotate this card to front
                  rotation.set(-i * stepAngle);
                  lastInteractionRef.current = Date.now();
                  setTimeout(snapToNearest, 300);
                }
              }}
            />
          ))}
        </motion.div>

        {/* Side arrows */}
        <button
          onClick={() => stepBy(-1)}
          aria-label="Previous"
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => stepBy(1)}
          aria-label="Next"
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Floor reflection / shadow */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[60%] h-10 bg-black/40 blur-2xl rounded-full pointer-events-none" />
      </motion.div>

      {/* ── Active product caption + CTA ───────────────────────── */}
      <div className="mt-4 text-center text-white space-y-3 px-4">
        <motion.div
          key={active._id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-2"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/60">
            {active.category}
            {active.roastLevel ? ` · ${active.roastLevel} roast` : ""}
          </p>
          <h2 className="font-serif font-bold text-3xl md:text-5xl leading-tight">
            {active.name}
          </h2>
          {active.rating !== undefined && (
            <div className="flex items-center justify-center gap-1.5 text-sm">
              <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span className="font-bold">{active.rating.toFixed(1)}</span>
              <span className="text-white/60">({active.reviewCount ?? 0} reviews)</span>
            </div>
          )}
        </motion.div>

        <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
          <button
            onClick={() => onSelect(active._id)}
            className="bg-white text-natural-text px-7 py-3.5 rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-transform shadow-xl"
          >
            View product
          </button>
          <button
            onClick={() => onAddToCart(active.name)}
            className="bg-white/10 border border-white/30 backdrop-blur-md text-white px-6 py-3.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-white/20 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to cart · ₹{active.price.toLocaleString("en-IN")}
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 pt-3">
          {top5.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                rotation.set(-i * stepAngle);
                lastInteractionRef.current = Date.now();
                setTimeout(snapToNearest, 200);
              }}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIdxState ? "w-8 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Single card in the ring — orbits at `angle` degrees, faces camera
// inside-out so users see the front when it's at the front of the ring.
// ──────────────────────────────────────────────────────────────
function CarouselCard({
  product,
  angle,
  radius,
  onClick,
}: {
  product: Product;
  angle: number;
  radius: number;
  onClick: () => void;
}) {
  return (
    <div
      className="absolute top-1/2 left-1/2 w-64 h-80 -ml-32 -mt-40"
      style={{
        transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Counter-rotate so card always faces camera */}
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="block w-full h-full rounded-[2rem] overflow-hidden bg-white shadow-2xl border border-white/30 group"
        style={{ transform: `rotateY(${-angle}deg)`, transformStyle: "preserve-3d" }}
      >
        <div className="relative w-full h-full">
          <SmartImage
            src={product.imageUrl}
            blur={product.imageBlur}
            alt={product.name}
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            wrapperClassName="absolute inset-0"
            priority
          />
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent text-white">
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/70">
              {product.category}
            </p>
            <p className="font-bold text-sm leading-tight line-clamp-2 mt-1">
              {product.name}
            </p>
            <p className="text-amber-300 font-bold text-sm mt-1">
              ₹{product.price.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </motion.button>
    </div>
  );
}
