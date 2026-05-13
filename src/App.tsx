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
  Home,
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
import { CartPanel } from "./components/CartPanel";
import { CheckoutPage } from "./components/CheckoutPage";
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
    <div className="fixed bottom-[7rem] sm:bottom-8 right-4 sm:right-8 z-[200] flex flex-col gap-3 pointer-events-none">
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

// Capture current scroll position (Lenis-aware) before a route change.
function currentScrollY(): number {
  const lenis = (window as unknown as { __lenis?: { scroll: number } }).__lenis;
  return lenis?.scroll ?? window.scrollY ?? 0;
}

// Scroll to a specific Y immediately, respecting Lenis if present.
function scrollToY(y: number) {
  const lenis = (window as unknown as {
    __lenis?: { scrollTo: (t: number, o?: object) => void };
  }).__lenis;
  if (lenis) {
    lenis.scrollTo(y, { immediate: true, force: true });
  } else {
    window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
  }
}

function navigateTo(params: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(params)) {
    if (v === null) url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  }
  // 1. Stamp current scroll onto the entry we are LEAVING so Back can restore it.
  const leavingState = (window.history.state ?? {}) as Record<string, unknown>;
  window.history.replaceState(
    { ...leavingState, scrollY: currentScrollY() },
    ""
  );
  // 2. Push the new entry. New entries start at top.
  window.history.pushState({ scrollY: 0 }, "", url.toString());
  window.dispatchEvent(new PopStateEvent("popstate"));
  scrollToY(0);
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
          backgroundImage: `url(${import.meta.env.BASE_URL}banner-schweppes.png)`,
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
          backgroundImage: `url(${import.meta.env.BASE_URL}banner-third-rush.jpg)`,
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
  const [cart, setCart] = useState<{ productId: string; qty: number }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const params = useUrlQuery();
  const page = params.get("page");
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
  // Restore scroll position on browser back/forward.
  // navigateTo() stamps scrollY onto history.state before pushing; popstate
  // reads it back. Double-rAF lets React render the new route's DOM (so the
  // page is tall enough) before we jump.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const y =
        e.state && typeof (e.state as { scrollY?: number }).scrollY === "number"
          ? (e.state as { scrollY: number }).scrollY
          : 0;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => scrollToY(y))
      );
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const openTI = () => navigateTo({ page: "ti" });
  const closeTI = () => navigateTo({ page: null });

  const addToCart = useCallback((productId: string, qty = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.productId === productId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, { productId, qty }];
    });
    showToast("Added to cart");
  }, [showToast]);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }, []);

  const updateQty = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) =>
        c.productId === productId ? { ...c, qty: Math.max(1, c.qty + delta) } : c
      )
    );
  }, []);

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const onAddToCart = useCallback((name: string) => {
    const product = (products ?? []).find((p) => p.name === name);
    if (product) addToCart(product._id);
  }, [products, addToCart]);

  // Nav click — if product page is open, close it first then scroll to section
  const handleNavTo = useCallback((target: string) => {
    if (activeProductId) {
      navigateTo({ product: null });
      setTimeout(() => scrollTo(target), 560);
    } else {
      scrollTo(target);
    }
  }, [activeProductId]);

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
  // (must be declared before any early returns to satisfy rules of hooks)
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 120], ["rgba(250,249,246,0.6)", "rgba(250,249,246,0.95)"]);
  const headerBorder = useTransform(scrollY, [0, 120], ["rgba(224,216,208,0)", "rgba(224,216,208,1)"]);
  const headerShadow = useTransform(
    scrollY,
    [0, 120],
    ["0 0 0 rgba(0,0,0,0)", "0 8px 30px rgba(44,24,16,0.06)"]
  );

  // ── Full-page route: TI (Third Intelligence) ─────────────────
  if (page === "ti") {
    return (
      <div className="h-screen overflow-hidden bg-natural-bg text-natural-text font-sans">
        <DiscoveryWidget
          onClose={() => navigateTo({ page: null })}
          onNavigateToProduct={(slug) => navigateTo({ page: null, product: slug })}
          onAddToCart={(productId) => addToCart(productId)}
        />
      </div>
    );
  }

  // ── Full-page route: Checkout ───────────────────────────────
  if (page === "checkout") {
    return (
      <div className="min-h-screen bg-natural-bg text-natural-text font-sans">
        <CheckoutPage
          cart={cart}
          products={products ?? []}
          onClose={() => { navigateTo({ page: null }); setCartOpen(true); }}
          onPlaceOrder={() => { setCart([]); navigateTo({ page: null }); }}
        />
      </div>
    );
  }

  // ── Full-page route: Product detail ───────────────────────
  // Renders as a real page (not an overlay) so window scroll, parallax,
  // and Lenis smooth-scroll all behave naturally.
  if (activeProductId) {
    return (
      <div className="min-h-screen bg-natural-bg text-natural-text font-sans">
        <ProductPage
          productId={activeProductId}
          onAddToCart={(productId, qty) => { addToCart(productId, qty); setCartOpen(true); }}
          onOpenCart={() => setCartOpen(true)}
          cartCount={cartCount}
        />
        <CartPanel
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          cart={cart}
          products={products ?? []}
          onRemove={removeFromCart}
          onUpdateQty={updateQty}
          onCheckout={() => navigateTo({ page: "checkout" })}
        />
        <ToastContainer toasts={toasts} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans selection:bg-natural-accent/20">
      <LoadingScreen ready={criticalReady} />

      <ScrollProgressBar />

      {/* Main Navigation Header — fixed, lives outside transformed wrappers so it stays put on scroll */}
      <MorphingHeader
        headerBg={headerBg}
        headerBorder={headerBorder}
        headerShadow={headerShadow}
        onOpenTI={openTI}
        onOpenCart={() => setCartOpen(true)}
        onNavTo={handleNavTo}
        cartCount={cartCount}
      />

      {/* Mobile bottom nav — only on small screens */}
      <MobileBottomNav
        onOpenTI={openTI}
        onOpenCart={() => setCartOpen(true)}
        onNavTo={handleNavTo}
        cartCount={cartCount}
      />

      <div>

      <main className="pt-24 lg:pt-32 pb-28 sm:pb-12 px-0">
        <div className="max-w-7xl mx-auto" id="storefront-view">
          <DemoStorefront products={products ?? []} onAddToCart={onAddToCart} />
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

            <div className="grid grid-cols-3 gap-4 sm:flex sm:gap-16 text-sm">
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
      </div>

      <CartPanel
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        products={products ?? []}
        onRemove={removeFromCart}
        onUpdateQty={updateQty}
        onCheckout={() => navigateTo({ page: "checkout" })}
      />
    </div>
  );
}

// ── Mobile bottom nav pill ───────────────────────────────────
function MobileBottomNav({ onOpenTI, onOpenCart, onNavTo, cartCount = 0 }: { onOpenTI: () => void; onOpenCart: () => void; onNavTo: (target: string) => void; cartCount?: number }) {
  const active = useActiveSection();
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-3 mb-3 pointer-events-auto"
      >
        <div className="flex items-center justify-around bg-natural-paper/92 backdrop-blur-2xl border border-natural-border/70 rounded-2xl px-1 py-2 shadow-2xl shadow-natural-text/15">
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
              <img src={asset("third-intelligence-icon.png")} alt="" className="relative z-10 w-5 h-5 object-contain" />
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wide leading-none">AI</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Icon side rail (desktop left, mobile bottom) ────────────
const NAV_ITEMS: { key: string; label: string; target: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "home", label: "Home", target: "hero", Icon: Home },
  { key: "beans", label: "Beans", target: "section-beans", Icon: Coffee },
  { key: "bags", label: "Coffee Bags", target: "section-bags", Icon: Package },
  { key: "merch", label: "Merch", target: "section-merch", Icon: ShoppingBag },
  { key: "story", label: "Our Story", target: "our-story", Icon: BookOpen },
];

function useActiveSection(): string {
  const [active, setActive] = useState<string>("home");
  useEffect(() => {
    // Look up elements INSIDE the update fn so we always get the freshest DOM
    // (sections appear after products load; a stale closure would miss them).
    const update = () => {
      const items = NAV_ITEMS
        .map(({ key, target }) => {
          const el = document.getElementById(target);
          return el ? { key, el } : null;
        })
        .filter((x): x is { key: string; el: HTMLElement } => !!x);
      if (!items.length) return;

      const trigger = window.scrollY + window.innerHeight * 0.35;
      let best = items[0];
      let bestDist = Infinity;
      for (const item of items) {
        const top = window.scrollY + item.el.getBoundingClientRect().top;
        const dist = Math.abs(top - trigger);
        if (dist < bestDist) { bestDist = dist; best = item; }
      }
      setActive((prev) => (prev === best.key ? prev : best.key));
    };

    const lenis = (window as any).__lenis;
    if (lenis) {
      lenis.on("scroll", update);
    } else {
      window.addEventListener("scroll", update, { passive: true });
    }
    update();
    // Re-run after a short delay to catch sections that rendered after mount
    const t = setTimeout(update, 600);
    return () => {
      clearTimeout(t);
      if (lenis) lenis.off("scroll", update);
      else window.removeEventListener("scroll", update);
    };
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
  onNavTo,
  cartCount = 0,
}: {
  headerBg: any;
  headerBorder: any;
  headerShadow: any;
  onOpenTI: () => void;
  onOpenCart: () => void;
  onNavTo: (target: string) => void;
  cartCount?: number;
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
        animate={{ paddingTop: compact ? 8 : 14, paddingBottom: compact ? 8 : 14 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4"
      >
        {/* Logo — compact on mobile always, shrinks on scroll on desktop */}
        <button
          onClick={() => onNavTo("hero")}
          className="flex items-center shrink-0"
          aria-label="Third Wave Coffee—home"
        >
          <motion.img
            src={asset("logo.png")}
            alt="Third Wave Coffee"
            initial={false}
            animate={{ height: compact ? 40 : 56 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-auto md:hidden"
          />
          <motion.img
            src={asset("logo.png")}
            alt="Third Wave Coffee"
            initial={false}
            animate={{ height: compact ? 44 : 64 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-auto hidden md:block"
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
              onClick={() => onNavTo(item.target)}
            />
          ))}
          {/* TI lives next to Our Story */}
          <TIHeaderButton compact={compact} onClick={onOpenTI} />
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="relative">
            <MorphNavItem
              label="Cart"
              Icon={ShoppingCart}
              active={false}
              compact={compact}
              onClick={onOpenCart}
            />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] bg-natural-accent text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 pointer-events-none">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </div>
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

// ── Horizontal scroll product row ─────────────────────────────
function HScrollRow({ products, onAddToCart }: { products: Product[]; onAddToCart: (name: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const velRef    = useRef(0);
  const rafRef    = useRef(0);
  const drag = useRef({ active: false, startX: 0, startSL: 0, lastX: 0, lastT: 0, vel: 0, moved: false });

  // rAF inertia loop — friction 0.93 gives a buttery coast that stops naturally
  const runInertia = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const el = scrollRef.current;
    if (!el) return;
    const tick = () => {
      velRef.current *= 0.93;
      if (Math.abs(velRef.current) < 0.25) { velRef.current = 0; return; }
      el.scrollLeft += velRef.current;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Wheel: only intercept horizontal trackpad swipes — vertical passes through to Lenis/page
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5;
      if (!isHorizontal) return; // vertical scroll: don't block, let page scroll
      e.preventDefault();
      velRef.current += e.deltaX * 0.6;
      runInertia();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => { el.removeEventListener("wheel", onWheel); cancelAnimationFrame(rafRef.current); };
  }, [runInertia]);

  // Mouse drag via document listeners — NO pointer capture so click events reach children correctly
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // left button only
    const el = scrollRef.current;
    if (!el) return;
    cancelAnimationFrame(rafRef.current);
    velRef.current = 0;
    drag.current = { active: true, startX: e.clientX, startSL: el.scrollLeft, lastX: e.clientX, lastT: performance.now(), vel: 0, moved: false };
    el.style.cursor = "grabbing";

    const onMove = (ev: MouseEvent) => {
      const d = drag.current;
      if (!d.active || !scrollRef.current) return;
      const dx = ev.clientX - d.startX;
      if (Math.abs(dx) > 4) d.moved = true;
      const now = performance.now();
      const dt = now - d.lastT;
      if (dt > 0) d.vel = (d.lastX - ev.clientX) / dt; // px/ms
      d.lastX = ev.clientX;
      d.lastT = now;
      scrollRef.current.scrollLeft = d.startSL - dx;
    };

    const onUp = () => {
      drag.current.active = false;
      velRef.current = drag.current.vel * 14;
      runInertia();
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      if (scrollRef.current) scrollRef.current.style.cursor = "";
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // Capture-phase click guard: suppress clicks that followed a drag (moved > 4px)
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={scrollRef}
      onMouseDown={onMouseDown}
      onClickCapture={onClickCapture}
      className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing select-none
                 -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-12 md:px-12
                 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                 [overscroll-behavior-x:contain]"
      style={{ WebkitOverflowScrolling: "touch" as any }}
      data-lenis-prevent
    >
      {products.map((p) => (
        <div key={p._id} className="flex-shrink-0 w-48 sm:w-56 md:w-64">
          <ProductCard product={p} onAddToCart={onAddToCart} />
        </div>
      ))}
    </div>
  );
}

// ── Catalog parallax banner ────────────────────────────────────
function CatalogBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Three depth layers — slowest to fastest
  const wordmarkY = useTransform(scrollYProgress, [0, 1], ["30%", "-30%"]);
  const headingY  = useTransform(scrollYProgress, [0, 1], ["18%", "-18%"]);
  const subY      = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);

  // Soft fade in as section enters
  const opacity = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [0, 1, 1, 0]);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden bg-natural-paper border-y border-natural-border"
      style={{ perspective: "600px" }}
    >
      {/* Extremely subtle warm tint top-right */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_0%,rgba(160,120,60,0.07)_0%,transparent_60%)] pointer-events-none" />

      {/* Layer 1 — ghost wordmark (slowest, furthest back) */}
      <motion.div
        style={{ y: wordmarkY }}
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center pointer-events-none select-none overflow-hidden"
      >
        <span className="font-serif font-black text-[clamp(5rem,20vw,18rem)] leading-none tracking-tight text-natural-text/[0.04]">
          COLLECTION
        </span>
      </motion.div>

      {/* Layer 2 — horizontal rule accent lines */}
      <div className="absolute inset-y-0 left-0 w-px bg-natural-border/60" />
      <div className="absolute inset-y-0 right-0 w-px bg-natural-border/60" />

      {/* Layer 3 — foreground copy (fastest) */}
      <motion.div
        style={{ opacity }}
        className="relative py-24 sm:py-32 px-4 sm:px-6 md:px-12"
      >
        <motion.div style={{ y: headingY }} className="text-center max-w-3xl mx-auto">
          <motion.span
            style={{ y: subY }}
            className="inline-flex items-center gap-3 text-[10px] font-bold tracking-[0.45em] uppercase text-natural-accent"
          >
            <span className="h-px w-8 bg-natural-accent/40" />
            The Collection
            <span className="h-px w-8 bg-natural-accent/40" />
          </motion.span>

          <h2 className="font-serif font-black text-4xl sm:text-5xl md:text-7xl leading-[0.95] mt-5 tracking-tight text-natural-text">
            Choose your<br />
            <em className="font-serif italic font-light">ritual.</em>
          </h2>

          <motion.p
            style={{ y: subY }}
            className="text-natural-text/50 mt-6 text-base sm:text-lg max-w-md mx-auto leading-relaxed"
          >
            Every coffee, every bag, every cup — handpicked by our master roasters.
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── Demo Storefront ────────────────────────────────────────────
function DemoStorefront({ products, onAddToCart }: { products: Product[]; onAddToCart: (name: string) => void }) {
  const beans = products.filter((p) => p.type === "beans");
  const bags = products.filter((p) => p.type === "bags");
  const merch = products.filter((p) => p.type === "merch");

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

      {/* ── Catalog intro — parallax editorial banner ──────────── */}
      <CatalogBanner />

      <div className="space-y-16 sm:space-y-24 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pb-24 pt-12">

      {/* Product Categories — slim cards with product preview strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6" id="categories">
        {[
          {
            title: "Coffee Beans",
            subtitle: `${beans.length} freshly roasted`,
            target: "section-beans",
            samples: beans.slice(0, 3),
            color: "from-amber-50 to-natural-paper",
          },
          {
            title: "Easy Coffee Bags",
            subtitle: `${bags.length} ground & packed`,
            target: "section-bags",
            samples: bags.slice(0, 3),
            color: "from-orange-50 to-natural-muted",
          },
          {
            title: "Merch",
            subtitle: `${merch.length} items`,
            target: "section-merch",
            samples: merch.slice(0, 3),
            color: "from-stone-100 to-natural-stone/30",
          },
        ].map((item) => (
          <button
            key={item.title}
            onClick={() => scrollTo(item.target)}
            className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-natural-border bg-gradient-to-br ${item.color} p-4 sm:p-6 h-auto flex items-center gap-3 sm:gap-5 text-left transition-all hover:shadow-xl hover:-translate-y-0.5 hover:border-natural-accent/30`}
          >
            {/* Stacked product previews */}
            <div className="relative flex -space-x-2 sm:-space-x-3 shrink-0">
              {item.samples.length === 0 ? (
                <div className="w-14 h-16 rounded-xl bg-natural-paper border border-natural-border" />
              ) : (
                item.samples.map((p, idx) => (
                  <div
                    key={p._id}
                    className="w-12 h-14 sm:w-16 sm:h-20 rounded-xl sm:rounded-2xl bg-natural-paper border-2 border-white shadow-md overflow-hidden"
                    style={{ zIndex: item.samples.length - idx, transform: `rotate(${(idx - 1) * 4}deg)` }}
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
              <h3 className="text-lg sm:text-2xl font-serif font-bold leading-tight">{item.title}</h3>
              <p className="text-xs sm:text-sm text-natural-text/60 font-medium mt-0.5 sm:mt-1">{item.subtitle}</p>
              <div className="mt-2 sm:mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-natural-accent">
                Browse
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </button>
        ))}
      </section>

      {/* ── Freshly Roasted Beans ──────────────────────────────── */}
      <section className="space-y-8 scroll-mt-24" id="section-beans">
        <div className="flex items-end border-b border-natural-border pb-6">
          <h3 className="text-2xl sm:text-4xl font-serif font-bold">Freshly Roasted Beans</h3>
          <span className="ml-auto text-xs text-natural-text/40 font-bold uppercase tracking-widest">{beans.length} varieties</span>
        </div>
        <HScrollRow products={beans} onAddToCart={onAddToCart} />
      </section>

      {/* ── Easy Coffee Bags ───────────────────────────────────── */}
      {bags.length > 0 && (
        <section className="space-y-8 scroll-mt-24" id="section-bags">
          <div className="flex items-end border-b border-natural-border pb-6">
            <h3 className="text-2xl sm:text-4xl font-serif font-bold">Easy Coffee Bags</h3>
            <span className="ml-auto text-xs text-natural-text/40 font-bold uppercase tracking-widest">{bags.length} options</span>
          </div>
          <HScrollRow products={bags} onAddToCart={onAddToCart} />
        </section>
      )}

      {/* ── Merch ──────────────────────────────────────────────── */}
      {merch.length > 0 && (
        <section className="space-y-8 scroll-mt-24" id="section-merch">
          <div className="flex items-end border-b border-natural-border pb-6">
            <h3 className="text-2xl sm:text-4xl font-serif font-bold">Merch</h3>
            <span className="ml-auto text-xs text-natural-text/40 font-bold uppercase tracking-widest">{merch.length} items</span>
          </div>
          <HScrollRow products={merch} onAddToCart={onAddToCart} />
        </section>
      )}

      {/* ── Our Story ──────────────────────────────────────────── */}
      <section className="scroll-mt-24" id="our-story">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-accent">
              Our Story
            </span>
            <h3 className="text-3xl sm:text-5xl font-serif font-bold leading-[1.1]">
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
            <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-4">
              {[
                { value: "12+", label: "Origins" },
                { value: "48hr", label: "Roast-to-ship" },
                { value: "4.7★", label: "Avg. rating" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl sm:text-3xl font-extrabold">{stat.value}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-natural-text/40 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="aspect-square rounded-[3rem] overflow-hidden">
            <img
              src={asset("assets/our-story.png")}
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
