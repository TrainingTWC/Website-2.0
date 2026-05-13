/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useMotionValueEvent,
  useInView,
} from "motion/react";
import {
  ShoppingCart,
  ShoppingBag,
  BookOpen,
  Info,
  Sparkles,
  Star,
  Coffee,
  Package,
  ArrowRight,
  MapPin,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Heart,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { DiscoveryWidget } from "./components/widget/DiscoveryWidget";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { LoadingScreen } from "./components/LoadingScreen";
import { SmartImage } from "./components/SmartImage";
import { ProductPage } from "./components/ProductPage";
import { SmoothScroll } from "./components/SmoothScroll";
import { CinematicHero, CurtainTransition, ChapterReveal } from "./components/Cinematic";
import { slugify } from "./lib/slug";
import { asset } from "./lib/asset";
import type { Product } from "./types";

// ── Scroll helper ──────────────────────────────────────────────
function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── ScrollReveal — fade + lift sections into view on scroll ────
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

// ── Scroll progress bar (top of page, ultra-thin) ──────────────
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

// ── Toast notification system ──────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState<{ id: number; text: string; icon?: string }[]>([]);
  const show = useCallback((text: string, icon = "cart") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text, icon }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }: { toasts: { id: number; text: string; icon?: string }[] }) {
  return (
    <div className="fixed bottom-24 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.9 }}
            className="bg-natural-text text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-medium pointer-events-auto"
          >
            <div className="bg-white/20 p-1.5 rounded-full">
              <Check className="w-4 h-4" />
            </div>
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Password Gate for Merchant Panel ─────────────────────────
function MerchantGate() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correct = import.meta.env.VITE_MERCHANT_PASSWORD ?? "twc2026";
    if (password === correct) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPassword("");
    }
  };

  if (unlocked) {
    return (
      <div className="min-h-screen bg-natural-bg text-natural-text font-sans">
        <header className="fixed top-0 left-0 right-0 z-50 bg-natural-paper/90 backdrop-blur-md border-b border-natural-border px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href={asset("")} className="flex items-center gap-3">
              <img src={asset("logo.png")} alt="Third Wave Coffee" className="h-10 w-auto" />
            </a>
            <span className="text-sm font-serif font-bold text-natural-accent uppercase tracking-widest">Merchant Panel</span>
          </div>
        </header>
        <main className="pt-24 pb-12 px-6">
          <div className="max-w-7xl mx-auto">
            <AdminDashboard />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-natural-bg flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-natural-paper border border-natural-border rounded-[2.5rem] shadow-2xl p-12 w-full max-w-md"
      >
        <div className="flex flex-col items-center gap-6 mb-10">
          <img src={asset("logo.png")} alt="Third Wave Coffee" className="h-16 w-auto" />
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold">Merchant Panel</h2>
            <p className="text-sm text-natural-text/50 mt-1 font-sans">Enter your access password to continue.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-text/30" />
            <input
              ref={inputRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="Password"
              className={`w-full pl-11 pr-11 py-4 rounded-2xl border bg-white font-sans text-sm outline-none transition-all ${
                error ? "border-red-400 ring-2 ring-red-100" : "border-natural-border focus:border-natural-accent focus:ring-2 focus:ring-natural-accent/20"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-natural-text/30 hover:text-natural-text/60 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && (
            <p className="text-red-500 text-xs font-sans pl-1">Incorrect password. Please try again.</p>
          )}
          <button
            type="submit"
            className="w-full bg-natural-accent text-white py-4 rounded-2xl font-serif font-bold text-sm hover:bg-natural-text transition-colors active:scale-95"
          >
            Access Panel
          </button>
        </form>
        <p className="text-center mt-6">
          <a href="/" className="text-xs text-natural-text/40 hover:text-natural-accent transition-colors font-sans">
            ← Back to Storefront
          </a>
        </p>
      </motion.div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────
function useUrlQuery() {
  const [search, setSearch] = useState(
    typeof window !== "undefined" ? window.location.search : ""
  );
  useEffect(() => {
    const handler = () => setSearch(window.location.search);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);
  return new URLSearchParams(search);
}

function navigateTo(params: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(params)) {
    if (v === null) url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  }
  window.history.pushState({}, "", url.toString());
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

export default function App() {
  const params = useUrlQuery();
  if (params.get("panel") === "merchant") {
    return <MerchantGate />;
  }

  return (
    <SmoothScroll>
      <Storefront />
    </SmoothScroll>
  );
}

// ── Hero banner 1 — Schweppes Fizz ─────────────────────────────
function FizzBanner() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=1800)",
        }}
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
          <span className="text-[10px] font-bold tracking-[0.35em] uppercase">
            In stores now
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Hero banner 2 — Third Rush Desserts ────────────────────────
function DessertsBanner() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=1800)",
        }}
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

function Storefront() {
  const products = useQuery(api.products.list);
  const { toasts, show: showToast } = useToast();
  const [criticalReady, setCriticalReady] = useState(false);
  const params = useUrlQuery();
  // Slugs in URL (e.g. ?product=kenyan-single-origin) — resolve to Convex _id
  const slugMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products ?? []) map.set(slugify(p.name), p._id);
    return map;
  }, [products]);
  const rawProductParam = params.get("product");
  const activeProductId = rawProductParam
    ? (slugMap.get(rawProductParam) ?? rawProductParam) // fallback: old bookmarked IDs still work
    : null;
  const tiOpen = !!params.get("ti");

  // Reset scroll to top whenever the active product changes (open / switch).
  // Use Lenis if available so the transition feels of-a-piece with the rest
  // of the page; otherwise fall back to window.scrollTo.
  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: { scrollTo: (t: number, o?: object) => void } }).__lenis;
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [activeProductId, tiOpen]);

  const openTI = () => navigateTo({ ti: "1" });
  const closeTI = () => navigateTo({ ti: null });

  const onAddToCart = (name: string) => showToast(`Added \"${name}\" to cart`);

  // Wait for: (1) products query resolved, (2) hero bg image preloaded.
  useEffect(() => {
    if (!products) return;
    let cancelled = false;
    const heroImg = new Image();
    heroImg.src =
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1600";
    const done = () => { if (!cancelled) setCriticalReady(true); };
    heroImg.onload = done;
    heroImg.onerror = done;
    // Safety fallback so the loader can't get stuck on a bad connection
    const t = setTimeout(done, 4500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [products]);

  // Header reactivity to scroll — opacity + shadow build up
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 120], ["rgba(250,249,246,0.6)", "rgba(250,249,246,0.95)"]);
  const headerBorder = useTransform(scrollY, [0, 120], ["rgba(224,216,208,0)", "rgba(224,216,208,1)"]);
  const headerShadow = useTransform(
    scrollY,
    [0, 120],
    ["0 0 0 rgba(0,0,0,0)", "0 8px 30px rgba(44,24,16,0.06)"]
  );

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans selection:bg-natural-accent/20">
      <LoadingScreen ready={criticalReady} />

      {/* TI page — same AnimatePresence layer as ProductPage, higher z */}
      <AnimatePresence mode="wait">
        {tiOpen && (
          <motion.div
            key="ti-page"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 overflow-hidden"
            style={{ willChange: "transform, opacity" }}
          >
            <DiscoveryWidget onClose={closeTI} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product page overlays the home with a smooth lift + crossfade.
          Home stays mounted (scroll position, queries, etc. preserved). */}
      <AnimatePresence mode="wait">
        {activeProductId && (
          <motion.div
            key={activeProductId}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 overflow-hidden bg-natural-bg"
            style={{ willChange: "transform, opacity" }}
          >
            <ProductPage productId={activeProductId} onAddToCart={onAddToCart} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          opacity: activeProductId ? 0 : 1,
          scale: activeProductId ? 0.985 : 1,
          filter: activeProductId ? "blur(4px)" : "blur(0px)",
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden={activeProductId ? true : undefined}
        style={{
          pointerEvents: activeProductId ? "none" : undefined,
          willChange: "transform, opacity, filter",
          transformOrigin: "center top",
        }}
      >
      <ScrollProgressBar />

      {/* Main Navigation Header — morphs text→icons on scroll, stays fixed */}
      <MorphingHeader
        headerBg={headerBg}
        headerBorder={headerBorder}
        headerShadow={headerShadow}
        onOpenTI={openTI}
        onOpenCart={() => showToast("Cart coming soon!", "cart")}
      />

      <main className="pt-28 lg:pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto" id="storefront-view">
          <DemoStorefront products={products ?? []} onAddToCart={(name) => showToast(`${name} added to cart`)} />
        </div>
      </main>

      <footer className="py-16 border-t border-natural-border bg-natural-paper" id="footer">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
            <div className="space-y-4 max-w-sm">
              <div className="flex items-center gap-2">
                <img src={asset("logo.png")} alt="Third Wave Coffee" className="h-8 w-auto" />
              </div>
              <p className="text-natural-text/50 text-sm leading-relaxed">
                India's finest specialty coffee. We source, roast, and deliver premium beans to your doorstep.
              </p>
            </div>

            <div className="flex gap-16 text-sm">
              <div className="space-y-4">
                <h4 className="font-bold uppercase tracking-widest text-[10px] text-natural-text/40">Shop</h4>
                <div className="flex flex-col gap-2.5 text-natural-text/60 font-medium">
                  <span className="cursor-pointer hover:text-natural-accent transition-colors" onClick={() => scrollTo("section-beans")}>Coffee Beans</span>
                  <span className="cursor-pointer hover:text-natural-accent transition-colors" onClick={() => scrollTo("section-bags")}>Easy Coffee Bags</span>
                  <span className="cursor-pointer hover:text-natural-accent transition-colors" onClick={() => scrollTo("section-merch")}>Merch</span>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold uppercase tracking-widest text-[10px] text-natural-text/40">Company</h4>
                <div className="flex flex-col gap-2.5 text-natural-text/60 font-medium">
                  <span className="cursor-pointer hover:text-natural-accent transition-colors" onClick={() => scrollTo("our-story")}>Our Story</span>
                  <span className="cursor-pointer hover:text-natural-accent transition-colors">Contact</span>
                  <span className="cursor-pointer hover:text-natural-accent transition-colors">Careers</span>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold uppercase tracking-widest text-[10px] text-natural-text/40">Legal</h4>
                <div className="flex flex-col gap-2.5 text-natural-text/60 font-medium">
                  <span className="cursor-pointer hover:text-natural-accent transition-colors">Privacy Policy</span>
                  <span className="cursor-pointer hover:text-natural-accent transition-colors">Terms of Service</span>
                  <span className="cursor-pointer hover:text-natural-accent transition-colors">Shipping Policy</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-natural-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-natural-text/40 text-xs">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3" /> © 2026 Third Wave Coffee. All rights reserved.
            </span>
            <span className="flex items-center gap-1">
              Made with <Heart className="w-3 h-3 fill-red-400 text-red-400" /> in India
            </span>
          </div>
        </div>
      </footer>

      <ToastContainer toasts={toasts} />
      </motion.div>
    </div>
  );
}

// ── Icon side rail (desktop left, mobile bottom) ────────────
const NAV_ITEMS: { key: string; label: string; target: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "beans", label: "Beans", target: "section-beans", Icon: Coffee },
  { key: "bags", label: "Coffee Bags", target: "section-bags", Icon: Package },
  { key: "merch", label: "Merch", target: "section-merch", Icon: ShoppingBag },
  { key: "story", label: "Our Story", target: "our-story", Icon: BookOpen },
];

function useActiveSection(): string {
  const [active, setActive] = useState<string>("beans"); // Beans default
  useEffect(() => {
    const els = NAV_ITEMS
      .map(({ key, target }) => {
        const el = document.getElementById(target);
        return el ? { key, el } : null;
      })
      .filter((x): x is { key: string; el: HTMLElement } => !!x);
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the largest intersectionRatio that is intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const match = els.find((x) => x.el === visible[0].target);
          if (match) setActive(match.key);
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    els.forEach(({ el }) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return active;
}

// Header that morphs from text labels → icons on scroll. Stays fixed throughout.
function MorphingHeader({
  headerBg,
  headerBorder,
  headerShadow,
  onOpenTI,
  onOpenCart,
}: {
  headerBg: any;
  headerBorder: any;
  headerShadow: any;
  onOpenTI: () => void;
  onOpenCart: () => void;
}) {
  const active = useActiveSection();
  const { scrollY } = useScroll();
  const [compact, setCompact] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => {
    const next = v > 80;
    setCompact((prev) => (prev === next ? prev : next));
  });

  return (
    <motion.header
      style={{
        backgroundColor: headerBg,
        borderBottomColor: headerBorder,
        boxShadow: headerShadow,
      }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b"
    >
      <motion.div
        animate={{ paddingTop: compact ? 10 : 18, paddingBottom: compact ? 10 : 18 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-6"
      >
        {/* Big logo — shrinks slightly on scroll */}
        <button
          onClick={() => scrollTo("hero")}
          className="flex items-center shrink-0"
          aria-label="Third Wave Coffee—home"
        >
          <motion.img
            src={asset("logo.png")}
            alt="Third Wave Coffee"
            initial={false}
            animate={{ height: compact ? 44 : 64 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-auto"
          />
        </button>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <MorphNavItem
              key={item.key}
              label={item.label}
              Icon={item.Icon}
              active={active === item.key}
              compact={compact}
              onClick={() => scrollTo(item.target)}
            />
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1 shrink-0">
          <MorphNavItem
            label="Cart"
            Icon={ShoppingCart}
            active={false}
            compact={compact}
            onClick={onOpenCart}
          />
          <TIHeaderButton compact={compact} onClick={onOpenTI} />
        </div>
      </motion.div>
    </motion.header>
  );
}

function MorphNavItem({
  label,
  Icon,
  active,
  compact,
  onClick,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  compact: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`relative flex items-center rounded-full transition-colors ${
        compact ? "h-10 w-10 justify-center" : "h-10 px-4"
      } ${active ? "text-white" : "text-natural-text/70 hover:text-natural-text"}`}
    >
      {active && (
        <motion.span
          layoutId="header-nav-active"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="absolute inset-0 rounded-full bg-natural-accent shadow-md shadow-natural-accent/30"
        />
      )}
      <span className="relative z-10 flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {compact ? (
            <motion.span
              key="icon"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex items-center justify-center"
            >
              <Icon className="w-5 h-5" />
            </motion.span>
          ) : (
            <motion.span
              key="label"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="text-sm font-serif font-bold whitespace-nowrap"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}

// TI button in header: pill with text by default, icon on scroll. Single smooth pulse ring.
function TIHeaderButton({ compact, onClick }: { compact: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Third Intelligence"
      aria-label="Third Intelligence"
      className={`relative flex items-center rounded-full hover:bg-natural-muted/60 transition-colors ${
        compact ? "h-10 w-10 justify-center" : "h-10 pl-2 pr-4 gap-2"
      }`}
    >
      <span className="relative flex items-center justify-center w-7 h-7">
        <motion.span
          aria-hidden
          animate={{ scale: [1, 1.55], opacity: [0.55, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", repeatDelay: 0.1 }}
          style={{ willChange: "transform, opacity", transformOrigin: "center" }}
          className="absolute inset-0 m-auto w-7 h-7 rounded-full bg-natural-accent/40 pointer-events-none"
        />
        <img
          src={asset("third-intelligence-icon.png")}
          alt=""
          className="relative z-10 w-7 h-7 object-contain"
        />
      </span>
      <AnimatePresence initial={false}>
        {!compact && (
          <motion.span
            key="ti-label"
            initial={{ opacity: 0, width: 0, marginLeft: 0 }}
            animate={{ opacity: 1, width: "auto", marginLeft: 0 }}
            exit={{ opacity: 0, width: 0, marginLeft: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden text-sm font-serif font-bold whitespace-nowrap text-natural-text"
          >
            Intelligence
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ── Product Card Component ─────────────────────────────────────
function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (name: string) => void }) {
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
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
      className="group space-y-5 preserve-3d"
    >
      <div
        className="aspect-[4/5] bg-natural-paper rounded-[2rem] border border-natural-border overflow-hidden shadow-sm group-hover:shadow-2xl transition-all group-hover:-translate-y-1 relative preserve-3d"
        style={{ transform: "translateZ(20px)" }}
      >
        <SmartImage
          src={product.imageUrl}
          blur={product.imageBlur}
          alt={product.name}
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          wrapperClassName="w-full h-full"
        />
        {/* Quick-add button */}
        <div
          onClick={() => onAddToCart(product.name)}
          className="absolute top-5 right-5 bg-white/90 backdrop-blur p-3 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 cursor-pointer hover:bg-natural-accent hover:text-white"
        >
          <ShoppingCart className="w-5 h-5" />
        </div>
        {/* Stock badge */}
        {product.stockStatus === "low-stock" && (
          <div className="absolute top-5 left-5 bg-amber-500/90 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
            Limited
          </div>
        )}
        {/* Roast badge */}
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
            onClick={() => navigateTo({ product: slugify(product.name) })}
          >
            {product.name}
          </h4>
          <span className="text-lg font-extrabold text-natural-accent whitespace-nowrap">
            ₹{product.price.toLocaleString("en-IN")}
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
            <span className="text-xs text-natural-text/40">
              ({product.reviewCount})
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Horizontal Card Component (for Bags) ───────────────────────
function HorizontalCard({ product, onAddToCart }: { product: Product; onAddToCart: (name: string) => void }) {
  return (
    <div className="group flex flex-col md:flex-row bg-natural-paper rounded-[2.5rem] border border-natural-border overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1 md:h-56">
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
            onClick={() => navigateTo({ product: slugify(product.name) })}
          >
            {product.name}
          </h4>
          <p className="text-sm text-natural-text/60 mt-2 line-clamp-2">
            {product.description}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-extrabold">
            ₹{product.price.toLocaleString("en-IN")}
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

// ── Demo Storefront ────────────────────────────────────────────
function DemoStorefront({ products, onAddToCart }: { products: Product[]; onAddToCart: (name: string) => void }) {
  const beans = products.filter((p) => p.type === "beans");
  const bags = products.filter((p) => p.type === "bags");
  const merch = products.filter((p) => p.type === "merch");

  const [showAllBeans, setShowAllBeans] = useState(false);
  const [showAllBags, setShowAllBags] = useState(false);

  const visibleBeans = showAllBeans ? beans : beans.slice(0, 4);
  const visibleBags = showAllBags ? bags : bags.slice(0, 4);

  // Chapter feature products — pick the highest-rated bean/bag/merch
  const featuredBean = [...beans].sort(
    (a, b) => (b.rating ?? 0) - (a.rating ?? 0)
  )[0];
  const featuredBag = bags[0];
  const featuredMerch = merch[0];

  const goToCatalog = () => {
    const el = document.getElementById("section-beans");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const heroSlides = [
    <FizzBanner key="fizz" />,
    <DessertsBanner key="desserts" />,
  ];

  return (
    <div>
      {/* ── Cinematic Hero ─────────────────────────────────────── */}
      <CinematicHero
        slides={heroSlides}
        onScrollHint={goToCatalog}
      />

      {/* ── Curtain into editorial chapter 01 ──────────────────── */}
      <CurtainTransition color="bg-natural-paper" />

      {/* ── Chapter 01: Sourcing ───────────────────────────────── */}
      <ChapterReveal
        index="01 / 03"
        eyebrow="Sourcing"
        title={<>Single origins.<br /><em className="font-serif italic font-light">Patient craft.</em></>}
        body="Every harvest is hand-selected from partner farms across the Western Ghats and beyond. Beans rest, breathe, then meet our roasters for a slow, deliberate transformation."
        callouts={["Direct trade", "Hand-picked", "Estate-grown", "Traceable"]}
        product={featuredBean}
        align="left"
        theme="light"
        onProductClick={featuredBean ? () => navigateTo({ product: slugify(featuredBean.name) }) : undefined}
      />

      {/* ── Curtain into chapter 02 ────────────────────────────── */}
      <CurtainTransition color="bg-[#1A0F08]" />

      {/* ── Chapter 02: Craft (dark) ───────────────────────────── */}
      <ChapterReveal
        index="02 / 03"
        eyebrow="Craft"
        title={<>The art of <em className="font-serif italic font-light">roasting.</em></>}
        body="Small-batch drums turn at the rhythm of our master roasters. Every degree, every minute is calibrated until the bean reveals its sweetest, most honest self."
        callouts={["Small batch", "Slow roasted", "Cupped daily", "Aroma profiled"]}
        product={featuredBag}
        align="right"
        theme="dark"
        onProductClick={featuredBag ? () => navigateTo({ product: slugify(featuredBag.name) }) : undefined}
      />

      {/* ── Curtain back to light for chapter 03 ───────────────── */}
      <CurtainTransition color="bg-natural-paper" />

      {/* ── Chapter 03: Ritual ─────────────────────────────────── */}
      <ChapterReveal
        index="03 / 03"
        eyebrow="Ritual"
        title={<>Pour. Pause. <em className="font-serif italic font-light">Repeat.</em></>}
        body="From the first wisp of steam to the last warm sip — what we craft is meant to anchor the small, beautiful pauses in your day."
        callouts={["Brewed in seconds", "Cup-ready", "Designed to share"]}
        product={featuredMerch ?? featuredBean}
        align="left"
        theme="light"
        onProductClick={
          featuredMerch
            ? () => navigateTo({ product: slugify(featuredMerch.name) })
            : featuredBean
            ? () => navigateTo({ product: slugify(featuredBean.name) })
            : undefined
        }
      />

      {/* ── Curtain into the catalog grids ─────────────────────── */}
      <CurtainTransition color="bg-natural-bg" />

      <div className="space-y-24 max-w-7xl mx-auto px-6 md:px-12 pb-24">
      {/* Catalog header */}
      <div className="text-center max-w-2xl mx-auto pt-12">
        <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-natural-accent">
          The Collection
        </span>
        <h2 className="font-serif font-black text-4xl md:text-6xl leading-tight mt-3 tracking-tight">
          Choose your ritual.
        </h2>
        <p className="text-natural-text/60 mt-4">
          Every coffee, every bag, every cup — handpicked by our master roasters.
        </p>
      </div>

      {/* Product Categories — slim cards with product preview strip */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6" id="categories">
        {[
          {
            title: "Coffee Beans",
            subtitle: `${beans.length} freshly roasted`,
            target: "section-beans",
            samples: beans.slice(0, 4),
            color: "from-amber-50 to-natural-paper",
          },
          {
            title: "Easy Coffee Bags",
            subtitle: `${bags.length} ground & packed`,
            target: "section-bags",
            samples: bags.slice(0, 4),
            color: "from-orange-50 to-natural-muted",
          },
          {
            title: "Merch",
            subtitle: `${merch.length} items`,
            target: "section-merch",
            samples: merch.slice(0, 4),
            color: "from-stone-100 to-natural-stone/30",
          },
        ].map((item) => (
          <button
            key={item.title}
            onClick={() => scrollTo(item.target)}
            className={`group relative overflow-hidden rounded-3xl border border-natural-border bg-gradient-to-br ${item.color} p-6 h-40 flex items-center gap-5 text-left transition-all hover:shadow-xl hover:-translate-y-0.5 hover:border-natural-accent/30`}
          >
            {/* Stacked product previews */}
            <div className="relative flex -space-x-3 shrink-0">
              {item.samples.length === 0 ? (
                <div className="w-20 h-20 rounded-2xl bg-natural-paper border border-natural-border" />
              ) : (
                item.samples.map((p, idx) => (
                  <div
                    key={p._id}
                    className="w-16 h-20 rounded-2xl bg-natural-paper border-2 border-white shadow-md overflow-hidden"
                    style={{ zIndex: item.samples.length - idx, transform: `rotate(${(idx - 1.5) * 4}deg)` }}
                  >
                    <SmartImage
                      src={p.imageUrl}
                      blur={p.imageBlur}
                      alt=""
                      className="object-cover"
                      wrapperClassName="w-full h-full"
                    />
                  </div>
                ))
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-serif font-bold leading-tight">{item.title}</h3>
              <p className="text-sm text-natural-text/60 font-medium mt-1">{item.subtitle}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-natural-accent">
                Browse
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </button>
        ))}
      </section>

      {/* ── Freshly Roasted Beans ──────────────────────────────── */}
      <section className="space-y-10 scroll-mt-24" id="section-beans">
        <div className="flex justify-between items-end border-b border-natural-border pb-10">
          <h3 className="text-4xl font-serif font-bold">Freshly Roasted Beans</h3>
          <button
            onClick={() => setShowAllBeans(!showAllBeans)}
            className="text-sm font-bold uppercase tracking-widest text-natural-accent border-b border-natural-accent/30 pb-1 cursor-pointer flex items-center gap-1 hover:gap-2 transition-all"
          >
            {showAllBeans ? (
              <>Show Less <ChevronUp className="w-4 h-4" /></>
            ) : (
              <>Explore All ({beans.length}) <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
        <motion.div
          layout
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          <AnimatePresence>
            {visibleBeans.map((product) => (
              <motion.div
                key={product._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <ProductCard product={product} onAddToCart={onAddToCart} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ── Easy Coffee Bags ───────────────────────────────────── */}
      {bags.length > 0 && (
        <section className="space-y-10 scroll-mt-24" id="section-bags">
          <div className="flex justify-between items-end border-b border-natural-border pb-10">
            <h3 className="text-4xl font-serif font-bold">Easy Coffee Bags</h3>
            <button
              onClick={() => setShowAllBags(!showAllBags)}
              className="text-sm font-bold uppercase tracking-widest text-natural-accent border-b border-natural-accent/30 pb-1 cursor-pointer flex items-center gap-1 hover:gap-2 transition-all"
            >
              {showAllBags ? (
                <>Show Less <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>View All ({bags.length}) <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {visibleBags.map((product) => (
                <motion.div
                  key={product._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <HorizontalCard product={product} onAddToCart={onAddToCart} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </section>
      )}

      {/* ── Merch ──────────────────────────────────────────────── */}
      {merch.length > 0 && (
        <section className="space-y-10 scroll-mt-24" id="section-merch">
          <div className="flex justify-between items-end border-b border-natural-border pb-10">
            <h3 className="text-4xl font-serif font-bold">Merch</h3>
            <span className="text-sm font-bold uppercase tracking-widest text-natural-text/40 pb-1">
              {merch.length} items
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {merch.map((product) => (
              <ProductCard key={product._id} product={product} onAddToCart={onAddToCart} />
            ))}
          </div>
        </section>
      )}

      {/* ── Our Story ──────────────────────────────────────────── */}
      <section className="scroll-mt-24" id="our-story">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-accent">
              Our Story
            </span>
            <h3 className="text-5xl font-serif font-bold leading-[1.1]">
              From bean to cup,<br />with intention.
            </h3>
            <div className="space-y-4 text-natural-text/70 leading-relaxed">
              <p>
                Third Wave Coffee was born from a simple belief: everyone deserves a great cup of coffee. We set out to build something special — a coffee experience that focuses on quality, from farm to cup.
              </p>
              <p>
                We source directly from farms across Ethiopia, Colombia, Guatemala, and India. Every batch is roasted in small lots at our facility in Bangalore, packed within 48 hours, and shipped to your doorstep at peak freshness.
              </p>
              <p>
                Whether you're a pour-over purist, an espresso devotee, or someone who just wants great coffee without the fuss — we've got you.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-8 pt-4">
              {[
                { value: "12+", label: "Origins" },
                { value: "48hr", label: "Roast-to-ship" },
                { value: "4.7★", label: "Avg. rating" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-extrabold">{stat.value}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-natural-text/40 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="aspect-square rounded-[3rem] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=1200"
              alt="Coffee roasting process"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Loading State */}
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
