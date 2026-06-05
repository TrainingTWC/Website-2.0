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
import { MorphingHeader } from "./MorphingHeader";
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
    accentText: "text-amber-50/85",
    pillBg: "bg-white/10 text-white border-white/20",
    shadow: "",
    decorOpacity: "opacity-[0.14]",
    accentHex: "#D4A062",
  },
  "medium-dark": {
    bg: "#5C3A26",
    fg: "text-white",
    accent: "bg-orange-100 text-natural-text",
    accentText: "text-orange-50/85",
    pillBg: "bg-white/10 text-white border-white/20",
    shadow: "",
    decorOpacity: "opacity-[0.16]",
    accentHex: "#E8B583",
  },
  medium: {
    bg: "#3E5C4A",
    fg: "text-white",
    accent: "bg-white text-natural-text",
    accentText: "text-white/85",
    pillBg: "bg-white/10 text-white border-white/20",
    shadow: "",
    decorOpacity: "opacity-[0.18]",
    accentHex: "#D4C8A8",
  },
  light: {
    bg: "#C5A572",
    fg: "text-natural-text",
    accent: "bg-natural-text text-white",
    accentText: "text-natural-text/75",
    pillBg: "bg-natural-text/10 text-natural-text border-natural-text/20",
    shadow: "",
    decorOpacity: "opacity-[0.2]",
    accentHex: "#7A5A2C",
  },
  bags: {
    bg: "#4A6373",
    fg: "text-white",
    accent: "bg-white text-natural-text",
    accentText: "text-white/85",
    pillBg: "bg-white/10 text-white border-white/20",
    shadow: "",
    decorOpacity: "opacity-[0.18]",
    accentHex: "#C8D6DE",
  },
  merch: {
    bg: "#7A6F62",
    fg: "text-white",
    accent: "bg-white text-natural-text",
    accentText: "text-white/85",
    pillBg: "bg-white/10 text-white border-white/20",
    shadow: "",
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

  // ── v8.0 funnel: emit product_viewed once we have the resolved product
  useEffect(() => {
    if (!product) return;
    void import("../lib/analytics").then(({ track }) => {
      track("product_viewed", {
        productId: product._id,
        name: product.name,
        price: product.price,
        type: product.type,
        category: product.category,
      }, { stage: 2 });
    });
  }, [product?._id]);

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
      onOpenCart={onOpenCart}
      cartCount={cartCount}
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
  onOpenCart?: () => void;
  cartCount?: number;
  goHome: () => void;
  goToProduct: (slug: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function ImmersiveProductLayout({
  product, theme, personality, qty, setQty, variant, setVariant, variants,
  displayPrice, model3DReady, setModel3DReady, related, onAddToCart, onOpenCart,
  cartCount, goHome, goToProduct, containerRef,
}: LayoutProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);

  // Header scroll motion values (same treatment as homepage)
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 80], ["rgba(250,249,246,0.0)", "rgba(250,249,246,0.95)"]);
  const headerBorder = useTransform(scrollY, [0, 80], ["rgba(255,255,255,0.0)", "rgba(255,255,255,0.4)"]);
  const headerShadow = useTransform(scrollY, [0, 80], ["none", "0 4px 30px rgba(44,24,16,0.15)"]);

  const handleNavTo = (target: string) => {
    if (target.startsWith("/")) { window.location.href = target; return; }
    goHome();
  };

  // Scroll-driven parallax
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  // Use numeric px values (not % strings) so useSpring interpolates correctly
  const imageY = useTransform(heroScroll, [0, 1], [0, 60]);
  const imageScale = useTransform(heroScroll, [0, 1], [1, 1.04]);
  const titleY = useTransform(heroScroll, [0, 1], ["0%", "-18%"]);
  const titleOpacity = useTransform(heroScroll, [0, 0.6], [1, 0.4]);
  const cardOpacity = useTransform(heroScroll, [0, 0.4], [1, 0]);

  // stiffness 100 / damping 30 → ζ ≈ 1.5 (overdamped, no oscillation, snappy enough)
  const springY = useSpring(imageY, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const springScale = useSpring(imageScale, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // 3D mouse-tracked tilt on the product image
  // stiffness 120 / damping 22 → ζ ≈ 1.0 (critically damped, fastest settle, no overshoot)
  const mouseX = useSpring(0, { stiffness: 120, damping: 22, restDelta: 0.001 });
  const mouseY = useSpring(0, { stiffness: 120, damping: 22, restDelta: 0.001 });
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

      {/* ── Full-site navigation header (same as homepage + third circle) ── */}
      <MorphingHeader
        headerBg={headerBg}
        headerBorder={headerBorder}
        headerShadow={headerShadow}
        onOpenTI={() => {}}
        onOpenCart={onOpenCart ?? (() => {})}
        onNavTo={handleNavTo}
        cartCount={cartCount ?? 0}
      />

      {/* ── HERO — editorial asymmetric layout ──────────────────────── */}
      <div
        ref={heroRef}
        className={`relative overflow-hidden flex flex-col ${theme.fg}`}
        style={{ height: "100dvh", background: theme.bg }}
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

        {/* Accent radial glow — centered for center-image layout */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            top: "20%",
            width: "55vw",
            height: "55vw",
            maxWidth: "900px",
            maxHeight: "900px",
            background: `radial-gradient(circle, ${theme.accentHex}30 0%, transparent 60%)`,
            filter: "blur(40px)",
          }}
          aria-hidden
        />

        {/* ── MAIN STAGE ────────────────────────────────────────────── */}
        <div className="relative z-10 flex-1 flex items-center overflow-hidden pt-20">
          <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 grid grid-cols-1 lg:grid-cols-12 gap-x-6 lg:gap-x-8 items-center py-2">

            {/* IMAGE — center panel, col 5-9 */}
            <motion.div
              ref={imageWrapRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ y: springY, scale: springScale }}
              className="lg:col-start-5 lg:col-end-9 flex items-center justify-center order-1 lg:order-2 mb-6 lg:mb-0"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
                style={{
                  width: "clamp(160px, 22vw, 360px)",
                  height: "clamp(160px, 22vw, 360px)",
                  maxHeight: "calc(100dvh - 14rem)",
                  maxWidth: "calc(100dvh - 14rem)",
                  perspective: "1400px",
                  filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.45)) drop-shadow(0 8px 16px rgba(0,0,0,0.2))",
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
                        transparent
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
                        transparent
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
                        transparent
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Soft ground shadow */}
              <div
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1/2 h-6 blur-xl rounded-full pointer-events-none"
                style={{ background: "rgba(0,0,0,0.35)" }}
              />
            </motion.div>
          </motion.div>

            {/* LEFT PANEL — col 1-5: tagline, title, details, tags */}
            <motion.div
              style={{ y: titleY, opacity: titleOpacity }}
              className="lg:col-start-1 lg:col-end-5 flex flex-col justify-center order-2 lg:order-1 mt-6 lg:mt-0"
            >
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={`text-[11px] font-bold uppercase tracking-[0.4em] mb-3 ${theme.accentText}`}
              >
                {product.type === "beans" ? "Single origin" : product.type === "bags" ? "Ready to brew" : "Crafted"} ·{" "}
                {product.origin ?? product.category}
              </motion.p>

              <h1
                className="font-serif font-normal leading-[0.92] tracking-[-0.025em] mb-5"
                style={{ fontSize: "clamp(1.8rem, 2.8vw, 3.6rem)" }}
              >
                {product.name.split(" ").map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 28, rotateX: -20 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{
                      duration: 0.7,
                      delay: 0.15 + i * 0.06,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="inline-block mr-[0.18em]"
                    style={{ transformOrigin: "left bottom" }}
                  >
                    {word}
                  </motion.span>
                ))}
              </h1>

              {/* Details */}
              {(() => {
                const details = [
                  product.origin && { label: "Origin", value: product.origin },
                  product.roastLevel && { label: "Roast", value: product.roastLevel.replace("-", " ") },
                  { label: "Type", value: product.type },
                  { label: "Stock", value: product.stockStatus.replace("-", " ") },
                ].filter(Boolean) as { label: string; value: string }[];
                return (
                  <div className="flex flex-wrap gap-x-6 gap-y-3 mb-4">
                    {details.map((d) => (
                      <div key={d.label}>
                        <p className={`text-[9px] font-bold uppercase tracking-[0.35em] mb-0.5 ${theme.accentText}`}>{d.label}</p>
                        <p className="text-[13px] font-semibold capitalize">{d.value}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
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
            </motion.div>

            {/* RIGHT PANEL — col 9-13: description, price, CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-start-9 lg:col-end-13 flex flex-col justify-center order-3 lg:order-3"
            >
              {/* Description */}
              <p className={`text-sm leading-relaxed mb-4 ${theme.accentText}`}>
                {product.description}
              </p>

              {/* Divider */}
              <div className="h-px w-full mb-3" style={{ background: "currentColor", opacity: 0.15 }} />

              {/* Price + Size */}
              <div className="flex flex-wrap items-end gap-x-6 gap-y-3 mb-3">
                <div>
                  <p className={`text-[9px] font-bold uppercase tracking-[0.35em] mb-1 ${theme.accentText}`}>Price</p>
                  <p className="font-serif font-normal text-3xl sm:text-[2.2rem] leading-none tracking-tight">
                    ₹{displayPrice.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className={`text-[9px] font-bold uppercase tracking-[0.35em] mb-1.5 ${theme.accentText}`}>Size</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {variants.map((v) => (
                      <button
                        key={v}
                        onClick={() => setVariant(v)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide border transition-all ${
                          v === variant
                            ? `${theme.accent} border-transparent shadow-lg`
                            : `${theme.pillBg} hover:scale-[1.04]`
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Flavor notes */}
              {product.flavorNotes.length > 0 && (
                <div className="mb-3">
                  <p className={`text-[9px] font-bold uppercase tracking-[0.35em] mb-1.5 ${theme.accentText}`}>Notes</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {product.flavorNotes.slice(0, 3).map((note) => (
                      <span
                        key={note}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${theme.pillBg}`}
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="h-px w-full mb-4" style={{ background: "currentColor", opacity: 0.15 }} />

              {/* Qty + CTA */}
              <div className="flex items-center gap-3">
                <div className={`inline-flex items-center gap-0.5 rounded-full border ${theme.pillBg} px-1.5 py-1.5`}>
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold w-6 text-center text-sm tabular-nums">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => onAddToCart(product._id, qty)}
                  className={`flex-1 ${theme.accent} px-6 py-3.5 rounded-full text-[13px] font-bold tracking-wide uppercase flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-95 transition-transform`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to basket
                </button>
              </div>

              {product.stockStatus === "low-stock" && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300 flex items-center gap-1.5 mt-3">
                  <Sparkles className="w-3 h-3" />
                  Limited stock
                </p>
              )}
            </motion.div>
          </div>
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
