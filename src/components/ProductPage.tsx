import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  MapPin,
  Coffee,
  Sparkles,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { SmartImage } from "./SmartImage";
import { asset } from "../lib/asset";
import type { Product } from "../types";

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
  onAddToCart: (name: string) => void;
}

interface Theme {
  bg: string;        // gradient background CSS
  fg: string;        // text color
  accent: string;    // CTA / chip background
  accentText: string;
  pillBg: string;    // soft pill bg for secondary chips
  shadow: string;
  decorOpacity: string;
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
  },
  "medium-dark": {
    bg: "radial-gradient(circle at 30% 20%, #8B5A3C 0%, #5A3A24 70%)",
    fg: "text-white",
    accent: "bg-orange-200 text-natural-text",
    accentText: "text-orange-100",
    pillBg: "bg-white/10 text-white border-white/20",
    shadow: "drop-shadow-[0_40px_60px_rgba(0,0,0,0.45)]",
    decorOpacity: "opacity-[0.14]",
  },
  medium: {
    bg: "radial-gradient(circle at 30% 20%, #D4A56A 0%, #A47148 70%)",
    fg: "text-natural-text",
    accent: "bg-natural-text text-white",
    accentText: "text-natural-text/70",
    pillBg: "bg-white/40 text-natural-text border-natural-text/15",
    shadow: "drop-shadow-[0_40px_60px_rgba(60,30,15,0.35)]",
    decorOpacity: "opacity-[0.18]",
  },
  light: {
    bg: "radial-gradient(circle at 30% 20%, #F5E6CC 0%, #E2C896 70%)",
    fg: "text-natural-text",
    accent: "bg-natural-text text-white",
    accentText: "text-natural-text/70",
    pillBg: "bg-white/60 text-natural-text border-natural-text/15",
    shadow: "drop-shadow-[0_40px_60px_rgba(80,50,20,0.25)]",
    decorOpacity: "opacity-[0.2]",
  },
  bags: {
    bg: "radial-gradient(circle at 30% 20%, #E8D5B7 0%, #C4A57B 70%)",
    fg: "text-natural-text",
    accent: "bg-natural-text text-white",
    accentText: "text-natural-text/70",
    pillBg: "bg-white/60 text-natural-text border-natural-text/15",
    shadow: "drop-shadow-[0_40px_60px_rgba(80,50,20,0.25)]",
    decorOpacity: "opacity-[0.2]",
  },
  merch: {
    bg: "radial-gradient(circle at 30% 20%, #D9D1C7 0%, #A89F95 70%)",
    fg: "text-natural-text",
    accent: "bg-natural-text text-white",
    accentText: "text-natural-text/70",
    pillBg: "bg-white/60 text-natural-text border-natural-text/15",
    shadow: "drop-shadow-[0_40px_60px_rgba(60,50,40,0.3)]",
    decorOpacity: "opacity-[0.18]",
  },
};

function themeFor(p: Product): Theme {
  if (p.roastLevel && THEMES[p.roastLevel]) return THEMES[p.roastLevel];
  if (THEMES[p.type]) return THEMES[p.type];
  return THEMES.medium;
}

export function ProductPage({ productId, onAddToCart }: ProductPageProps) {
  const products = useQuery(api.products.list);
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState<string>("250g");

  // Scroll container — product page scrolls inside its own div (not window)
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll progress for the hero section (parallax)
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    container: containerRef,
    offset: ["start start", "end start"],
  });
  // Page-level progress for the story section + related grid parallax
  const storyRef = useRef<HTMLElement>(null);
  const { scrollYProgress: storyProgress } = useScroll({
    target: storyRef,
    container: containerRef,
    offset: ["start end", "end start"],
  });

  // Hero parallax bands
  const heroImageY = useTransform(heroProgress, [0, 1], ["0%", "-30%"]);
  const heroImageScale = useTransform(heroProgress, [0, 1], [1, 1.12]);
  const heroTitleY = useTransform(heroProgress, [0, 1], [0, -120]);
  const heroTitleOpacity = useTransform(heroProgress, [0, 0.7], [1, 0]);
  const heroSideY = useTransform(heroProgress, [0, 1], [0, -60]);
  const heroOrb1Y = useTransform(heroProgress, [0, 1], ["0%", "-50%"]);
  const heroOrb2Y = useTransform(heroProgress, [0, 1], ["0%", "40%"]);

  // Story-section parallax
  const storyTitleY = useTransform(storyProgress, [0, 1], [40, -40]);
  const storyAsideY = useTransform(storyProgress, [0, 1], [80, -40]);

  const product = useMemo(
    () => products?.find((p) => p._id === productId) ?? null,
    [products, productId]
  );

  // Scroll to top on enter & on product change
  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [productId]);

  if (products === undefined) {
    return (
      <div className="h-full flex items-center justify-center bg-natural-bg">
        <div className="text-natural-text/50 text-sm tracking-widest uppercase">Loading…</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-full flex items-center justify-center bg-natural-bg px-6 text-center">
        <div className="space-y-4">
          <p className="text-natural-text/50 uppercase tracking-widest text-xs font-bold">
            Product not found
          </p>
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
  const variants = product.type === "beans"
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
    const url = new URL(window.location.href);
    url.searchParams.delete("product");
    window.history.pushState({}, "", url.toString());
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const goToProduct = (id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("product", id);
    window.history.pushState({}, "", url.toString());
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div ref={containerRef} className="h-full overflow-y-auto scrollbar-hide bg-natural-bg">
      {/* ── Hero panel (image 4 style) ─────────────────────────── */}
      <section
        ref={heroRef}
        className={`relative overflow-hidden ${theme.fg}`}
        style={{ background: theme.bg }}
      >
        {/* Decorative blur orbs — drift on scroll */}
        <div className={`absolute inset-0 pointer-events-none ${theme.decorOpacity}`}>
          <motion.div
            style={{ y: heroOrb1Y, willChange: "transform" }}
            className="absolute -left-10 top-20 w-72 h-72 rounded-full bg-current blur-3xl"
          />
          <motion.div
            style={{ y: heroOrb2Y, willChange: "transform" }}
            className="absolute right-10 bottom-10 w-96 h-96 rounded-full bg-current blur-3xl"
          />
        </div>

        {/* Top nav strip */}
        <div className="relative z-10 max-w-7xl mx-auto px-8 pt-8 flex items-center justify-between">
          <button
            onClick={goHome}
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] ${theme.fg} opacity-80 hover:opacity-100 transition-opacity`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <img src={asset("logo.png")} alt="" className="h-9 w-auto opacity-90" />
          </div>
        </div>

        {/* Main hero grid */}
        <div className="relative z-10 max-w-7xl mx-auto px-8 pt-10 pb-24 grid grid-cols-1 lg:grid-cols-[1.05fr_1.2fr_1fr] gap-10 items-center">
          {/* LEFT — name + tagline */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            style={{ y: heroTitleY, opacity: heroTitleOpacity, willChange: "transform, opacity" }}
            className="space-y-6"
          >
            <span className={`text-[10px] font-bold uppercase tracking-[0.35em] ${theme.accentText}`}>
              {product.category}
            </span>
            <h1 className="font-serif font-bold text-5xl md:text-6xl leading-[0.95] tracking-tight">
              {product.name}
            </h1>
            {product.weight && (
              <p className={`text-sm font-medium ${theme.accentText}`}>{product.weight}</p>
            )}
            {product.origin && (
              <div className={`inline-flex items-center gap-2 text-sm font-medium ${theme.accentText}`}>
                <MapPin className="w-4 h-4" />
                {product.origin}
              </div>
            )}
          </motion.div>

          {/* CENTER — product shot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, type: "spring", stiffness: 90, damping: 18 }}
            className="relative flex items-center justify-center"
          >
            <motion.div
              style={{ y: heroImageY, scale: heroImageScale, willChange: "transform" }}
              className={`relative w-full max-w-md aspect-square ${theme.shadow}`}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="w-full h-full"
              >
                <SmartImage
                  src={product.imageUrl}
                  blur={product.imageBlur}
                  alt={product.name}
                  className="object-contain"
                  wrapperClassName="w-full h-full"
                  priority
                />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* RIGHT — variant chips + overview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ y: heroSideY, willChange: "transform" }}
            className="space-y-6"
          >
            <div className="flex flex-wrap gap-2 justify-end">
              {variants.map((v) => {
                const active = v === variant;
                return (
                  <button
                    key={v}
                    onClick={() => setVariant(v)}
                    className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all border ${
                      active
                        ? `${theme.accent} border-transparent shadow-md`
                        : `${theme.pillBg} backdrop-blur-sm hover:bg-white/20`
                    }`}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
            <div className="text-right space-y-1">
              <div className={`text-[10px] font-bold uppercase tracking-[0.3em] ${theme.accentText}`}>
                Overview · Brew · Tasting
              </div>
              {product.rating !== undefined && (
                <div className="flex items-center justify-end gap-1.5">
                  <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span className="text-sm font-bold">{product.rating.toFixed(1)}</span>
                  <span className={`text-xs ${theme.accentText}`}>({product.reviewCount ?? 0})</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom action strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative z-10 max-w-7xl mx-auto px-8 pb-12 flex flex-col md:flex-row items-end md:items-center justify-between gap-6"
        >
          <p className={`max-w-md text-sm ${theme.accentText}`}>
            Crafted by our master roasters in small batches. Sourced directly from
            partner farms across India.
          </p>

          {/* Price + qty + buy */}
          <div className="flex items-center gap-6 flex-wrap justify-end">
            <span className="font-serif font-bold text-4xl">
              ₹{displayPrice.toLocaleString("en-IN")}
            </span>
            <div className={`flex items-center gap-3 rounded-full border ${theme.pillBg} backdrop-blur-sm px-2 py-1`}>
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold w-6 text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => {
                for (let i = 0; i < qty; i++) onAddToCart(product.name);
              }}
              className={`${theme.accent} px-7 py-3.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-transform`}
            >
              <ShoppingCart className="w-4 h-4" />
              Buy now
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── Tasting notes & details ────────────────────────────── */}
      <section
        ref={storyRef}
        className="max-w-7xl mx-auto px-8 py-24 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-16"
      >
        <motion.div style={{ y: storyTitleY, willChange: "transform" }} className="space-y-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-accent mb-3">
              The story
            </p>
            <h2 className="font-serif font-bold text-4xl mb-4">A daily ritual, perfected.</h2>
            <p className="text-natural-text/70 leading-relaxed text-lg">
              {product.description}
            </p>
          </div>

          {product.flavorNotes.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-accent mb-3">
                Flavor notes
              </p>
              <div className="flex flex-wrap gap-2">
                {product.flavorNotes.map((note) => (
                  <span
                    key={note}
                    className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-natural-paper border border-natural-border"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <motion.aside
          style={{ y: storyAsideY, willChange: "transform" }}
          className="space-y-6 bg-natural-paper border border-natural-border rounded-3xl p-8"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-accent">
            Specifications
          </p>
          <Spec label="Category" value={product.category} />
          {product.roastLevel && (
            <Spec label="Roast" value={`${product.roastLevel}`.replace("-", " ")} />
          )}
          {product.origin && <Spec label="Origin" value={product.origin} />}
          {product.weight && <Spec label="Weight" value={product.weight} />}
          <Spec label="Stock" value={product.stockStatus.replace("-", " ")} />
          <Spec label="Tags" value={product.tags.join(", ") || "—"} />
        </motion.aside>
      </section>

      {/* ── You might also love ────────────────────────────────── */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-8 pb-32">
          <div className="flex items-end justify-between border-b border-natural-border pb-8 mb-10">
            <h3 className="font-serif font-bold text-3xl">You might also love</h3>
            <button
              onClick={goHome}
              className="text-xs font-bold uppercase tracking-widest text-natural-accent border-b border-natural-accent/30 pb-1"
            >
              Shop all
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((p) => (
              <button
                key={p._id}
                onClick={() => goToProduct(p._id)}
                className="text-left group space-y-3"
              >
                <div className="aspect-square bg-natural-paper border border-natural-border rounded-3xl overflow-hidden group-hover:shadow-xl group-hover:-translate-y-1 transition-all">
                  <SmartImage
                    src={p.imageUrl}
                    blur={p.imageBlur}
                    alt={p.name}
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    wrapperClassName="w-full h-full"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight">{p.name}</h4>
                  <p className="text-natural-accent font-bold text-sm mt-1">
                    ₹{p.price.toLocaleString("en-IN")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
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
