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
    bg: "radial-gradient(circle at 30% 20%, #4A352A 0%, #2C1810 70%)",
    fg: "text-white",
    accent: "bg-amber-300 text-natural-text",
    accentText: "text-amber-200",
    pillBg: "bg-white/10 text-white border-white/20",
    shadow: "drop-shadow-[0_40px_60px_rgba(0,0,0,0.55)]",
    decorOpacity: "opacity-[0.12]",
    accentHex: "#B8763A",
  },
  "medium-dark": {
    bg: "radial-gradient(circle at 30% 20%, #8B5A3C 0%, #5A3A24 70%)",
    fg: "text-white",
    accent: "bg-orange-200 text-natural-text",
    accentText: "text-orange-100",
    pillBg: "bg-white/10 text-white border-white/20",
    shadow: "drop-shadow-[0_40px_60px_rgba(0,0,0,0.45)]",
    decorOpacity: "opacity-[0.14]",
    accentHex: "#C97B4A",
  },
  medium: {
    bg: "radial-gradient(circle at 30% 20%, #D4A56A 0%, #A47148 70%)",
    fg: "text-natural-text",
    accent: "bg-natural-text text-white",
    accentText: "text-natural-text/70",
    pillBg: "bg-white/40 text-natural-text border-natural-text/15",
    shadow: "drop-shadow-[0_40px_60px_rgba(60,30,15,0.35)]",
    decorOpacity: "opacity-[0.18]",
    accentHex: "#A47148",
  },
  light: {
    bg: "radial-gradient(circle at 30% 20%, #F5E6CC 0%, #E2C896 70%)",
    fg: "text-natural-text",
    accent: "bg-natural-text text-white",
    accentText: "text-natural-text/70",
    pillBg: "bg-white/60 text-natural-text border-natural-text/15",
    shadow: "drop-shadow-[0_40px_60px_rgba(80,50,20,0.25)]",
    decorOpacity: "opacity-[0.2]",
    accentHex: "#C49A5A",
  },
  bags: {
    bg: "radial-gradient(circle at 30% 20%, #E8D5B7 0%, #C4A57B 70%)",
    fg: "text-natural-text",
    accent: "bg-natural-text text-white",
    accentText: "text-natural-text/70",
    pillBg: "bg-white/60 text-natural-text border-natural-text/15",
    shadow: "drop-shadow-[0_40px_60px_rgba(80,50,20,0.25)]",
    decorOpacity: "opacity-[0.2]",
    accentHex: "#B08A5C",
  },
  merch: {
    bg: "radial-gradient(circle at 30% 20%, #D9D1C7 0%, #A89F95 70%)",
    fg: "text-natural-text",
    accent: "bg-natural-text text-white",
    accentText: "text-natural-text/70",
    pillBg: "bg-white/60 text-natural-text border-natural-text/15",
    shadow: "drop-shadow-[0_40px_60px_rgba(60,50,40,0.3)]",
    decorOpacity: "opacity-[0.18]",
    accentHex: "#8C7F72",
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

  // Parallax on the hero image
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(heroScroll, [0, 1], ["0%", "18%"]);
  const imageScale = useTransform(heroScroll, [0, 1], [1, 1.06]);
  const nameY = useTransform(heroScroll, [0, 1], ["0%", "-12%"]);
  const overlayOpacity = useTransform(heroScroll, [0, 0.6], [0, 0.35]);

  const springY = useSpring(imageY, { stiffness: 80, damping: 25 });
  const springScale = useSpring(imageScale, { stiffness: 80, damping: 25 });

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
              background: `${theme.bg.replace("radial-gradient", "linear-gradient")}cc`,
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

      {/* ── HERO — full viewport ──────────────────────────────────── */}
      <div
        ref={heroRef}
        className={`relative overflow-hidden ${theme.fg} flex flex-col`}
        style={{ minHeight: "100dvh" }}
      >
        {/* Ambient orbs */}
        <div className={`absolute inset-0 pointer-events-none ${theme.decorOpacity}`}>
          <div className="absolute -left-24 top-1/3 w-[28rem] h-[28rem] rounded-full bg-current blur-3xl" />
          <div className="absolute right-0 bottom-0 w-[36rem] h-[36rem] rounded-full bg-current blur-3xl" />
        </div>

        {/* Scroll-driven overlay to deepen depth */}
        <motion.div
          className="absolute inset-0 bg-black pointer-events-none z-[1]"
          style={{ opacity: overlayOpacity }}
        />

        {/* Top bar: back + category */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 pt-5 pb-0 flex items-center justify-between">
          <motion.button
            onClick={goHome}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.25em] opacity-70 hover:opacity-100 transition-opacity`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </motion.button>
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className={`text-[10px] font-bold uppercase tracking-[0.35em] px-3 py-1.5 rounded-full border backdrop-blur-sm ${theme.pillBg}`}
          >
            {product.category}
          </motion.span>
        </div>

        {/* Product name — overlaps the image below */}
        <motion.div
          style={{ y: nameY, paddingBottom: "clamp(2.5rem, 7vw, 9rem)" }}
          className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-8 pt-8 sm:pt-10"
        >
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-sans font-black leading-[0.88] tracking-[-0.02em] text-[clamp(2.8rem,8vw,7rem)] uppercase"
          >
            {product.name}
          </motion.h1>

          {/* Sub-row: origin + rating */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className={`flex items-center gap-5 mt-3 flex-wrap ${theme.accentText}`}
          >
            {product.origin && (
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {product.origin}
              </span>
            )}
            {product.roastLevel && (
              <span className="text-xs font-bold uppercase tracking-widest opacity-70">
                {product.roastLevel.replace("-", " ")} roast
              </span>
            )}
            {product.rating !== undefined && (
              <span className="flex items-center gap-1 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                {product.rating.toFixed(1)}
                <span className="opacity-60 font-normal">({product.reviewCount ?? 0})</span>
              </span>
            )}
          </motion.div>
        </motion.div>

        {/* Product image — large, centered, parallax — pulled up to sit behind the title */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4" style={{ marginTop: "calc(-1 * clamp(2.5rem, 7vw, 9rem))" }}>
          <motion.div
            style={{ y: springY, scale: springScale }}
            className="relative"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, type: "spring", stiffness: 70, damping: 20 }}
              className={`relative ${theme.shadow}`}
              style={{ width: "clamp(240px, 42vw, 540px)", height: "clamp(240px, 42vw, 540px)" }}
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
                  transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                  style={{ transformStyle: "preserve-3d", willChange: "transform", perspective: "1200px" }}
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

              {/* Radial glow under the product image */}
              <div
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 blur-2xl rounded-full pointer-events-none"
                style={{ background: `${theme.accentHex}55` }}
              />
            </motion.div>
          </motion.div>

          {/* Flavor notes — floating below image */}
          {product.flavorNotes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-2 mt-6"
            >
              {product.flavorNotes.map((note, i) => (
                <motion.span
                  key={note}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, delay: 0.45 + i * 0.07 }}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${theme.pillBg} backdrop-blur-sm`}
                >
                  {note}
                </motion.span>
              ))}
            </motion.div>
          )}
        </div>

        {/* Purchase controls strip — anchored to bottom of hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="relative z-10 border-t"
          style={{ borderColor: "rgba(255,255,255,0.12)" }}
        >
          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-wrap items-center gap-4 sm:gap-6 justify-between backdrop-blur-sm"
          >
            {/* Variant selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-[0.3em] ${theme.accentText} shrink-0`}>Size</span>
              {variants.map((v) => (
                <button
                  key={v}
                  onClick={() => setVariant(v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide border transition-all ${
                    v === variant
                      ? `${theme.accent} border-transparent shadow-md`
                      : `${theme.pillBg} backdrop-blur-sm hover:bg-white/20`
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Qty + price + CTA */}
            <div className="flex items-center gap-3 sm:gap-4 ml-auto">
              {/* Qty */}
              <div className={`inline-flex items-center gap-2 rounded-full border ${theme.pillBg} backdrop-blur-sm px-1.5 py-1`}>
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

              {/* Price */}
              <span className="font-sans font-black text-2xl sm:text-3xl tracking-tight">
                ₹{displayPrice.toLocaleString("en-IN")}
              </span>

              {/* CTA */}
              <button
                onClick={() => onAddToCart(product._id, qty)}
                className={`${theme.accent} px-5 sm:px-7 py-3 rounded-full text-sm font-bold flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-transform`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Add to cart</span>
                <span className="sm:hidden">Buy</span>
              </button>

              {/* Low stock badge */}
              {product.stockStatus === "low-stock" && (
                <span className={`hidden sm:flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-400`}>
                  <Sparkles className="w-3 h-3" />
                  Low stock
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className={`absolute bottom-[5.5rem] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 ${theme.accentText} pointer-events-none`}
          style={{ opacity: 0.45 }}
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </div>

      {/* ── CINEMATIC SPECS BAND ─────────────────────────────────────── */}
      <SpecsBand product={product} theme={theme} />

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

// ── Cinematic specs band ──────────────────────────────────────────────────────

function SpecsBand({ product, theme }: { product: Product; theme: Theme }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const ghostX = useTransform(scrollYProgress, [0, 1], ["-8%", "4%"]);

  const specs = [
    product.origin && { label: "Origin", value: product.origin },
    product.roastLevel && { label: "Roast", value: product.roastLevel.replace("-", " ") },
    product.weight && { label: "Weight", value: product.weight },
    { label: "Type", value: product.type },
    { label: "Stock", value: product.stockStatus.replace("-", " ") },
    ...(product.tags.length > 0 ? [{ label: "Tags", value: product.tags.join(" · ") }] : []),
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div
      ref={ref}
      className="relative overflow-hidden py-20 sm:py-28"
      style={{ background: theme.bg }}
    >
      {/* Ambient */}
      <div className={`absolute inset-0 pointer-events-none ${theme.decorOpacity}`}>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[30rem] rounded-full bg-current blur-3xl opacity-50" />
      </div>

      {/* Ghost origin text — parallax */}
      {product.origin && (
        <motion.div
          style={{ x: ghostX }}
          className={`absolute inset-y-0 -left-8 flex items-center pointer-events-none select-none ${theme.fg}`}
          aria-hidden
        >
          <span
            className="font-sans font-black uppercase whitespace-nowrap"
            style={{
              fontSize: "clamp(6rem, 20vw, 18rem)",
              opacity: 0.045,
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            {product.origin}
          </span>
        </motion.div>
      )}

      <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-8 ${theme.fg}`}>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={`text-[10px] font-bold uppercase tracking-[0.4em] mb-10 ${theme.accentText}`}
        >
          Product details
        </motion.p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          {specs.map(({ label, value }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className="flex flex-col gap-2 p-5 sm:p-6"
              style={{ background: theme.bg }}
            >
              <span className={`text-[9px] font-bold uppercase tracking-[0.35em] ${theme.accentText}`}>{label}</span>
              <span className="font-sans font-black text-lg sm:text-xl capitalize leading-tight">{value}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Editorial story section ───────────────────────────────────────────────────

function StorySection({ product }: { product: Product }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lineWidth = useTransform(scrollYProgress, [0.1, 0.5], ["0%", "100%"]);

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
              className="text-natural-text/70 leading-relaxed text-lg sm:text-xl max-w-xl"
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
            {/* Rotated decorative name */}
            <div className="relative h-24 sm:h-32 overflow-hidden select-none" aria-hidden>
              <div
                className="absolute inset-0 flex items-center font-sans font-black uppercase text-natural-border leading-none"
                style={{ fontSize: "clamp(4rem, 10vw, 8rem)", letterSpacing: "-0.04em", whiteSpace: "nowrap" }}
              >
                {product.name}
              </div>
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
