import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  MapPin,
  Sparkles,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { PRODUCT_PERSONALITIES } from "../../convex/productContext";
import { SmartImage } from "./SmartImage";
import { PersonalitySection } from "./PersonalitySection";
import { slugify } from "../lib/slug";
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
  onAddToCart: (productId: string, qty: number) => void;
  onOpenCart?: () => void;
  cartCount?: number;
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

export function ProductPage({ productId, onAddToCart, onOpenCart, cartCount = 0 }: ProductPageProps) {
  const products = useQuery(api.products.list);
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState<string>("250g");
  const containerRef = useRef<HTMLDivElement>(null);

  const product = useMemo(
    () => products?.find((p) => p._id === productId) ?? null,
    [products, productId]
  );

  useEffect(() => {
    setVariant("250g");
    setQty(1);
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
    const url = new URL(window.location.href);
    url.searchParams.delete("product");
    window.history.pushState({}, "", url.toString());
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const goToProduct = (slug: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("product", slug);
    window.history.pushState({}, "", url.toString());
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen"
      style={{ background: theme.bg }}
    >
      {/* ── Hero — full viewport, all info without scrolling ─────────── */}
      <div
        className={`relative overflow-hidden ${theme.fg} flex flex-col`}
        style={{ minHeight: "100dvh", paddingTop: "clamp(56px,8vw,80px)" }}
      >
        {/* Decorative blur orbs */}
        <div className={`absolute inset-0 pointer-events-none ${theme.decorOpacity}`}>
          <div className="absolute -left-16 top-1/4 w-72 h-72 rounded-full bg-current blur-3xl" />
          <div className="absolute right-0 bottom-0 w-96 h-96 rounded-full bg-current blur-3xl" />
        </div>

        {/* Back button + category strip */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 pt-2 pb-1 flex items-center justify-between">
          <button
            onClick={goHome}
            className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.25em] ${theme.fg} opacity-70 hover:opacity-100 transition-opacity`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <span className={`text-[10px] font-bold uppercase tracking-[0.35em] ${theme.accentText}`}>
            {product.category}
          </span>

        </div>

        {/* Main 3-col grid — expands to fill remaining viewport */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1.15fr_1fr] gap-4 lg:gap-6 items-center py-2 lg:py-3">

          {/* LEFT — product identity */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3 lg:space-y-4"
          >
            <h1 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl leading-[0.95] tracking-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 flex-wrap">
              {product.origin && (
                <span className={`flex items-center gap-1.5 text-xs font-medium ${theme.accentText}`}>
                  <MapPin className="w-3.5 h-3.5" />
                  {product.origin}
                </span>
              )}
              {product.weight && (
                <span className={`text-xs font-medium ${theme.accentText}`}>{product.weight}</span>
              )}
            </div>

            {/* Rating — visible on mobile (hidden on desktop, shown in right col) */}
            {product.rating !== undefined && (
              <div className="flex items-center gap-1.5 lg:hidden">
                <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span className="text-sm font-bold">{product.rating.toFixed(1)}</span>
                <span className={`text-xs ${theme.accentText}`}>({product.reviewCount ?? 0} reviews)</span>
              </div>
            )}

            <p className={`text-sm leading-relaxed ${theme.accentText} line-clamp-3`}>
              {product.description}
            </p>

            {product.flavorNotes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.flavorNotes.map((note) => (
                  <span
                    key={note}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${theme.pillBg} backdrop-blur-sm`}
                  >
                    {note}
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          {/* CENTER — 3D rotating product */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, type: "spring", stiffness: 90, damping: 18 }}
            className="flex items-center justify-center"
          >
            <div
              className={`relative ${theme.shadow}`}
              style={{
                perspective: "1200px",
                width: "clamp(200px, 30vw, 380px)",
                height: "clamp(200px, 30vw, 380px)",
              }}
            >
              <motion.div
                animate={{ rotateY: 360 }}
                transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                style={{ transformStyle: "preserve-3d", willChange: "transform" }}
                className="relative w-full h-full"
              >
                {/* Front face */}
                <div
                  style={{ backfaceVisibility: "hidden" }}
                  className="absolute inset-0"
                >
                  <SmartImage
                    src={product.imageUrl}
                    blur={product.imageBlur}
                    alt={product.name}
                    className="object-contain"
                    wrapperClassName="w-full h-full"
                    priority
                  />
                </div>
                {/* Back face — same image, facing opposite direction */}
                <div
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  className="absolute inset-0"
                  aria-hidden
                >
                  <SmartImage
                    src={product.imageUrl}
                    blur={product.imageBlur}
                    alt=""
                    className="object-contain scale-x-[-1]"
                    wrapperClassName="w-full h-full"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* RIGHT — purchase controls */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4 lg:space-y-5"
          >
            {/* Variant selector */}
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-2 ${theme.accentText}`}>Size</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v}
                    onClick={() => setVariant(v)}
                    className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide border transition-all ${
                      v === variant
                        ? `${theme.accent} border-transparent shadow-md`
                        : `${theme.pillBg} backdrop-blur-sm hover:bg-white/20`
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs label */}
            <p className={`text-[10px] font-bold uppercase tracking-[0.3em] ${theme.accentText}`}>
              Overview · Brew · Tasting
            </p>

            {/* Rating — desktop only */}
            {product.rating !== undefined && (
              <div className="hidden lg:flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span className="text-sm font-bold">{product.rating.toFixed(1)}</span>
                <span className={`text-xs ${theme.accentText}`}>({product.reviewCount ?? 0} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-1 ${theme.accentText}`}>Price</p>
              <span className="font-serif font-bold text-4xl">
                ₹{displayPrice.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Qty stepper */}
            <div className={`inline-flex items-center gap-3 rounded-full border ${theme.pillBg} backdrop-blur-sm px-2 py-1`}>
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold w-6 text-center text-sm">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Buy CTA */}
            <button
              onClick={() => onAddToCart(product._id, qty)}
              className={`w-full ${theme.accent} px-6 py-3.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-transform`}
            >
              <ShoppingCart className="w-4 h-4" />
              Buy now
            </button>

            {/* Stock indicator */}
            {product.stockStatus === "low-stock" && (
              <p className={`text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5`}>
                <Sparkles className="w-3.5 h-3.5" />
                Limited stock
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Coffee Personality — parallax, illustrated ─────────────── */}
      {personality && (
        <PersonalitySection
          personality={personality}
          productName={product.name}
          accentHex={theme.accentHex}
        />
      )}

      {/* ── Story & specs — below-fold detail ────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-12 sm:gap-16">
        <div className="space-y-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-accent mb-3">The story</p>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl mb-4">A daily ritual, perfected.</h2>
            <p className="text-natural-text/70 leading-relaxed text-lg">{product.description}</p>
          </div>
          {product.flavorNotes.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-accent mb-3">Flavor notes</p>
              <div className="flex flex-wrap gap-2">
                {product.flavorNotes.map((note) => (
                  <span key={note} className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-natural-paper border border-natural-border">
                    {note}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <aside className="space-y-6 bg-natural-paper border border-natural-border rounded-3xl p-8 h-fit">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-accent">Specifications</p>
          <Spec label="Category" value={product.category} />
          {product.roastLevel && <Spec label="Roast" value={product.roastLevel.replace("-", " ")} />}
          {product.origin && <Spec label="Origin" value={product.origin} />}
          {product.weight && <Spec label="Weight" value={product.weight} />}
          <Spec label="Stock" value={product.stockStatus.replace("-", " ")} />
          {product.tags.length > 0 && <Spec label="Tags" value={product.tags.join(", ")} />}
        </aside>
      </section>

      {/* ── Related products ─────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-28 sm:pb-20">
          <div className="flex items-end justify-between border-b border-natural-border pb-8 mb-10">
            <h3 className="font-serif font-bold text-2xl sm:text-3xl">You might also love</h3>
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
                <div className="aspect-square bg-natural-paper border border-natural-border rounded-3xl overflow-hidden group-hover:shadow-xl group-hover:-translate-y-1 transition-all">
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
