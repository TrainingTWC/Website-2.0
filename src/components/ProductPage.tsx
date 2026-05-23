import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  MapPin,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { PRODUCT_PERSONALITIES } from "../../convex/productContext";
import type { ProductPersonality } from "../../convex/productContext";
import { SmartImage } from "./SmartImage";
// Lazy-load the 3D viewer — three.js is large, only needed for one product.
// On chunk-load failure (stale cache after new deploy) reload once to pick up
// the new index.html, preventing a white screen.
const ProductHero3D = lazy(() =>
  import("./ProductHero3D")
    .then((m) => ({ default: m.ProductHero3D }))
    .catch(() => {
      const key = "chunk_reload_at";
      const last = Number(sessionStorage.getItem(key) ?? 0);
      if (Date.now() - last > 10_000) {
        sessionStorage.setItem(key, String(Date.now()));
        window.location.reload();
      }
      // Return a no-op component so Suspense resolves without crashing
      const Noop = () => null;
      return { default: Noop as React.ComponentType<any> };
    })
);
import { PersonalitySection } from "./PersonalitySection";
import { BrewingStudio } from "./BrewingStudio";
import { SipForecast } from "./SipForecast";
import { slugify } from "../lib/slug";
import { asset } from "../lib/asset";
import { useProducts } from "../lib/useProducts";
import type { Product } from "../types";

// ── 3D models ────────────────────────────────────────────────────────────────
const SOUTH_INDIAN_3D_MODEL = asset("models/signature-south-indian-filter-blend.glb");
const SOUTH_INDIAN_NAME = "Signature South Indian Filter Blend";

const EL_DIABLO_3D_MODEL = asset("models/el-diablo-blend.glb");
const EL_DIABLO_NAME = "El Diablo Blend";

/**
 * Full-screen product detail page (route: `?product=<id>`).
 *
 * Inspiration: minimal pharma/wellness product page (large centered
 * product shot, color-washed background, side info, generous typography).
 *
 * The page derives a color theme from the product's category/roast so each
 * product feels uniquely keyed without needing per-product theming data.
 */

interface ProductPageProps {
  productId: string;
  onAddToCart: (productId: string, qty: number) => void;
  onOpenCart?: () => void;
  cartCount?: number;
  onBack?: () => void;
}

interface Theme {
  bg: string;        // gradient background CSS
  fg: string;        // text color
  accent: string;    // CTA / chip background
  accentText: string;
  pillBg: string;    // soft pill bg for secondary chips
  shadow: string;
  decorOpacity: string;
  accentHex: string; // raw hex for parallax-section tinting
}

const THEMES: Record<string, Theme> = {
  dark: {
    bg: "#3A2419",
    fg: "text-white",
    accent: "bg-amber-200 text-natural-text",
    accentText: "text-amber-100/80",
    pillBg: "bg-white/10 text-white border-white/15",
    shadow: "drop-shadow-[0_50px_70px_rgba(0,0,0,0.6)]",
    decorOpacity: "opacity-[0.14]",
    accentHex: "#D4A062",
  },
  "medium-dark": {
    bg: "#5C3A26",
    fg: "text-white",
    accent: "bg-orange-100 text-natural-text",
    accentText: "text-orange-100/80",
    pillBg: "bg-white/10 text-white border-white/15",
    shadow: "drop-shadow-[0_50px_70px_rgba(0,0,0,0.5)]",
    decorOpacity: "opacity-[0.16]",
    accentHex: "#E8B583",
  },
  medium: {
    bg: "#3E5C4A",
    fg: "text-white",
    accent: "bg-white text-natural-text",
    accentText: "text-white/70",
    pillBg: "bg-white/10 text-white border-white/15",
    shadow: "drop-shadow-[0_50px_70px_rgba(0,0,0,0.45)]",
    decorOpacity: "opacity-[0.18]",
    accentHex: "#D4C8A8",
  },
  light: {
    bg: "#C5A572",
    fg: "text-natural-text",
    accent: "bg-natural-text text-white",
    accentText: "text-natural-text/65",
    pillBg: "bg-natural-text/8 text-natural-text border-natural-text/15",
    shadow: "drop-shadow-[0_50px_70px_rgba(80,50,20,0.3)]",
    decorOpacity: "opacity-[0.2]",
    accentHex: "#7A5A2C",
  },
  bags: {
    bg: "#4A6373",
    fg: "text-white",
    accent: "bg-white text-natural-text",
    accentText: "text-white/70",
    pillBg: "bg-white/10 text-white border-white/15",
    shadow: "drop-shadow-[0_50px_70px_rgba(0,0,0,0.45)]",
    decorOpacity: "opacity-[0.18]",
    accentHex: "#C8D6DE",
  },
  merch: {
    bg: "#7A6F62",
    fg: "text-white",
    accent: "bg-white text-natural-text",
    accentText: "text-white/70",
    pillBg: "bg-white/10 text-white border-white/15",
    shadow: "drop-shadow-[0_50px_70px_rgba(0,0,0,0.4)]",
    decorOpacity: "opacity-[0.18]",
    accentHex: "#D9D1C7",
  },
};

function themeFor(p: Product): Theme {
  const key = p.roastLevel ?? p.type;
  return THEMES[key] ?? THEMES.medium;
}

export function ProductPage({ productId, onAddToCart, onOpenCart, cartCount, onBack }: ProductPageProps) {
  const products = useProducts();
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState<string>("250g");
  const [model3DReady, setModel3DReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const product = useMemo(
    () =>
      products?.find(
        (p) => p._id === productId || slugify(p.name) === productId
      ) ?? null,
    [products, productId]
  );

  useEffect(() => {
    setVariant("250g");
    setQty(1);
    setModel3DReady(false);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [productId]);

  if (products === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-natural-bg">
        <div className="text-natural-text/50 text-sm tracking-widest uppercase">Loading…</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-natural-bg px-6 text-center">
        <div className="space-y-4">
          <p className="text-natural-text/50 uppercase tracking-widest text-xs font-bold">Product not found</p>
          <button
            onClick={() => (window.location.search = "")}
            className="bg-natural-text text-white px-6 py-3 rounded-full text-sm font-bold"
          >
            Back to shop
          </button>
        </div>
      </div>
    );
  }

  const theme = themeFor(product);
  const personality = PRODUCT_PERSONALITIES[product.name];

  const variants =
    product.type === "beans"
      ? ["250g", "500g", "1kg"]
      : product.type === "bags"
      ? ["Box of 5", "Box of 10", "Box of 20"]
      : ["Default"];

  const variantMultiplier: Record<string, number> = {
    "250g": 1, "500g": 1.9, "1kg": 3.5,
    "Box of 5": 1, "Box of 10": 1.9, "Box of 20": 3.7,
    "Default": 1,
  };
  const displayPrice = Math.round(product.price * (variantMultiplier[variant] ?? 1));

  const related = (products ?? [])
    .filter((p) => p._id !== product._id && p.type === product.type)
    .slice(0, 4);

  const goHome = () => {
    if (onBack) {
      onBack();
      return;
    }
    // Legacy SPA fallback
    const url = new URL(window.location.href);
    url.searchParams.delete("product");
    window.history.pushState({}, "", url.toString());
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const goToProduct = (slug: string) => {
    if (onBack) {
      // In Next.js routing, navigate to the new product
      window.location.href = `/products/${slug}`;
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("product", slug);
    window.history.pushState({}, "", url.toString());
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <ImmersiveProductLayout
      product={product}
      theme={theme}
      personality={personality}
      qty={qty}
      setQty={setQty}
      variant={variant}
      setVariant={setVariant}
      variants={variants}
      displayPrice={displayPrice}
      model3DReady={model3DReady}
      setModel3DReady={setModel3DReady}
      related={related}
      onAddToCart={onAddToCart}
      goHome={goHome}
      goToProduct={goToProduct}
      containerRef={containerRef}
    />
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-natural-border/60 pb-3 last:border-b-0 last:pb-0">
      <span className="text-xs uppercase tracking-widest text-natural-text/50 font-bold">{label}</span>
      <span className="text-sm font-bold text-natural-text text-right capitalize">{value}</span>
    </div>
  );
}

// ── Immersive Layout ──────────────────────────────────────────────────────────

interface LayoutProps {
  product: Product;
  theme: Theme;
  personality: ProductPersonality | undefined;
  qty: number;
  setQty: (fn: (q: number) => number) => void;
  variant: string;
  setVariant: (v: string) => void;
  variants: string[];
  displayPrice: number;
  model3DReady: boolean;
  setModel3DReady: (v: boolean) => void;
  related: Product[];
  onAddToCart: (productId: string, qty: number) => void;
  goHome: () => void;
  goToProduct: (slug: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function ImmersiveProductLayout({
  product, theme, personality, qty, setQty, variant, setVariant, variants,
  displayPrice, model3DReady, setModel3DReady, related, onAddToCart, goHome,
  goToProduct, containerRef,
}: LayoutProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const [stickyVisible, setStickyVisible] = useState(false);

  // Sticky bar: show after hero scrolls out
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" }
    );
    if (heroRef.current) obs.observe(heroRef.current);
    return () => obs.disconnect();
  }, []);

  // Scroll-driven parallax
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(heroScroll, [0, 1], ["0%", "12%"]);
  const imageScale = useTransform(heroScroll, [0, 1], [1, 1.05]);
  const titleY = useTransform(heroScroll, [0, 1], ["0%", "-18%"]);
  const titleOpacity = useTransform(heroScroll, [0, 0.6], [1, 0.4]);
  const cardOpacity = useTransform(heroScroll, [0, 0.4], [1, 0]);

  const springY = useSpring(imageY, { stiffness: 80, damping: 25 });
  const springScale = useSpring(imageScale, { stiffness: 80, damping: 25 });

  // 3D mouse-tracked tilt on the product image
  const mouseX = useSpring(0, { stiffness: 120, damping: 18 });
  const mouseY = useSpring(0, { stiffness: 120, damping: 18 });
  const rotateY3D = useTransform(mouseX, [-1, 1], [-14, 14]);
  const rotateX3D = useTransform(mouseY, [-1, 1], [10, -10]);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imageWrapRef.current) return;
    const rect = imageWrapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x * 2);
    mouseY.set(y * 2);
  };
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const has3D = product.name === SOUTH_INDIAN_NAME || product.name === EL_DIABLO_NAME;
  const modelUrl = product.name === EL_DIABLO_NAME ? EL_DIABLO_3D_MODEL : SOUTH_INDIAN_3D_MODEL;

  return (
    <div ref={containerRef} className="min-h-screen" style={{ background: theme.bg }}>

      {/* ── Sticky mini-nav ──────────────────────────────────────── */}
      <AnimatePresence>
        {stickyVisible && (
          <motion.div
            initial={{ y: -64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -64, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b"
            style={{
              background: `${theme.bg}e6`,
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4 ${theme.fg}`}>
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={goHome}
                  className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-sm truncate">{product.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-bold text-sm hidden sm:block">
                  ₹{displayPrice.toLocaleString("en-IN")}
                </span>
                <button
                  onClick={() => onAddToCart(product._id, qty)}
                  className={`${theme.accent} px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-transform`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Add to cart
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO — editorial asymmetric layout ──────────────────────── */}
      <div
        ref={heroRef}
        className={`relative overflow-hidden ${theme.fg}`}
        style={{ minHeight: "100dvh", background: theme.bg }}
      >
        {/* Terrazzo-style speckled background flecks (subtle, premium) */}
        <div className={`absolute inset-0 pointer-events-none ${theme.decorOpacity}`} aria-hidden>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 12% 18%, currentColor 0.5px, transparent 1px),
                                radial-gradient(circle at 78% 32%, currentColor 0.5px, transparent 1px),
                                radial-gradient(circle at 38% 76%, currentColor 0.5px, transparent 1px),
                                radial-gradient(circle at 88% 88%, currentColor 0.5px, transparent 1px)`,
              backgroundSize: "180px 180px, 220px 220px, 260px 260px, 200px 200px",
              opacity: 0.5,
            }}
          />
        </div>

        {/* Accent radial glow behind product */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: "10%",
            top: "30%",
            width: "55vw",
            height: "55vw",
            maxWidth: "900px",
            maxHeight: "900px",
            background: `radial-gradient(circle, ${theme.accentHex}30 0%, transparent 60%)`,
            filter: "blur(40px)",
          }}
          aria-hidden
        />

        {/* ── TOP NAV BAR ─────────────────────────────────────────── */}
        <div className="relative z-20 max-w-[1440px] mx-auto w-full px-6 sm:px-10 pt-6 sm:pt-8 grid grid-cols-3 items-start gap-4">
          {/* Left: back / menu cue */}
          <motion.button
            onClick={goHome}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] opacity-80 hover:opacity-100 transition-opacity justify-self-start"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </motion.button>

          {/* Center: Third Wave Coffee logo */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="justify-self-center flex items-center"
          >
            <img
              src={asset("logo.png")}
              alt="Third Wave Coffee"
              className={`h-7 sm:h-8 w-auto object-contain ${theme.fg === "text-white" ? "invert" : ""}`}
              style={{ filter: theme.fg === "text-white" ? "brightness(0) invert(1)" : "none" }}
            />
          </motion.div>

          {/* Right: cart dot */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] opacity-80 justify-self-end"
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full bg-current`} />
            <span className={`text-[10px] font-bold uppercase tracking-[0.3em] px-3 py-1.5 rounded-full border ${theme.pillBg}`}>
              {product.category}
            </span>
          </motion.div>
        </div>

        {/* ── MAIN STAGE — asymmetric grid ────────────────────────── */}
        <div className="relative z-10 max-w-[1440px] mx-auto w-full px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-x-6 gap-y-4 sm:gap-y-6 pt-4 sm:pt-6 pb-12">

          {/* HUGE TITLE — spans top, dominant */}
          <motion.div
            style={{ y: titleY, opacity: titleOpacity }}
            className="lg:col-start-5 lg:col-end-13 lg:row-start-1 relative z-20"
          >
            {/* eyebrow */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`text-[11px] font-bold uppercase tracking-[0.4em] mb-2 sm:mb-3 ${theme.accentText}`}
              style={{ opacity: 0.9 }}
            >
              {product.type === "beans" ? "Single origin" : product.type === "bags" ? "Ready to brew" : "Crafted"} ·{" "}
              {product.origin ?? product.category}
            </motion.p>

            {/* TITLE — split words for stagger */}
            <h1
              className="font-serif font-light leading-[0.88] tracking-[-0.02em]"
              style={{ fontSize: "clamp(2.6rem, 8.5vw, 8.5rem)" }}
            >
              {product.name.split(" ").map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 40, rotateX: -30 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.15 + i * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="inline-block mr-[0.25em]"
                  style={{ transformOrigin: "left bottom" }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>
          </motion.div>

          {/* OVERSIZED PRODUCT IMAGE — bleeds left, dominates */}
          <motion.div
            ref={imageWrapRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ y: springY, scale: springScale }}
            className="lg:col-start-1 lg:col-end-8 lg:row-start-2 relative flex items-center justify-center lg:justify-start lg:-ml-8 xl:-ml-16 -mt-6 sm:-mt-12 lg:-mt-20 z-10"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={`relative ${theme.shadow}`}
              style={{
                width: "clamp(280px, 50vw, 680px)",
                height: "clamp(280px, 50vw, 680px)",
                perspective: "1400px",
              }}
            >
              <motion.div
                style={{
                  rotateX: rotateX3D,
                  rotateY: rotateY3D,
                  transformStyle: "preserve-3d",
                }}
                className="w-full h-full"
              >
                {has3D ? (
                  <>
                    <motion.div
                      className="absolute inset-0"
                      animate={{ opacity: model3DReady ? 0 : 1 }}
                      transition={{ duration: 0.7 }}
                      style={{ pointerEvents: "none" }}
                    >
                      <SmartImage
                        src={product.imageUrl} blur={product.imageBlur} alt={product.name}
                        className="object-contain object-center"
                        wrapperClassName="w-full h-full"
                        priority
                      />
                    </motion.div>
                    <motion.div
                      className="absolute inset-0"
                      animate={{ opacity: model3DReady ? 1 : 0 }}
                      transition={{ duration: 0.7 }}
                    >
                      <Suspense fallback={null}>
                        <ProductHero3D
                          modelUrl={modelUrl}
                          shadowOpacity={0.3}
                          onReady={() => setModel3DReady(true)}
                        />
                      </Suspense>
                    </motion.div>
                  </>
                ) : (
                  <motion.div
                    animate={{ rotateY: 360 }}
                    transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                    style={{ transformStyle: "preserve-3d", willChange: "transform" }}
                    className="relative w-full h-full"
                  >
                    <div style={{ backfaceVisibility: "hidden" }} className="absolute inset-0">
                      <SmartImage
                        src={product.imageUrl} blur={product.imageBlur} alt={product.name}
                        className="object-contain object-center"
                        wrapperClassName="w-full h-full"
                        priority
                      />
                    </div>
                    <div
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                      className="absolute inset-0"
                      aria-hidden
                    >
                      <SmartImage
                        src={product.imageUrl} blur={product.imageBlur} alt=""
                        className="object-contain object-center scale-x-[-1]"
                        wrapperClassName="w-full h-full"
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Soft ground shadow */}
              <div
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-2/3 h-10 blur-2xl rounded-full pointer-events-none"
                style={{ background: "rgba(0,0,0,0.35)" }}
              />
            </motion.div>
          </motion.div>

          {/* PRODUCT CARD — pinned top-right, right under title */}
          <motion.div
            style={{ opacity: cardOpacity }}
            className="lg:col-start-8 lg:col-end-13 lg:row-start-2 self-start relative z-20"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="lg:max-w-md ml-auto"
            >
              {/* Short description */}
              <p
                className="text-[15px] sm:text-base leading-[1.65] mb-6 font-medium"
                style={{ opacity: 0.92 }}
              >
                {product.description}
              </p>

              {/* Inline product details — origin · roast · type · stock */}
              {(() => {
                const details = [
                  product.origin && { label: "Origin", value: product.origin },
                  product.roastLevel && { label: "Roast", value: product.roastLevel.replace("-", " ") },
                  { label: "Type", value: product.type },
                  { label: "Stock", value: product.stockStatus.replace("-", " ") },
                ].filter(Boolean) as { label: string; value: string }[];
                return (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-6">
                    {details.map((d) => (
                      <div key={d.label}>
                        <p className={`text-[9px] font-bold uppercase tracking-[0.3em] mb-1 ${theme.accentText}`}>{d.label}</p>
                        <p className="text-sm font-medium capitalize leading-snug">{d.value}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${theme.pillBg}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Hairline */}
              <div className="h-px w-full mb-5" style={{ background: "currentColor", opacity: 0.15 }} />

              {/* Price + edition row */}
              <div className="flex items-start justify-between gap-6 mb-5">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-2 ${theme.accentText}`}>Price</p>
                  <p className="font-serif font-light text-3xl sm:text-4xl tracking-tight">
                    ₹{displayPrice.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-2 ${theme.accentText}`}>Edition</p>
                  <p className="text-sm font-medium">
                    {variant}
                    {product.weight && (
                      <>
                        <br />
                        <span className={theme.accentText}>{product.weight}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Hairline */}
              <div className="h-px w-full mb-5" style={{ background: "currentColor", opacity: 0.15 }} />

              {/* Size selector — labeled inline */}
              <div className="flex items-center justify-between gap-4 mb-5">
                <span className={`text-[10px] font-bold uppercase tracking-[0.3em] ${theme.accentText}`}>Size</span>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {variants.map((v) => (
                    <button
                      key={v}
                      onClick={() => setVariant(v)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide border transition-all ${
                        v === variant
                          ? `${theme.accent} border-transparent shadow-md`
                          : `${theme.pillBg} backdrop-blur-sm hover:scale-105`
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flavor swatches */}
              {product.flavorNotes.length > 0 && (
                <>
                  <div className="h-px w-full mb-5" style={{ background: "currentColor", opacity: 0.15 }} />
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.3em] ${theme.accentText}`}>Notes</span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {product.flavorNotes.slice(0, 4).map((note) => (
                        <span
                          key={note}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${theme.pillBg}`}
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Hairline */}
              <div className="h-px w-full mb-6" style={{ background: "currentColor", opacity: 0.15 }} />

              {/* Qty + CTA row */}
              <div className="flex items-center gap-3">
                <div className={`inline-flex items-center gap-1 rounded-full border ${theme.pillBg} px-1.5 py-1`}>
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold w-5 text-center text-sm">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => onAddToCart(product._id, qty)}
                  className={`flex-1 ${theme.accent} px-5 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-95 transition-transform`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to basket
                </button>
              </div>

              {product.stockStatus === "low-stock" && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300 flex items-center gap-1.5 mt-4">
                  <Sparkles className="w-3 h-3" />
                  Limited stock
                </p>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none ${theme.accentText}`}
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </div>

      {/* ── EDITORIAL STORY SECTION ──────────────────────────────────── */}
      <StorySection product={product} />

      {/* ── Personality ──────────────────────────────────────────────── */}
      {personality && (
        <PersonalitySection
          personality={personality}
          productName={product.name}
          accentHex={theme.accentHex}
        />
      )}

      {/* ── AI sections ──────────────────────────────────────────────── */}
      <div className="bg-natural-bg text-natural-text">
        {product.type === "beans" && (
          <BrewingStudio
            productName={product.name}
            roastLevel={product.roastLevel}
            origin={product.origin}
            flavorNotes={product.flavorNotes}
            accentHex={theme.accentHex}
          />
        )}
        {product.type === "bags" && (
          <SipForecast
            productName={product.name}
            roastLevel={product.roastLevel}
            origin={product.origin}
            flavorNotes={product.flavorNotes}
            bagKind={product.category === "cold-brew" ? "cold-brew" : "drip-bag"}
            accentHex={theme.accentHex}
          />
        )}

        {/* ── Related ──────────────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-28 sm:pb-20">
            <div className="flex items-end justify-between border-b border-natural-border pb-8 mb-10">
              <h3 className="font-sans font-black text-2xl sm:text-3xl">You might also love</h3>
              <button
                onClick={goHome}
                className="text-xs font-bold uppercase tracking-widest text-natural-accent border-b border-natural-accent/30 pb-1"
              >
                Shop all
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {related.map((p) => (
                <button key={p._id} onClick={() => goToProduct(slugify(p.name))} className="text-left group space-y-3">
                  <div className="aspect-square bg-natural-paper border border-natural-border rounded-3xl overflow-hidden group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                    <SmartImage
                      src={p.imageUrl} blur={p.imageBlur} alt={p.name}
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      wrapperClassName="w-full h-full"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight">{p.name}</h4>
                    <p className="text-natural-accent font-bold text-sm mt-1">₹{p.price.toLocaleString("en-IN")}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ── Editorial story section ───────────────────────────────────────────────────

function StorySection({ product }: { product: Product }) {
  const ref = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const { scrollYProgress: ghostScroll } = useScroll({ target: ghostRef, offset: ["start end", "end start"] });
  const lineWidth = useTransform(scrollYProgress, [0.1, 0.5], ["0%", "100%"]);
  // Scroll-driven horizontal sweep of the ghost product name
  const ghostX = useTransform(ghostScroll, [0, 1], ["15%", "-35%"]);
  const ghostOpacity = useTransform(ghostScroll, [0, 0.3, 0.7, 1], [0, 1, 1, 0.3]);
  const ghostScale = useTransform(ghostScroll, [0, 1], [0.9, 1.1]);

  if (!product.description) return null;

  return (
    <section
      ref={ref}
      className="bg-natural-bg text-natural-text py-20 sm:py-28 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section header with animated underline */}
        <div className="mb-12 sm:mb-16">
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent mb-3"
          >
            The story
          </motion.p>
          <div className="relative overflow-hidden h-px w-full bg-natural-border mb-0">
            <motion.div
              className="absolute inset-y-0 left-0 bg-natural-text"
              style={{ width: lineWidth }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 sm:gap-20 items-start">
          {/* Left: big pull quote + description */}
          <div className="space-y-8">
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="font-sans font-black text-[clamp(2.2rem,5vw,4rem)] leading-[0.92] tracking-[-0.02em]"
            >
              A daily ritual,<br />perfected.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="text-natural-text/85 leading-[1.7] text-lg sm:text-xl max-w-xl font-medium"
            >
              {product.description}
            </motion.p>

            {product.flavorNotes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.2 }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-natural-accent mb-4">
                  Flavor profile
                </p>
                <div className="space-y-3">
                  {product.flavorNotes.map((note, i) => (
                    <div key={note} className="flex items-center gap-3">
                      <span className="text-sm font-bold capitalize w-28 shrink-0">{note}</span>
                      <div className="flex-1 h-1.5 bg-natural-border rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-natural-text"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${85 - i * 12}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.7, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right: large product name rotated + spec card */}
          <div className="space-y-6">
            {/* Scroll-driven ghost product name */}
            <div ref={ghostRef} className="relative h-28 sm:h-36 overflow-hidden select-none" aria-hidden>
              <motion.div
                style={{ x: ghostX, opacity: ghostOpacity, scale: ghostScale }}
                className="absolute inset-0 flex items-center font-sans font-black uppercase text-natural-text/12 leading-none will-change-transform"
              >
                <span
                  style={{ fontSize: "clamp(4rem, 11vw, 9rem)", letterSpacing: "-0.04em", whiteSpace: "nowrap" }}
                >
                  {product.name} · {product.name}
                </span>
              </motion.div>
            </div>

            {/* Spec card */}
            <motion.aside
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="bg-natural-paper border border-natural-border rounded-3xl p-7 sm:p-8 space-y-4"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-natural-accent">Specifications</p>
              <Spec label="Category" value={product.category} />
              {product.roastLevel && <Spec label="Roast" value={product.roastLevel.replace("-", " ")} />}
              {product.origin && <Spec label="Origin" value={product.origin} />}
              {product.weight && <Spec label="Weight" value={product.weight} />}
              <Spec label="Stock" value={product.stockStatus.replace("-", " ")} />
              {product.tags.length > 0 && <Spec label="Tags" value={product.tags.join(", ")} />}
            </motion.aside>
          </div>
        </div>
      </div>
    </section>
  );
}
