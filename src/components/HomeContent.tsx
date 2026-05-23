"use client";
import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useMotionValueEvent,
  useInView,
  type MotionValue,
} from "motion/react";
import {
  ShoppingCart,
  Star,
  Coffee,
  ArrowRight,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useProducts } from "../lib/useProducts";
import { useStoryContent } from "../lib/useStoryContent";
import { useBannerSlides, useHeroContent, useSectionsContent, useChapters } from "../lib/useSiteContent";
import { DataBanner } from "./DataBanner";
import { DiscoveryWidget } from "./widget/DiscoveryWidget";
import { LoadingScreen } from "./LoadingScreen";
import { SmartImage } from "./SmartImage";
import { useCart } from "../context/CartContext";
import { useDiscount } from "../context/DiscountContext";
import { useToast } from "../context/ToastContext";
import { useCartPanel } from "../context/CartPanelContext";
import { SiteFooter } from "./SiteFooter";
import { GalaxySweep } from "./GalaxySweepLazy";
import { SmoothScroll } from "./SmoothScroll";
import { CinematicHero, CurtainTransition, ChapterDeck } from "./Cinematic";
import type { ChapterConfig } from "./Cinematic";
import { MorphingHeader, useActiveSection, NAV_ITEMS } from "./MorphingHeader";
import { asset } from "../lib/asset";
import { hrefForNavTarget } from "../lib/navigation";
import { slugify } from "../lib/slug";
import type { Product } from "../types";
import { resolveTaxonomy } from "../types";

// -- Scroll helper ----------------------------------------------
function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const lenis = (window as any).__lenis;
  if (lenis) {
    const top = Math.round(el.getBoundingClientRect().top + window.scrollY);
    lenis.scrollTo(top, { duration: 1.0, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
    return;
  }
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}


// -- ScrollReveal — fade + lift sections into view on scroll ----
function ScrollReveal({
  children,
  delay = 0,
  y = 40,
  className = "",
  id,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  return (
    <motion.div
      id={id}
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// -- Scroll progress bar ---------------------------------------
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-natural-accent origin-left z-[60]"
      style={{ scaleX }}
    />
  );
}

// -- Hero banner 1 — Schweppes Fizz ----------------------------
function FizzBanner() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(/banner-schweppes.png)` }}
      />
      <div className="absolute inset-0 bg-linear-to-r from-[#1a3a8a]/85 via-[#2a4fa5]/55 to-[#ff6fa4]/40" />
      <div className="relative z-10 h-full flex flex-col justify-center px-8 sm:px-14 text-white">
        <p className="text-[10px] sm:text-xs font-bold tracking-[0.45em] uppercase text-amber-200/90 mb-4">
          THIRD WAVE × Schweppes
        </p>
        <h3 className="font-serif font-black leading-[0.9] tracking-tight text-[clamp(2.5rem,7vw,6rem)]">
          FIND YOUR
          <br />
          <span className="italic text-amber-200">FIZZ.</span>
        </h3>
        <p className="mt-5 text-base sm:text-xl font-light tracking-wide text-white/90 max-w-md">
          Espresso Tonics have arrived.
        </p>
        <div className="mt-6 inline-flex w-fit items-center gap-3 px-5 py-2.5 rounded-full border border-white/40 backdrop-blur-sm">
          <span className="text-[10px] font-bold tracking-[0.35em] uppercase">In stores now</span>
        </div>
      </div>
    </div>
  );
}

// -- Hero banner 2 — Third Rush Desserts ----------------------
function DessertsBanner() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(/banner-third-rush.jpg)` }}
      />
      <div className="absolute inset-0 bg-linear-to-r from-[#d63384]/85 via-[#e84393]/55 to-[#5a0f3a]/55" />
      <div className="relative z-10 h-full flex flex-col justify-center px-8 sm:px-14 text-white">
        <p className="text-[10px] sm:text-xs font-bold tracking-[0.45em] uppercase text-amber-100/90 mb-4">
          THIRD WAVE × Third Rush Desserts
        </p>
        <h3 className="font-serif font-black leading-[0.9] tracking-tight text-[clamp(2.2rem,6vw,5.2rem)]">
          WIDE RANGE TO
          <br />
          <span className="italic">CHOOSE FROM.</span>
        </h3>
        <p className="mt-5 text-sm sm:text-base font-light tracking-wider text-white/85 max-w-xl">
          Tres Leches · Cheesecakes · Tarts &amp; Pie · Cookies · Brownies
        </p>
        <div className="mt-6 inline-flex w-fit items-center gap-3 px-5 py-2.5 rounded-full border border-white/40 backdrop-blur-sm">
          <span className="text-[10px] font-bold tracking-[0.35em] uppercase">
            Available in select Bangalore stores
          </span>
        </div>
      </div>
    </div>
  );
}

// -- Mobile bottom nav pill ------------------------------------
function MobileBottomNav({
  onOpenTI,
  onOpenCart,
  onNavTo,
  cartCount = 0,
}: {
  onOpenTI: (e: React.MouseEvent) => void;
  onOpenCart: () => void;
  onNavTo: (target: string) => void;
  cartCount?: number;
}) {
  const active = useActiveSection();
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-3 mb-3 pointer-events-auto"
      >
        <div className="flex items-center justify-around glass-strong rounded-2xl px-1 py-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavTo(item.target)}
              aria-label={item.label}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[3rem] transition-colors ${
                active === item.key ? "text-white" : "text-natural-text/55"
              }`}
            >
              {active === item.key && (
                <motion.span
                  layoutId="mobile-nav-active"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-natural-accent shadow-md shadow-natural-accent/30"
                />
              )}
              <item.Icon className="relative z-10 w-5 h-5" />
              <span className="relative z-10 text-[9px] font-bold uppercase tracking-wide leading-none">
                {item.label.split(" ")[0]}
              </span>
            </button>
          ))}
          {/* Cart */}
          <button
            onClick={onOpenCart}
            aria-label="Cart"
            className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[3rem] text-natural-text/55"
          >
            <span className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[1rem] h-4 bg-natural-accent text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wide leading-none">Cart</span>
          </button>
          {/* TI */}
          <button
            onClick={onOpenTI}
            aria-label="Third Intelligence"
            className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[3rem] text-natural-text/55"
          >
            <span className="relative w-5 h-5 flex items-center justify-center">
              <motion.span
                animate={{ scale: [1, 1.55], opacity: [0.55, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", repeatDelay: 0.1 }}
                style={{ willChange: "transform, opacity" }}
                className="absolute inset-0 rounded-full bg-natural-accent/40"
              />
              <img
                src={asset("third-intelligence-icon.png")}
                alt=""
                className="relative z-10 w-5 h-5 object-contain"
              />
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wide leading-none">AI</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// -- Product Card -----------------------------------------------
function ProductCard({
  product,
  onAddToCart,
  imageParallaxX,
}: {
  product: Product;
  onAddToCart: (name: string) => void;
  imageParallaxX?: MotionValue<number>;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 180, damping: 22 });
  const sy = useSpring(my, { stiffness: 180, damping: 22 });
  const rotateY = useTransform(sx, [-1, 1], [-7, 7]);
  const rotateX = useTransform(sy, [-1, 1], [5, -5]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
      className="group space-y-5 preserve-3d"
    >
      <div
        className="aspect-[4/5] glass-card rounded-[2rem] overflow-hidden group-hover:shadow-2xl transition-all group-hover:-translate-y-1 relative preserve-3d cursor-pointer"
        style={{ transform: "translateZ(20px)" }}
        onClick={() => router.push("/products/" + slugify(product.name))}
      >
        {imageParallaxX ? (
          <motion.div
            className="absolute inset-y-0"
            style={{ width: "150%", left: "-25%", x: imageParallaxX, willChange: "transform" }}
          >
            <SmartImage
              src={product.imageUrl}
              blur={product.imageBlur}
              alt={product.name}
              className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
              wrapperClassName="w-full h-full"
            />
          </motion.div>
        ) : (
          <SmartImage
            src={product.imageUrl}
            blur={product.imageBlur}
            alt={product.name}
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
            wrapperClassName="absolute inset-0"
          />
        )}
        <div
          onClick={(e) => { e.stopPropagation(); onAddToCart(product.name); }}
          className="absolute top-5 right-5 bg-white/90 backdrop-blur p-3 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 cursor-pointer hover:bg-natural-accent hover:text-white"
        >
          <ShoppingCart className="w-5 h-5" />
        </div>
        {product.stockStatus === "low-stock" && (
          <div className="absolute top-5 left-5 bg-amber-500/90 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
            Limited
          </div>
        )}
        {product.roastLevel && (
          <div className="absolute bottom-5 left-5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
            {product.roastLevel} roast
          </div>
        )}
      </div>
      <div className="space-y-2 px-1">
        <div className="flex items-start justify-between gap-2">
          <h4
            className="text-lg font-bold leading-tight cursor-pointer hover:text-natural-accent transition-colors"
            onClick={() => router.push("/products/" + slugify(product.name))}
          >
            {product.name}
          </h4>
          <span className="text-lg font-extrabold text-natural-accent whitespace-nowrap">
            ?{product.price.toLocaleString("en-IN")}
          </span>
        </div>
        {product.origin && (
          <p className="text-xs text-natural-text/50 flex items-center gap-1 font-medium">
            <MapPin className="w-3 h-3" />
            {product.origin}
          </p>
        )}
        {product.flavorNotes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {product.flavorNotes.slice(0, 3).map((note) => (
              <span
                key={note}
                className="px-2.5 py-1 bg-natural-muted rounded-full text-[10px] font-bold uppercase tracking-wider text-natural-text/60"
              >
                {note}
              </span>
            ))}
          </div>
        )}
        {product.rating && (
          <div className="flex items-center gap-1.5 pt-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-natural-text/40">({product.reviewCount})</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// -- Horizontal Card --------------------------------------------
function HorizontalCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (name: string) => void;
}) {
  const router = useRouter();
  return (
    <div className="group flex flex-col md:flex-row glass-card rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1 md:h-56">
      <div className="w-full md:w-56 h-48 md:h-full shrink-0 overflow-hidden bg-natural-muted">
        <SmartImage
          src={product.imageUrl}
          blur={product.imageBlur}
          alt={product.name}
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          wrapperClassName="w-full h-full"
        />
      </div>
      <div className="flex-1 p-6 flex flex-col justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-natural-accent">
            {product.category}
          </span>
          <h4
            className="text-xl font-bold mt-1 line-clamp-1 cursor-pointer hover:text-natural-accent transition-colors"
            onClick={() => router.push("/products/" + slugify(product.name))}
          >
            {product.name}
          </h4>
          <p className="text-sm text-natural-text/60 mt-2 line-clamp-2">{product.description}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-extrabold">
            ?{product.price.toLocaleString("en-IN")}
          </span>
          <button
            onClick={() => onAddToCart(product.name)}
            className="bg-natural-text text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-natural-accent transition-colors active:scale-95 flex items-center gap-2"
          >
            Add to Cart
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// -- Horizontal scroll product row -----------------------------
const HSCROLL_CARD_STRIDE = 276;

function HScrollRow({
  products,
  onAddToCart,
}: {
  products: Product[];
  onAddToCart: (name: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const lastFrameRef = useRef(0);
  const currentLeftRef = useRef(0);
  const targetLeftRef = useRef(0);
  const [canStepBack, setCanStepBack] = useState(false);
  const [canStepForward, setCanStepForward] = useState(false);
  const scrollX = useMotionValue(0);
  const viewportW = useMotionValue(0);

  const updateArrowState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = currentLeftRef.current;
    setCanStepBack(left > 1);
    setCanStepForward(left < max - 1);
  }, []);

  const setScrollLeft = useCallback((value: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const next = Math.min(max, Math.max(0, value));
    currentLeftRef.current = next;
    targetLeftRef.current = next;
    el.scrollLeft = next;
    scrollX.set(next);
    updateArrowState();
  }, [scrollX, updateArrowState]);

  const animateToTarget = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    lastFrameRef.current = performance.now();
    const tick = (now: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const max = Math.max(0, el.scrollWidth - el.clientWidth);
      targetLeftRef.current = Math.min(max, Math.max(0, targetLeftRef.current));

      const dt = Math.min(48, now - lastFrameRef.current);
      lastFrameRef.current = now;
      const current = currentLeftRef.current;
      const target = targetLeftRef.current;
      const alpha = 1 - Math.exp(-dt / 58);
      const next = current + (target - current) * alpha;

      if (Math.abs(target - next) < 0.35) {
        setScrollLeft(target);
        rafRef.current = 0;
        return;
      }

      currentLeftRef.current = next;
      el.scrollLeft = next;
      scrollX.set(next);
      updateArrowState();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [scrollX, setScrollLeft, updateArrowState]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (rafRef.current) return;
      currentLeftRef.current = el.scrollLeft;
      targetLeftRef.current = el.scrollLeft;
      scrollX.set(el.scrollLeft);
      updateArrowState();
    };
    const onResize = () => {
      viewportW.set(el.clientWidth);
      setScrollLeft(currentLeftRef.current);
      updateArrowState();
    };
    currentLeftRef.current = el.scrollLeft;
    targetLeftRef.current = el.scrollLeft;
    scrollX.set(el.scrollLeft);
    onResize();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [scrollX, setScrollLeft, updateArrowState, viewportW]);

  const stepProducts = useCallback((direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.max(HSCROLL_CARD_STRIDE, el.clientWidth * 0.82);
    targetLeftRef.current = currentLeftRef.current + direction * step;
    animateToTarget();
  }, [animateToTarget]);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-5 overflow-hidden pb-4 select-none
                   -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-12 md:px-12
                   [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        data-lenis-prevent
      >
        {products.map((p, i) => (
          <HScrollCard
            key={p._id}
            product={p}
            index={i}
            scrollX={scrollX}
            viewportW={viewportW}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous products"
          onClick={() => stepProducts(-1)}
          disabled={!canStepBack}
          className="pointer-events-auto ml-1 sm:-ml-2 md:-ml-6 h-11 w-11 rounded-full glass-strong text-natural-text shadow-lg transition-all hover:-translate-x-0.5 hover:bg-natural-paper disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-5 h-5 mx-auto" />
        </button>
        <button
          type="button"
          aria-label="Next products"
          onClick={() => stepProducts(1)}
          disabled={!canStepForward}
          className="pointer-events-auto mr-1 sm:-mr-2 md:-mr-6 h-11 w-11 rounded-full glass-strong text-natural-text shadow-lg transition-all hover:translate-x-0.5 hover:bg-natural-paper disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronRight className="w-5 h-5 mx-auto" />
        </button>
      </div>
    </div>
  );
}

function HScrollCard({
  product,
  index,
  scrollX,
  viewportW,
  onAddToCart,
}: {
  product: Product;
  index: number;
  scrollX: MotionValue<number>;
  viewportW: MotionValue<number>;
  onAddToCart: (name: string) => void;
}) {
  const imageX = useTransform([scrollX, viewportW] as const, ([sl, vw]) => {
    const cardCentre = index * HSCROLL_CARD_STRIDE + HSCROLL_CARD_STRIDE / 2;
    const viewCentre = (sl as number) + (vw as number) / 2;
    return (cardCentre - viewCentre) * 0.055;
  });
  return (
    <div className="flex-shrink-0 w-48 sm:w-56 md:w-64">
      <ProductCard product={product} onAddToCart={onAddToCart} imageParallaxX={imageX} />
    </div>
  );
}

// -- Catalog parallax banner ------------------------------------
function CatalogBanner({ eyebrow, title }: { eyebrow?: string; title?: string }) {
  const eyebrowText = eyebrow ?? "The Collection";
  const t = title ?? "Choose your\nritual.";
  const [titleHead, titleTail] = (() => {
    const parts = t.split(/\n/);
    if (parts.length >= 2) return [parts[0], parts.slice(1).join(" ")];
    const words = t.trim().split(/\s+/);
    if (words.length <= 1) return [t, ""];
    return [words.slice(0, -1).join(" "), words[words.length - 1]];
  })();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const wordmarkY = useTransform(scrollYProgress, [0, 1], ["30%", "-30%"]);
  const headingY = useTransform(scrollYProgress, [0, 1], ["18%", "-18%"]);
  const subY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [0, 1, 1, 0]);
  const bgY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  return (
    <div ref={ref} className="relative overflow-hidden" style={{ perspective: "600px" }}>
      <motion.div
        style={{ y: bgY }}
        className="absolute -inset-y-[15%] inset-x-0 bg-[#1A0F08] pointer-events-none"
      />
      <motion.div
        style={{ y: wordmarkY }}
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center pointer-events-none select-none overflow-hidden"
      >
        <span className="font-serif font-black text-[clamp(5rem,20vw,18rem)] leading-none tracking-tight text-white/[0.05]">
          COLLECTION
        </span>
      </motion.div>
      <motion.div style={{ opacity }} className="relative py-24 sm:py-32 px-4 sm:px-6 md:px-12">
        <motion.div style={{ y: headingY }} className="text-center max-w-3xl mx-auto">
          <motion.span
            style={{ y: subY }}
            className="inline-flex items-center gap-3 text-[10px] font-bold tracking-[0.45em] uppercase text-amber-300/80"
          >
            <span className="h-px w-8 bg-amber-300/30" />
            {eyebrowText}
            <span className="h-px w-8 bg-amber-300/30" />
          </motion.span>
          <h2 className="font-serif font-black text-4xl sm:text-5xl md:text-7xl leading-[0.95] mt-5 tracking-tight text-white">
            {titleHead}
            {titleTail ? <br /> : null}
            {titleTail ? (
              <em className="font-serif italic font-light text-amber-200/80">{titleTail}</em>
            ) : null}
          </h2>
          <motion.p
            style={{ y: subY }}
            className="text-white/55 mt-6 text-base sm:text-lg max-w-md mx-auto leading-relaxed"
          >
            Every coffee, every bag, every cup — handpicked by our master roasters.
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}

// -- Bento tile -------------------------------------------------
type BentoTileData = {
  title: string;
  target: string;
  items: Product[];
  span: string;
  accent: string;
};

function BentoTile({
  tile,
  onClick,
  tall = false,
}: {
  tile: BentoTileData;
  onClick: () => void;
  tall?: boolean;
}) {
  const heroProduct = tile.items[0];
  const samples = tile.items.slice(1, tall ? 4 : 3);
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden ${
        tall ? "rounded-3xl" : "rounded-2xl sm:rounded-3xl"
      } text-left transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 w-full h-full ${
        tall ? "min-h-105" : "min-h-40"
      } flex flex-col`}
    >
      {heroProduct ? (
        <SmartImage
          src={heroProduct.imageUrl}
          blur={heroProduct.imageBlur}
          alt={tile.title}
          className="object-cover transition-transform duration-[1.4s] group-hover:scale-105"
          wrapperClassName="absolute inset-0"
        />
      ) : (
        <div className={`absolute inset-0 bg-linear-to-br ${tile.accent}`} />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-black/10" />
      {samples.length > 0 && (
        <div className="absolute top-3 right-3 flex -space-x-2 z-10">
          {samples.map((p, idx) => (
            <div
              key={p._id}
              className="w-9 h-9 rounded-xl bg-white/90 border-2 border-white shadow-md overflow-hidden"
              style={{ zIndex: samples.length - idx }}
            >
              <SmartImage
                src={p.imageUrl}
                blur={p.imageBlur}
                alt=""
                className="object-cover"
                wrapperClassName="w-full h-full"
              />
            </div>
          ))}
        </div>
      )}
      <div className="relative mt-auto p-4 sm:p-5 z-10">
        <h3 className={`font-serif font-bold leading-tight text-white ${tall ? "text-xl sm:text-2xl" : "text-base sm:text-lg"}`}>
          {tile.title}
        </h3>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-xs text-white/60 font-medium">
            {tile.items.length} {tile.items.length === 1 ? "option" : "options"}
          </p>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">
            Browse <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </button>
  );
}

// -- Our Story slideshow ----------------------------------------
const FALLBACK_STORY_SLIDES = [asset("assets/our-story.png")];

function OurStoryImage({ slides }: { slides?: string[] }) {
  const list = slides && slides.length > 0 ? slides : FALLBACK_STORY_SLIDES;
  const [idx, setIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 55, damping: 18 });
  const springY = useSpring(rawY, { stiffness: 55, damping: 18 });
  const imgX = useTransform(springX, [-1, 1], ["-14px", "14px"]);
  const imgY = useTransform(springY, [-1, 1], ["-10px", "10px"]);

  useEffect(() => {
    if (list.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 4000);
    return () => clearInterval(t);
  }, [list.length]);

  useEffect(() => {
    if (idx >= list.length) setIdx(0);
  }, [list.length, idx]);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    rawX.set(((e.clientX - r.left) / r.width) * 2 - 1);
    rawY.set(((e.clientY - r.top) / r.height) * 2 - 1);
  }
  function onLeave() { rawX.set(0); rawY.set(0); }

  return (
    <div
      ref={containerRef}
      className="relative aspect-square rounded-[3rem] overflow-hidden cursor-default"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <motion.div className="absolute inset-[-4%] w-[108%] h-[108%]" style={{ x: imgX, y: imgY }}>
        <AnimatePresence mode="wait">
          <motion.img
            key={`${idx}-${list[idx]}`}
            src={list[idx]}
            alt="Our story"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
      </motion.div>
      {list.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {list.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "bg-white w-4" : "bg-white/50 w-1.5"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// -- Demo Storefront --------------------------------------------
function DemoStorefront({
  products,
  onAddToCart,
}: {
  products: Product[];
  onAddToCart: (name: string) => void;
}) {
  const router = useRouter();
  const story = useStoryContent();
  const heroContent = useHeroContent();
  const sectionsContent = useSectionsContent();
  const cmsBannerSlides = useBannerSlides();
  const cmsChapters = useChapters();

  const bucket = (main: "coffee" | "merch", sub: string) =>
    products.filter((p) => {
      const tax = resolveTaxonomy(p);
      return tax.mainCategory === main && tax.subCategory === sub;
    });

  const coffeeBeans = bucket("coffee", "beans");
  const coffeeEcb = bucket("coffee", "ecb");
  const coffeeBrewing = bucket("coffee", "brewing-tools");
  const merchDrinkware = bucket("merch", "drinkware");
  const merchBags = bucket("merch", "bags");
  const merchKeychains = bucket("merch", "keychains");
  const merchChocolates = bucket("merch", "chocolates-nuts");
  const merchBrewing = bucket("merch", "brewing-tools");

  const featuredBean = [...coffeeBeans].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
  const featuredBag = coffeeEcb[0];
  const featuredMerch = merchDrinkware[0] ?? merchKeychains[0] ?? merchBags[0];
  const featuredBrewing = coffeeBrewing[0] ?? merchBrewing[0];
  const featuredKeychain = merchKeychains[0] ?? merchBags[0] ?? merchChocolates[0];

  type Tile = {
    title: string;
    target: string;
    items: Product[];
    span: string;
    accent: string;
  };

  const allTiles: Tile[] = [
    { title: "Freshly Roasted Beans",   target: "section-coffee-beans",     items: coffeeBeans,     span: "md:col-span-3 md:row-span-2", accent: "from-amber-100 via-amber-50 to-natural-paper" },
    { title: "Easy Coffee Bags",        target: "section-coffee-ecb",       items: coffeeEcb,       span: "md:col-span-2 md:row-span-1", accent: "from-orange-50 to-natural-muted" },
    { title: "Coffee · Brewing Tools",  target: "section-coffee-brewing",   items: coffeeBrewing,   span: "md:col-span-1 md:row-span-1", accent: "from-stone-100 to-natural-paper" },
    { title: "Drinkware",               target: "section-merch-drinkware",  items: merchDrinkware,  span: "md:col-span-3 md:row-span-1", accent: "from-emerald-100 via-emerald-50 to-natural-paper" },
    { title: "Bags",                    target: "section-merch-bags",       items: merchBags,       span: "md:col-span-2 md:row-span-1", accent: "from-rose-50 to-natural-paper" },
    { title: "Keychains & Accessories", target: "section-merch-keychains",  items: merchKeychains,  span: "md:col-span-2 md:row-span-1", accent: "from-sky-50 to-natural-paper" },
    { title: "Chocolates & Nuts",       target: "section-merch-chocolates", items: merchChocolates, span: "md:col-span-2 md:row-span-1", accent: "from-yellow-50 to-natural-paper" },
    { title: "Brewing Tools",           target: "section-merch-brewing",    items: merchBrewing,    span: "md:col-span-2 md:row-span-1", accent: "from-slate-100 to-natural-paper" },
  ].filter((t) => t.items.length > 0);

  const sections: { id: string; title: string; items: Product[] }[] = [
    { id: "section-coffee-beans",     title: "Freshly Roasted Beans",   items: coffeeBeans },
    { id: "section-coffee-ecb",       title: "Easy Coffee Bags",        items: coffeeEcb },
    { id: "section-coffee-brewing",   title: "Coffee · Brewing Tools",  items: coffeeBrewing },
    { id: "section-merch-drinkware",  title: "Drinkware",               items: merchDrinkware },
    { id: "section-merch-bags",       title: "Bags",                    items: merchBags },
    { id: "section-merch-keychains",  title: "Keychains & Accessories", items: merchKeychains },
    { id: "section-merch-chocolates", title: "Chocolates & Nuts",       items: merchChocolates },
    { id: "section-merch-brewing",    title: "Merch · Brewing Tools",   items: merchBrewing },
  ].filter((s) => s.items.length > 0);

  const goToCatalog = () => {
    const el = document.getElementById(sections[0]?.id ?? "categories");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const heroSlides =
    cmsBannerSlides.length > 0
      ? cmsBannerSlides.map((slide, i) => <DataBanner key={`cms-${i}`} slide={slide} />)
      : [<FizzBanner key="fizz" />, <DessertsBanner key="desserts" />];

  return (
    <div>
      <CinematicHero slides={heroSlides} onScrollHint={goToCatalog} hero={heroContent} />
      <CurtainTransition color="bg-natural-paper" />
      <ChapterDeck
        chapters={
          cmsChapters
            ? cmsChapters.map<ChapterConfig>((c, i) => {
                const linked = (c.productSlug && products)
                  ? products.find((p) => p && (p._id === c.productSlug || slugify(p.name) === c.productSlug))
                  : undefined;
                
                // Per-position fallback (Sourcing, Craft, Brewing, Drinkware, Ritual)
                const fallbacks = [
                  featuredBean, 
                  featuredBag, 
                  featuredBrewing ?? featuredBag, 
                  featuredMerch, 
                  featuredKeychain ?? featuredMerch ?? featuredBean
                ];
                const fallback = fallbacks[i] ?? featuredBean;
                const resolvedProduct = linked ?? (c.imageUrl ? undefined : fallback);

                return {
                  index: c.index || "",
                  eyebrow: c.eyebrow || "",
                  title: (
                    <>
                      {c.titleHead}
                      {c.titleItalic ? (
                        <>
                          <br />
                          <em className="font-serif italic font-light">{c.titleItalic}</em>
                        </>
                      ) : null}
                    </>
                  ),
                  body: c.body || "",
                  callouts: c.callouts ?? [],
                  product: resolvedProduct,
                  imageUrl: c.imageUrl,
                  imageAlt: c.eyebrow || "",
                  align: c.align || "left",
                  theme: c.theme || "light",
                  onProductClick: linked
                    ? () => router.push("/products/" + slugify(linked.name))
                    : resolvedProduct
                    ? () => router.push("/products/" + slugify(resolvedProduct.name))
                    : undefined,
                };
              })
            : [
                {
                  index: "01 / 05",
                  eyebrow: "Sourcing",
                  title: (
                    <>
                      Single origins.
                      <br />
                      <em className="font-serif italic font-light">Patient craft.</em>
                    </>
                  ),
                  body: "Every harvest is hand-selected from partner farms across the Western Ghats and beyond. Beans rest, breathe, then meet our roasters for a slow, deliberate transformation.",
                  callouts: ["Direct trade", "Hand-picked", "Estate-grown", "Traceable"],
                  product: featuredBean,
                  align: "left",
                  theme: "light",
                  onProductClick: featuredBean
                    ? () => router.push("/products/" + slugify(featuredBean.name))
                    : undefined,
                },
                {
                  index: "02 / 05",
                  eyebrow: "Craft",
                  title: (
                    <>
                      The art of <em className="font-serif italic font-light">roasting.</em>
                    </>
                  ),
                  body: "Small-batch drums turn at the rhythm of our master roasters. Every degree, every minute is calibrated until the bean reveals its sweetest, most honest self — then packed whole, ground, or as Easy Coffee Bags ready to brew.",
                  callouts: ["Small batch", "Slow roasted", "Cupped daily", "Brew-ready"],
                  product: featuredBag,
                  align: "right",
                  theme: "dark",
                  onProductClick: featuredBag
                    ? () => router.push("/products/" + slugify(featuredBag.name))
                    : undefined,
                },
                {
                  index: "03 / 05",
                  eyebrow: "Brewing",
                  title: (
                    <>
                      Built to <em className="font-serif italic font-light">brew.</em>
                    </>
                  ),
                  body: "Grinders that whisper, presses that bloom, kettles tuned for that gooseneck pour. The tools we trust to coax the best out of every roast — now in your kitchen.",
                  callouts: ["Curated", "Barista-tested", "Coffee-first", "Built to last"],
                  product: featuredBrewing ?? featuredBag,
                  align: "left",
                  theme: "light",
                  onProductClick: featuredBrewing
                    ? () => router.push("/products/" + slugify(featuredBrewing.name))
                    : undefined,
                },
                {
                  index: "04 / 05",
                  eyebrow: "Drinkware",
                  title: (
                    <>
                      The vessel <em className="font-serif italic font-light">matters.</em>
                    </>
                  ),
                  body: "Ceramic that keeps the crema, double-walls that hold the heat, tumblers that travel as well as you do. Cups, mugs and bottles we'd reach for first thing in the morning.",
                  callouts: ["Hand-finished", "Built for daily use", "Travel-ready"],
                  product: featuredMerch,
                  align: "right",
                  theme: "dark",
                  onProductClick: featuredMerch
                    ? () => router.push("/products/" + slugify(featuredMerch.name))
                    : undefined,
                },
                {
                  index: "05 / 05",
                  eyebrow: "Ritual",
                  title: (
                    <>
                      Pour. Pause. <em className="font-serif italic font-light">Repeat.</em>
                    </>
                  ),
                  body: "From the first wisp of steam to the last warm sip — what we craft is meant to anchor the small, beautiful pauses in your day. Bags, keychains and trinkets that carry the ritual with you.",
                  callouts: ["Carry it everywhere", "Made to share", "Everyday joy"],
                  product: featuredKeychain ?? featuredMerch ?? featuredBean,
                  align: "left",
                  theme: "light",
                  onProductClick: featuredKeychain
                    ? () => router.push("/products/" + slugify(featuredKeychain.name))
                    : featuredMerch
                    ? () => router.push("/products/" + slugify(featuredMerch.name))
                    : undefined,
                },
              ]
        }
      />

      <CatalogBanner
        eyebrow={sectionsContent.catalogBanner.eyebrow}
        title={sectionsContent.catalogBanner.title}
      />

      <div className="space-y-16 sm:space-y-24 pb-24 pt-12">
        <section id="categories" className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-natural-accent">
                {sectionsContent.categories.eyebrow}
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black mt-2">
                {sectionsContent.categories.title}
              </h2>
            </div>
            <span className="hidden sm:inline text-xs text-natural-text/40 font-bold uppercase tracking-widest">
              {allTiles.length} categories
            </span>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4" style={{ minHeight: "360px" }}>
              {allTiles[0] && (
                <div className="md:flex-[3] flex flex-col min-h-[260px] md:min-h-0">
                  <BentoTile tile={allTiles[0]} onClick={() => scrollTo(allTiles[0].target)} tall />
                </div>
              )}
              {allTiles.slice(1, 3).length > 0 && (
                <div className="md:flex-[2] flex flex-col gap-3 sm:gap-4">
                  {allTiles.slice(1, 3).map((t) => (
                    <div key={t.target} className="flex-1">
                      <BentoTile tile={t} onClick={() => scrollTo(t.target)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            {allTiles.slice(3).length > 0 && (
              <div
                className={`grid gap-3 sm:gap-4 grid-cols-2 ${
                  allTiles.slice(3).length <= 2
                    ? "sm:grid-cols-2"
                    : allTiles.slice(3).length === 3
                    ? "sm:grid-cols-3"
                    : "sm:grid-cols-2 md:grid-cols-4"
                }`}
              >
                {allTiles.slice(3).map((t) => (
                  <BentoTile key={t.target} tile={t} onClick={() => scrollTo(t.target)} />
                ))}
              </div>
            )}
          </div>
        </section>

        {sections.map((s) => (
          <section key={s.id} id={s.id} className="space-y-8 scroll-mt-24">
            <div className="flex items-end border-b border-natural-border pb-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
              <h3 className="text-2xl sm:text-4xl font-serif font-bold">{s.title}</h3>
              <span className="ml-auto text-xs text-natural-text/40 font-bold uppercase tracking-widest">
                {s.items.length} {s.items.length === 1 ? "option" : "options"}
              </span>
            </div>
            <div className="px-4 sm:px-6 md:px-12">
              <HScrollRow products={s.items} onAddToCart={onAddToCart} />
            </div>
          </section>
        ))}

        <section className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 md:px-12" id="our-story">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-accent">
                Our Story
              </span>
              <h3 className="text-3xl sm:text-5xl font-serif font-bold leading-[1.1] whitespace-pre-line">
                {story.headline}
              </h3>
              <div className="space-y-4 text-natural-text/70 leading-relaxed">
                {story.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-4">
                {story.stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl sm:text-3xl font-extrabold">{stat.value}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-natural-text/40 mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <OurStoryImage slides={story.slides.map((s) => s.url).filter(Boolean)} />
          </div>
        </section>

        {products.length === 0 && (
          <section className="text-center py-32">
            <div className="animate-pulse space-y-4">
              <Coffee className="w-16 h-16 text-natural-stone mx-auto" />
              <p className="text-natural-text/40 font-medium text-lg">
                Loading the collection...
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// -- HomeContent — main export (replaces Storefront + App) -----
export default function HomeContent() {
  const router = useRouter();
  const products = useProducts();
  const cmsChapters = useChapters();
  const chapterNavItems = useMemo(() => {
    const eyebrows = cmsChapters
      ? cmsChapters.map((ch: { eyebrow?: string }) => ch.eyebrow || "").filter(Boolean)
      : ["Sourcing", "Craft", "Brewing", "Drinkware", "Ritual"];
    return eyebrows.map((label: string) => ({
      label,
      target: "chapter-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, ""),
    }));
  }, [cmsChapters]);
  const { showToast } = useToast();
  const { cart, addToCart, cartCount } = useCart();
  const { openCart } = useCartPanel();
  const [criticalReady, setCriticalReady] = useState(false);
  const [tiOpen, setTiOpen] = useState(false);
  const [tiSweep, setTiSweep] = useState<{ x: number; y: number } | null>(null);

  // Page view tracking
  const recordPageView = useMutation((api as any).pageViews.record);
  const updatePageViewDuration = useMutation((api as any).pageViews.updateDuration);
  useEffect(() => {
    let pvId: string | null = null;
    const start = Date.now();
    const sessionId = (() => {
      let id = sessionStorage.getItem("brewmatch:sid");
      if (!id) { id = Math.random().toString(36).slice(2); sessionStorage.setItem("brewmatch:sid", id); }
      return id;
    })();

    async function reverseGeocode(lat: number, lon: number): Promise<Record<string, string | undefined>> {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
          { signal: AbortSignal.timeout(4000), headers: { "Accept-Language": "en" } }
        );
        if (!res.ok) return {};
        const data = await res.json();
        const a = data?.address ?? {};
        return {
          country: a.country || undefined,
          countryCode: a.country_code ? String(a.country_code).toUpperCase() : undefined,
          region: a.state || a.region || a.state_district || undefined,
          city: a.city || a.town || a.municipality || a.village || a.county || undefined,
          locality: a.suburb || a.neighbourhood || a.hamlet || a.quarter || a.city_district || undefined,
          postcode: a.postcode || undefined,
        };
      } catch { return {}; }
    }

    async function getGpsGeo(): Promise<Record<string, string | number | undefined> | null> {
      if (typeof navigator === "undefined" || !navigator.geolocation) return null;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false, timeout: 6000, maximumAge: 10 * 60 * 1000,
          });
        });
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const geo = await reverseGeocode(lat, lon);
        return { ...geo, lat, lon };
      } catch { return null; }
    }

    async function getIpGeo(): Promise<Record<string, string | number | undefined>> {
      try {
        const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(2500) });
        if (res.ok) {
          const d = await res.json();
          if (d && !d.error && d.country_name) {
            return { country: d.country_name, countryCode: d.country_code, region: d.region, city: d.city, lat: d.latitude, lon: d.longitude };
          }
        }
      } catch { /* try next */ }
      try {
        const res = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(2500) });
        if (res.ok) {
          const d = await res.json();
          if (d && d.success !== false && d.country) {
            return { country: d.country, countryCode: d.country_code, region: d.region, city: d.city, lat: d.latitude, lon: d.longitude };
          }
        }
      } catch { /* try next */ }
      return {};
    }

    async function resolveGeo(): Promise<Record<string, string | number | undefined>> {
      try {
        const cached = sessionStorage.getItem("brewmatch:geo");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.country) return parsed;
        }
      } catch { /* ignore */ }
      const gps = await getGpsGeo();
      if (gps && gps.country) {
        const out = { ...gps, geoSource: "gps" };
        try { sessionStorage.setItem("brewmatch:geo", JSON.stringify(out)); } catch { /* ignore */ }
        return out;
      }
      const ip = await getIpGeo();
      if (ip.lat != null && ip.lon != null && !ip.city) {
        const rev = await reverseGeocode(ip.lat as number, ip.lon as number);
        Object.assign(ip, rev);
      }
      const out = { ...ip, geoSource: "ip" };
      if (ip.country) {
        try { sessionStorage.setItem("brewmatch:geo", JSON.stringify(out)); } catch { /* ignore */ }
      }
      return out;
    }

    const pvDateKey = `brewmatch:pv:${new Date().toISOString().slice(0, 10)}`;
    if (!sessionStorage.getItem(pvDateKey)) {
      resolveGeo().then((geo) => {
        recordPageView({
          path: window.location.pathname,
          sessionId,
          referrer: document.referrer || undefined,
          ...geo,
        }).then((id: any) => {
          pvId = id;
          try { sessionStorage.setItem(pvDateKey, "1"); } catch { /* ignore */ }
        });
      });
    }

    const handleUnload = () => {
      if (pvId) {
        const duration = Math.round((Date.now() - start) / 1000);
        updatePageViewDuration({ id: pvId as any, duration });
      }
    };
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") handleUnload();
    });
    return () => { handleUnload(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openTI = (e?: React.MouseEvent) => {
    if (e) {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setTiSweep({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    } else {
      setTiSweep({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }
  };

  const onAddToCart = useCallback(
    (name: string) => {
      const product = (products ?? []).find((p) => p.name === name);
      if (product) { addToCart(product._id); showToast("Added to cart"); }
    },
    [products, addToCart, showToast]
  );

  // Simplified nav handler — TI is now an overlay, all other routes are real routes
  const handleNavTo = useCallback((target: string) => {
    if (target.startsWith("/")) { router.push(target); return; }
    if (target === "third-circle") { router.push("/third-circle"); return; }
    const el = typeof document !== "undefined" && document.getElementById(target);
    if (el) { scrollTo(target); return; }
    // Chapter targets: scan [data-snap-chapter] to handle any CMS eyebrow mismatches
    if (target.startsWith("chapter-")) {
      const chapterEls = typeof document !== "undefined" && document.querySelectorAll("[data-snap-chapter]");
      if (chapterEls && chapterEls.length > 0) {
        const first = chapterEls[0] as HTMLElement;
        const lenis = (window as any).__lenis;
        if (lenis) { const top = Math.round(first.getBoundingClientRect().top + window.scrollY); lenis.scrollTo(top, { duration: 1.0, easing: (t: number) => 1 - Math.pow(1 - t, 3) }); }
        else first.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    // Fallback: window.location.hash (not router.push) to avoid static-export routing issues
    if (typeof window !== "undefined") window.location.hash = target;
  }, [router]);

  // Handle /#chapter-xxx hash navigation when arriving from another page
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.slice(1);
    if (!hash.startsWith("chapter-")) return;
    let attempts = 0;
    let pollTimer: ReturnType<typeof setTimeout>;
    const poll = () => {
      attempts++;
      const el = document.getElementById(hash) ?? document.querySelector<HTMLElement>("[data-snap-chapter]");
      if (el) {
        const lenis = (window as any).__lenis;
        const top = Math.round(el.getBoundingClientRect().top + window.scrollY);
        if (lenis) lenis.scrollTo(top, { duration: 1.2, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
        else window.scrollTo({ top, behavior: "smooth" });
        return;
      }
      if (attempts < 25) pollTimer = setTimeout(poll, 120);
    };
    const t = setTimeout(poll, 300);
    return () => { clearTimeout(t); clearTimeout(pollTimer); };
  }, []);
  // Hard ceiling: never block the user for more than 6 s regardless of network.
  useEffect(() => {
    const t = setTimeout(() => setCriticalReady(true), 6000);
    return () => clearTimeout(t);
  }, []);

  // Wait for products + hero image
  useEffect(() => {
    if (!products) return;
    let cancelled = false;
    const heroImg = new Image();
    heroImg.src = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1600";
    const done = () => { if (!cancelled) setCriticalReady(true); };
    heroImg.onload = done;
    heroImg.onerror = done;
    const t = setTimeout(done, 4500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [products]);

  // Header scroll reactivity
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 120], ["rgba(250,249,246,0.35)", "rgba(250,249,246,0.62)"]);
  const headerBorder = useTransform(scrollY, [0, 120], ["rgba(255,255,255,0.25)", "rgba(255,255,255,0.45)"]);
  const headerShadow = useTransform(
    scrollY,
    [0, 120],
    ["0 0 0 rgba(0,0,0,0)", "0 10px 40px -12px rgba(44,24,16,0.12)"]
  );

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-natural-bg text-natural-text font-sans selection:bg-natural-accent/20">
        <LoadingScreen ready={criticalReady} />
        <ScrollProgressBar />

        <MorphingHeader
          headerBg={headerBg}
          headerBorder={headerBorder}
          headerShadow={headerShadow}
          onOpenTI={openTI}
          onOpenCart={openCart}
          onNavTo={handleNavTo}
          cartCount={cartCount}
          chapterItems={chapterNavItems}
        />

        <MobileBottomNav
          onOpenTI={openTI}
          onOpenCart={openCart}
          onNavTo={handleNavTo}
          cartCount={cartCount}
        />

        <div>
          <main className="pt-20 md:pt-20 lg:pt-20 pb-28 sm:pb-12 px-0" id="storefront-view">
            <DemoStorefront products={products ?? []} onAddToCart={onAddToCart} />
          </main>

          <SiteFooter
            onNavigate={(t) => {
              if (t === "home") { scrollTo("hero"); return; }
              if (t === "third-circle") { router.push("/journal"); return; }
              router.push(hrefForNavTarget(t));
            }}
            onScrollTo={(id) => scrollTo(id)}
          />
        </div>

        {/* Galaxy sweep into TI */}
        {tiSweep && (
          <GalaxySweep
            origin={tiSweep}
            onComplete={() => { setTiSweep(null); setTiOpen(true); }}
          />
        )}

        {/* TI overlay (replaces the ?page=ti full-page route) */}
        {tiOpen && (
          <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-[#050E1F] text-natural-text font-sans">
            <DiscoveryWidget
              onClose={() => setTiOpen(false)}
              onNavigateToProduct={(slug) => { setTiOpen(false); router.push("/products/" + slug); }}
              onAddToCart={(productId) => addToCart(productId)}
            />
          </div>
        )}
      </div>
    </SmoothScroll>
  );
}

