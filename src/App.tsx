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
  type MotionValue,
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
  Newspaper,
  Menu,
} from "lucide-react";
import { api } from "../convex/_generated/api";
import { useMutation } from "convex/react";
import { useProducts } from "./lib/useProducts";
import { useStoryContent } from "./lib/useStoryContent";
import { useBannerSlides, useHeroContent, useSectionsContent, useChapters } from "./lib/useSiteContent";
import { DataBanner } from "./components/DataBanner";
import { DiscoveryWidget } from "./components/widget/DiscoveryWidget";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { SuperAdminDashboard } from "./components/admin/SuperAdminDashboard";
import { AdminAuthGate } from "./components/admin/AdminAuthGate";
import { LoadingScreen } from "./components/LoadingScreen";
import { SmartImage } from "./components/SmartImage";
import { ProductPage } from "./components/ProductPage";
import { CartPanel } from "./components/CartPanel";
import { CheckoutPage } from "./components/CheckoutPage";
import { OrderConfirmation } from "./components/OrderConfirmation";
import { OrderPortal } from "./components/OrderPortal";
import { ShopPage } from "./components/ShopPage";
import { SiteFooter } from "./components/SiteFooter";
import { GalaxySweep } from "./components/GalaxySweep";
import { SmoothScroll } from "./components/SmoothScroll";
import { CinematicHero, CurtainTransition, ChapterDeck } from "./components/Cinematic";
import type { ChapterConfig } from "./components/Cinematic";
import { EditorialHub } from "./components/EditorialHub";
import { PostDetail } from "./components/PostDetail";
import { slugify } from "./lib/slug";
import { asset } from "./lib/asset";
import type { Product } from "./types";
import { resolveTaxonomy } from "./types";

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

// ── Admin Panel routes (Convex Auth gated) ───────────────────
function MerchantGate() {
  return (
    <div className="font-sans">
      <AdminAuthGate panelLabel="Merchant">
        {(me) => <AdminDashboard me={me} />}
      </AdminAuthGate>
    </div>
  );
}

function SuperAdminGate() {
  return (
    <div className="font-sans">
      <AdminAuthGate panelLabel="Super Admin" requireSuperadmin>
        {(me) => <SuperAdminDashboard me={me} />}
      </AdminAuthGate>
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
  if (params.get("panel") === "superadmin") {
    return <SuperAdminGate />;
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
  const products = useProducts();
  const { toasts, show: showToast } = useToast();
  const [criticalReady, setCriticalReady] = useState(false);
  const [cart, setCart] = useState<{ productId: string; qty: number }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
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

    // Resolve geo once per session (cached).
    // Tries GPS first → reverse-geocode via Nominatim. Falls back to IP lookup if denied/unavailable.
    async function reverseGeocode(lat: number, lon: number): Promise<{ country?: string; countryCode?: string; region?: string; city?: string; locality?: string; postcode?: string }> {
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
      } catch {
        return {};
      }
    }

    async function getGpsGeo(): Promise<{ country?: string; countryCode?: string; region?: string; city?: string; locality?: string; postcode?: string; lat?: number; lon?: number } | null> {
      if (typeof navigator === "undefined" || !navigator.geolocation) return null;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 6000,
            maximumAge: 10 * 60 * 1000,
          });
        });
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const geo = await reverseGeocode(lat, lon);
        return { ...geo, lat, lon };
      } catch {
        return null;
      }
    }

    async function getIpGeo(): Promise<{ country?: string; countryCode?: string; region?: string; city?: string; lat?: number; lon?: number }> {
      // Try multiple endpoints — they fail/rate-limit/CORS-block at different times.
      try {
        const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(2500) });
        if (res.ok) {
          const d = await res.json();
          if (d && !d.error && d.country_name) {
            return {
              country: d.country_name,
              countryCode: d.country_code,
              region: d.region,
              city: d.city,
              lat: typeof d.latitude === "number" ? d.latitude : undefined,
              lon: typeof d.longitude === "number" ? d.longitude : undefined,
            };
          }
        }
      } catch { /* try next */ }
      try {
        const res = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(2500) });
        if (res.ok) {
          const d = await res.json();
          if (d && d.success !== false && d.country) {
            return {
              country: d.country,
              countryCode: d.country_code,
              region: d.region,
              city: d.city,
              lat: typeof d.latitude === "number" ? d.latitude : undefined,
              lon: typeof d.longitude === "number" ? d.longitude : undefined,
            };
          }
        }
      } catch { /* try next */ }
      try {
        const res = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const { ip } = await res.json();
          if (ip) {
            const r2 = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(2500) });
            if (r2.ok) {
              const d = await r2.json();
              if (d && d.country_name) {
                return {
                  country: d.country_name,
                  countryCode: d.country_code,
                  region: d.region,
                  city: d.city,
                  lat: typeof d.latitude === "number" ? d.latitude : undefined,
                  lon: typeof d.longitude === "number" ? d.longitude : undefined,
                };
              }
            }
          }
        }
      } catch { /* give up */ }
      return {};
    }

    async function resolveGeo(): Promise<{ country?: string; countryCode?: string; region?: string; city?: string; locality?: string; postcode?: string; lat?: number; lon?: number; geoSource?: string }> {
      try {
        const cached = sessionStorage.getItem("brewmatch:geo");
        if (cached) {
          const parsed = JSON.parse(cached);
          // Only use cache if it has actual geo data; otherwise retry below.
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
      // If IP gave us coords but no city, try reverse-geocoding those coords.
      if (ip.lat != null && ip.lon != null && (!ip.city || !ip.locality)) {
        const rev = await reverseGeocode(ip.lat, ip.lon);
        Object.assign(ip, { ...rev });
      }
      const out = { ...ip, geoSource: "ip" };
      // Cache only if we actually got something useful — otherwise retry next page.
      if (ip.country) {
        try { sessionStorage.setItem("brewmatch:geo", JSON.stringify(out)); } catch { /* ignore */ }
      }
      return out;
    }

    resolveGeo().then((geo) => {
      recordPageView({
        path: window.location.pathname,
        sessionId,
        referrer: document.referrer || undefined,
        ...geo,
      }).then((id: any) => { pvId = id; });
    });

    const handleUnload = () => {
      if (pvId) {
        const duration = Math.round((Date.now() - start) / 1000);
        updatePageViewDuration({ id: pvId as any, duration });
      }
    };
    window.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") handleUnload(); });
    return () => { handleUnload(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [tiSweep, setTiSweep] = useState<{ x: number; y: number } | null>(null);
  const openTI = (e?: React.MouseEvent) => {
    if (e) {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setTiSweep({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    } else {
      setTiSweep({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }
  };
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

  // Nav click — page routes first, then scroll to section
  const handleNavTo = useCallback((target: string) => {
    if (target === "third-circle") {
      navigateTo({ page: "third-circle" });
      return;
    }
    // If we're on a sub-page (editorial, product, etc.), go home first then scroll
    const currentPage = new URLSearchParams(window.location.search).get("page");
    if (currentPage) {
      navigateTo({ page: null, product: null, post: null });
      setTimeout(() => scrollTo(target), 560);
      return;
    }
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
  // Frosted glass: stays translucent across the whole scroll range, just nudges saturation/shadow.
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 120], ["rgba(250,249,246,0.35)", "rgba(250,249,246,0.62)"]);
  const headerBorder = useTransform(scrollY, [0, 120], ["rgba(255,255,255,0.25)", "rgba(255,255,255,0.45)"]);
  const headerShadow = useTransform(
    scrollY,
    [0, 120],
    ["0 0 0 rgba(0,0,0,0)", "0 10px 40px -12px rgba(44,24,16,0.12)"]
  );

  // ── Full-page route: TI (Third Intelligence) ─────────────────
  if (page === "ti") {
    return (
      <div className="h-screen overflow-hidden bg-[#050E1F] text-natural-text font-sans">
        <DiscoveryWidget
          onClose={() => navigateTo({ page: null })}
          onNavigateToProduct={(slug) => navigateTo({ page: null, product: slug })}
          onAddToCart={(productId) => addToCart(productId)}
        />
      </div>
    );
  }

  // ── Full-page route: Editorial Hub / Journal ─────────────────
  if (page === "third-circle") {
    const postId = params.get("post");
    if (postId) {
      return (
        <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col">
          <MorphingHeader
            headerBg="rgba(250,249,246,1)"
            headerBorder="rgba(201,192,183,0.5)"
            headerShadow="0 2px 12px -4px rgba(44,24,16,0.10)"
            onOpenTI={(e) => { e.stopPropagation(); navigateTo({ page: "ti" }); }}
            onOpenCart={() => {}}
            onNavTo={handleNavTo}
            cartCount={cartCount}
            activeOverride="editorial"
          />
          <div className="flex-1 pt-20">
            <PostDetail
              postId={postId}
              onBack={() => navigateTo({ page: "third-circle", post: null })}
              onProductClick={(id) => navigateTo({ page: null, product: id, post: null })}
            />
          </div>
          <SiteFooter
            onNavigate={(t) => navigateTo({ page: t === "home" ? null : t })}
          />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col">
        <MorphingHeader
          headerBg="rgba(250,249,246,1)"
          headerBorder="rgba(201,192,183,0.5)"
          headerShadow="0 2px 12px -4px rgba(44,24,16,0.10)"
          onOpenTI={(e) => { e.stopPropagation(); navigateTo({ page: "ti" }); }}
          onOpenCart={() => {}}
          onNavTo={handleNavTo}
          cartCount={cartCount}
          activeOverride="editorial"
        />
        <div className="flex-1 pt-20">
          <EditorialHub
            onProductClick={(id) => navigateTo({ page: null, product: id })}
            onPostOpen={(id) => navigateTo({ page: "third-circle", post: id })}
          />
        </div>
        <SiteFooter
          onNavigate={(t) => navigateTo({ page: t === "home" ? null : t })}
        />
      </div>
    );
  }

  // ── Full-page route: Order Portal ──────────────────────────────
  if (page === "order-portal") {
    const orderPortalId = params.get("id") ?? undefined;
    return (
      <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col">
        <div className="flex-1">
          <OrderPortal initialOrderId={orderPortalId} />
        </div>
        <SiteFooter
          onNavigate={(t) => navigateTo({ page: t === "home" ? null : t })}
        />
        <ToastContainer toasts={toasts} />
      </div>
    );
  }

  // ── Full-page route: Order Confirmation ────────────────────
  if (page === "order-confirmation" && currentOrderId) {
    return (
      <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col">
        <div className="flex-1">
          <OrderConfirmation
            orderId={currentOrderId}
            onContinueShopping={() => { setCart([]); setCurrentOrderId(null); navigateTo({ page: null }); }}
          />
        </div>
        <SiteFooter
          onNavigate={(t) => navigateTo({ page: t === "home" ? null : t })}
        />
      </div>
    );
  }

  // ── Full-page route: Checkout ───────────────────────────────
  if (page === "checkout") {
    return (
      <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col">
        <div className="flex-1">
          <CheckoutPage
            cart={cart}
            products={products ?? []}
            onClose={() => { navigateTo({ page: null }); setCartOpen(true); }}
            onOrderCreated={(orderId) => { setCurrentOrderId(orderId); navigateTo({ page: "order-confirmation" }); }}
          />
        </div>
        <SiteFooter
          onNavigate={(t) => navigateTo({ page: t === "home" ? null : t })}
        />
      </div>
    );
  }

  // ── Full-page route: Product detail (must come BEFORE Shop so clicks navigate) ──
  if (activeProductId) {
    return (
      <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col">
        <div className="flex-1">
          <ProductPage
            productId={activeProductId}
            onAddToCart={(productId, qty) => { addToCart(productId, qty); setCartOpen(true); }}
            onOpenCart={() => setCartOpen(true)}
            cartCount={cartCount}
          />
        </div>
        <SiteFooter
          onNavigate={(t) => navigateTo({ page: t === "home" ? null : t, product: null })}
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

  // ── Full-page route: Shop ──────────────────────────────────
  if (page === "shop") {
    return (
      <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col">
        <div className="flex-1">
          <ShopPage
            cart={cart}
            onAddToCart={(productId) => { addToCart(productId); }}
            onProductClick={(slug) => navigateTo({ page: null, product: slug })}
            onGoToCart={() => setCartOpen(true)}
          />
        </div>
        <SiteFooter
          onNavigate={(t) => navigateTo({ page: t === "home" ? null : t })}
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

      <SiteFooter
        onNavigate={(t) => navigateTo({ page: t === "home" ? null : t })}
        onScrollTo={(id) => scrollTo(id)}
      />

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

      {/* Galaxy-AI style sweep when opening Third Intelligence */}
      {tiSweep && (
        <GalaxySweep
          origin={tiSweep}
          onComplete={() => {
            setTiSweep(null);
            navigateTo({ page: "ti" });
          }}
        />
      )}
    </div>
  );
}

// ── Mobile bottom nav pill ───────────────────────────────────
function MobileBottomNav({ onOpenTI, onOpenCart, onNavTo, cartCount = 0 }: { onOpenTI: (e: React.MouseEvent) => void; onOpenCart: () => void; onNavTo: (target: string) => void; cartCount?: number }) {
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
  { key: "beans", label: "Beans", target: "section-coffee-beans", Icon: Coffee },
  { key: "bags", label: "Coffee Bags", target: "section-coffee-ecb", Icon: Package },
  { key: "merch", label: "Merch", target: "section-merch-drinkware", Icon: ShoppingBag },
  { key: "story", label: "Our Story", target: "our-story", Icon: BookOpen },
  { key: "editorial", label: "Third Circle", target: "third-circle", Icon: Newspaper },
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
  activeOverride,
}: {
  headerBg: any;
  headerBorder: any;
  headerShadow: any;
  onOpenTI: (e: React.MouseEvent) => void;
  onOpenCart: () => void;
  onNavTo: (target: string) => void;
  cartCount?: number;
  activeOverride?: string;
}) {
  const sectionActive = useActiveSection();
  const active = activeOverride ?? sectionActive;
  const { scrollY } = useScroll();
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl saturate-150 border-b"
    >
      {/* Top bar row */}
      <motion.div
        animate={{ paddingTop: compact ? 8 : 14, paddingBottom: compact ? 8 : 14 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-3 md:grid-cols-[1fr_auto_1fr] items-center"
      >
        {/* LEFT — hamburger on mobile, logo on desktop */}
        <div className="flex items-center justify-start">
          {/* Hamburger (mobile only) */}
          <button
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-full hover:bg-natural-muted/60 transition-colors text-natural-text/70"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.span
                  key="x"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-center"
                >
                  <Menu className="w-5 h-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          {/* Logo (desktop only) */}
          <button
            onClick={() => onNavTo("hero")}
            className="hidden md:flex items-center justify-start"
            aria-label="Third Wave Coffee—home"
          >
            <motion.img
              layoutId="brand-logo"
              src={asset("logo.png")}
              alt="Third Wave Coffee"
              initial={false}
              animate={{ height: compact ? 40 : 56 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-auto"
            />
          </button>
        </div>

        {/* CENTER — logo on mobile (centered), nav on desktop */}
        <div className="flex items-center justify-center">
          {/* Logo (mobile only, centered) */}
          <button
            onClick={() => { onNavTo("hero"); setMenuOpen(false); }}
            className="md:hidden flex items-center justify-center"
            aria-label="Third Wave Coffee—home"
          >
            <motion.img
              src={asset("logo.png")}
              alt="Third Wave Coffee"
              initial={false}
              animate={{ height: compact ? 36 : 44 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-auto"
            />
          </button>
          {/* Nav (desktop only) */}
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
            <TIHeaderButton compact={compact} onClick={onOpenTI} />
          </nav>
        </div>

        {/* RIGHT — cart (always visible) */}
        <div className="flex items-center gap-1 justify-end">
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

      {/* Mobile collapsible menu */}
      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-t border-natural-border/50"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => { onNavTo(item.target); setMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                    active === item.key
                      ? "bg-natural-accent text-white"
                      : "text-natural-text/70 hover:bg-natural-muted/60 hover:text-natural-text"
                  }`}
                >
                  <item.Icon className="w-5 h-5 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              <button
                onClick={(e) => { onOpenTI(e); setMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-natural-text/70 hover:bg-natural-muted/60 hover:text-natural-text"
              >
                <img src={asset("third-intelligence-icon.png")} alt="" className="w-5 h-5 object-contain" />
                <span className="font-medium">Third Intelligence</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
function TIHeaderButton({ compact, onClick }: { compact: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      title="Third Intelligence"
      aria-label="Third Intelligence"
      className={`relative flex items-center rounded-full hover:bg-natural-muted/60 transition-colors text-natural-text/70 hover:text-natural-text ${
        compact ? "h-10 w-10 justify-center" : "h-10 px-4 gap-2"
      }`}
    >
      <span className="relative flex items-center justify-center w-5 h-5 shrink-0">
        <motion.span
          aria-hidden
          animate={{ scale: [1, 1.55], opacity: [0.55, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", repeatDelay: 0.1 }}
          style={{ willChange: "transform, opacity", transformOrigin: "center" }}
          className="absolute inset-0 m-auto rounded-full bg-natural-accent/40 pointer-events-none"
        />
        <img
          src={asset("third-intelligence-icon.png")}
          alt=""
          className="relative z-10 w-5 h-5 object-contain"
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
            className="overflow-hidden text-sm font-medium whitespace-nowrap"
          >
            Intelligence
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ── Product Card Component ─────────────────────────────────────
function ProductCard({ product, onAddToCart, imageParallaxX }: {
  product: Product;
  onAddToCart: (name: string) => void;
  imageParallaxX?: MotionValue<number>;
}) {
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
        className="aspect-[4/5] glass-card rounded-[2rem] overflow-hidden group-hover:shadow-2xl transition-all group-hover:-translate-y-1 relative preserve-3d cursor-pointer"
        style={{ transform: "translateZ(20px)" }}
        onClick={() => navigateTo({ product: slugify(product.name) })}
      >
        {/* Image — wider than card when parallax is active so the shift has room */}
        {imageParallaxX ? (
          <motion.div
            className="absolute h-full"
            style={{ width: "140%", left: "-20%", x: imageParallaxX }}
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
        {/* Quick-add button */}
        <div
          onClick={(e) => { e.stopPropagation(); onAddToCart(product.name); }}
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
// Approx stride per card at md breakpoint (256px + 20px gap). Used for parallax offset math.
const HSCROLL_CARD_STRIDE = 276;

function HScrollRow({ products, onAddToCart }: { products: Product[]; onAddToCart: (name: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const velRef    = useRef(0);
  const rafRef    = useRef(0);
  const drag = useRef({ active: false, startX: 0, startSL: 0, lastX: 0, lastT: 0, vel: 0, moved: false });

  // MotionValue tracking scrollLeft — updated via native scroll event so parallax
  // image transforms bypass React reconciliation entirely (direct DOM updates).
  const scrollX = useMotionValue(0);
  const viewportW = useMotionValue(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => scrollX.set(el.scrollLeft);
    const onResize = () => viewportW.set(el.clientWidth);
    onResize();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [scrollX, viewportW]);

  // rAF inertia loop — friction 0.87 gives a smooth, gentle coast that stops naturally
  const runInertia = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const el = scrollRef.current;
    if (!el) return;
    const tick = () => {
      velRef.current *= 0.87;
      if (Math.abs(velRef.current) < 0.25) { velRef.current = 0; return; }
      el.scrollLeft += velRef.current;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Wheel: only intercept clearly-horizontal trackpad swipes — vertical passes through to Lenis
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5;
      if (!isHorizontal) return; // vertical scroll: don't block, let page scroll
      e.preventDefault();
      velRef.current += e.deltaX * 0.22;
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
      velRef.current = drag.current.vel * 6;
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
      {products.map((p, i) => (
        <HScrollCard key={p._id} product={p} index={i} scrollX={scrollX} viewportW={viewportW} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}

// ── HScrollCard — card in the horizontal scroll row with image parallax ──────
function HScrollCard({
  product, index, scrollX, viewportW, onAddToCart,
}: {
  product: Product;
  index: number;
  scrollX: MotionValue<number>;
  viewportW: MotionValue<number>;
  onAddToCart: (name: string) => void;
}) {
  // Parallax centred on the visible viewport: the card currently nearest the
  // viewport centre gets ≈ 0 offset (image fully centred), neighbours drift
  // a few pixels for a depth feel. Factor is small so 4 visible cards all
  // remain visually centred within their frames.
  const imageX = useTransform([scrollX, viewportW] as const, ([sl, vw]) => {
    const cardCentre = index * HSCROLL_CARD_STRIDE + HSCROLL_CARD_STRIDE / 2;
    const viewCentre = (sl as number) + (vw as number) / 2;
    return (cardCentre - viewCentre) * 0.03;
  });
  return (
    <div className="flex-shrink-0 w-48 sm:w-56 md:w-64">
      <ProductCard product={product} onAddToCart={onAddToCart} imageParallaxX={imageX} />
    </div>
  );
}

// ── Catalog parallax banner ────────────────────────────────────
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
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const wordmarkY = useTransform(scrollYProgress, [0, 1], ["30%", "-30%"]);
  const headingY  = useTransform(scrollYProgress, [0, 1], ["18%", "-18%"]);
  const subY      = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);
  const opacity   = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [0, 1, 1, 0]);
  // Whole dark backdrop parallaxes as one piece
  const bgY       = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden"
      style={{ perspective: "600px" }}
    >
      {/* Solid dark backdrop — parallaxes as a single rectangle */}
      <motion.div
        style={{ y: bgY }}
        className="absolute -inset-y-[15%] inset-x-0 bg-[#1A0F08] pointer-events-none"
      />

      {/* Ghost wordmark */}
      <motion.div
        style={{ y: wordmarkY }}
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center pointer-events-none select-none overflow-hidden"
      >
        <span className="font-serif font-black text-[clamp(5rem,20vw,18rem)] leading-none tracking-tight text-white/[0.05]">
          COLLECTION
        </span>
      </motion.div>

      <motion.div
        style={{ opacity }}
        className="relative py-24 sm:py-32 px-4 sm:px-6 md:px-12"
      >
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
            {titleHead}{titleTail ? <br /> : null}
            {titleTail ? <em className="font-serif italic font-light text-amber-200/80">{titleTail}</em> : null}
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

// ── Bento tile (used by DemoStorefront category grid) ──────────
type BentoTileData = {
  title: string;
  target: string;
  items: Product[];
  span: string;   // kept for backwards compat, not used in new layout
  accent: string;
};
function BentoTile({ tile, onClick, tall = false }: { tile: BentoTileData; onClick: () => void; tall?: boolean }) {
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
      {/* Full-bleed image */}
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

      {/* Scrim — heavy at bottom, light at top */}
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-black/10" />

      {/* Thumbnail stack — top-right */}
      {samples.length > 0 && (
        <div className="absolute top-3 right-3 flex -space-x-2 z-10">
          {samples.map((p, idx) => (
            <div
              key={p._id}
              className="w-9 h-9 rounded-xl bg-white/90 border-2 border-white shadow-md overflow-hidden"
              style={{ zIndex: samples.length - idx }}
            >
              <SmartImage src={p.imageUrl} blur={p.imageBlur} alt="" className="object-cover" wrapperClassName="w-full h-full" />
            </div>
          ))}
        </div>
      )}

      {/* Text overlay — bottom */}
      <div className="relative mt-auto p-4 sm:p-5 z-10">
        <h3 className={`font-serif font-bold leading-tight text-white ${
          tall ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
        }`}>{tile.title}</h3>
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

// ── Our Story slideshow + parallax ───────────────────────────
const FALLBACK_STORY_SLIDES = [
  asset("assets/our-story.png"),
];

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

  // Keep idx in range if slides shrink
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
      <motion.div
        className="absolute inset-[-4%] w-[108%] h-[108%]"
        style={{ x: imgX, y: imgY }}
      >
        <AnimatePresence mode="crossfade">
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

// ── Demo Storefront ────────────────────────────────────────────
function DemoStorefront({ products, onAddToCart }: { products: Product[]; onAddToCart: (name: string) => void }) {
  const story = useStoryContent();
  const heroContent = useHeroContent();
  const sectionsContent = useSectionsContent();
  const cmsBannerSlides = useBannerSlides();
  const cmsChapters = useChapters();
  // Bucket products by the new two-tier taxonomy. `resolveTaxonomy` honours
  // explicit fields and falls back to legacy `type` so un-migrated rows still
  // land in a sensible bucket.
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

  // Chapter hero pick — best-rated bean / first ECB / first drinkware piece.
  const featuredBean = [...coffeeBeans].sort(
    (a, b) => (b.rating ?? 0) - (a.rating ?? 0)
  )[0];
  const featuredBag = coffeeEcb[0];
  const featuredMerch = merchDrinkware[0] ?? merchKeychains[0] ?? merchBags[0];
  const featuredBrewing = coffeeBrewing[0] ?? merchBrewing[0];
  const featuredKeychain = merchKeychains[0] ?? merchBags[0] ?? merchChocolates[0];

  // Bento tile descriptors — one per subcategory, declared once and reused.
  type Tile = {
    title: string;
    target: string;
    items: Product[];
    span: string;   // tailwind col-span class for desktop
    accent: string; // gradient class
  };
  // Single bento grid covering all 8 subcategories. Spans are tuned for a
  // 6-col layout: hero (beans) takes a 3x2 block, drinkware claims a tall
  // 2x2, smaller tiles flow around with dense auto-placement.
  const allTiles: Tile[] = [
    { title: "Freshly Roasted Beans",   target: "section-coffee-beans",     items: coffeeBeans,    span: "md:col-span-3 md:row-span-2", accent: "from-amber-100 via-amber-50 to-natural-paper" },
    { title: "Easy Coffee Bags",        target: "section-coffee-ecb",       items: coffeeEcb,      span: "md:col-span-2 md:row-span-1", accent: "from-orange-50 to-natural-muted" },
    { title: "Coffee · Brewing Tools",  target: "section-coffee-brewing",   items: coffeeBrewing,  span: "md:col-span-1 md:row-span-1", accent: "from-stone-100 to-natural-paper" },
    { title: "Drinkware",               target: "section-merch-drinkware",  items: merchDrinkware, span: "md:col-span-3 md:row-span-1", accent: "from-emerald-100 via-emerald-50 to-natural-paper" },
    { title: "Bags",                    target: "section-merch-bags",       items: merchBags,      span: "md:col-span-2 md:row-span-1", accent: "from-rose-50 to-natural-paper" },
    { title: "Keychains & Accessories", target: "section-merch-keychains",  items: merchKeychains, span: "md:col-span-2 md:row-span-1", accent: "from-sky-50 to-natural-paper" },
    { title: "Chocolates & Nuts",       target: "section-merch-chocolates", items: merchChocolates, span: "md:col-span-2 md:row-span-1", accent: "from-yellow-50 to-natural-paper" },
    { title: "Brewing Tools",           target: "section-merch-brewing",    items: merchBrewing,    span: "md:col-span-2 md:row-span-1", accent: "from-slate-100 to-natural-paper" },
  ].filter((t) => t.items.length > 0);

  // All sections in display order — rendered as <HScrollRow>s below the bento.
  const sections: { id: string; title: string; items: Product[] }[] = [
    { id: "section-coffee-beans",      title: "Freshly Roasted Beans",     items: coffeeBeans },
    { id: "section-coffee-ecb",        title: "Easy Coffee Bags",          items: coffeeEcb },
    { id: "section-coffee-brewing",    title: "Coffee · Brewing Tools",    items: coffeeBrewing },
    { id: "section-merch-drinkware",   title: "Drinkware",                 items: merchDrinkware },
    { id: "section-merch-bags",        title: "Bags",                      items: merchBags },
    { id: "section-merch-keychains",   title: "Keychains & Accessories",   items: merchKeychains },
    { id: "section-merch-chocolates",  title: "Chocolates & Nuts",         items: merchChocolates },
    { id: "section-merch-brewing",     title: "Merch · Brewing Tools",     items: merchBrewing },
  ].filter((s) => s.items.length > 0);

  const goToCatalog = () => {
    const el = document.getElementById(sections[0]?.id ?? "categories");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const heroSlides = cmsBannerSlides.length > 0
    ? cmsBannerSlides.map((slide, i) => <DataBanner key={`cms-${i}`} slide={slide} />)
    : [
        <FizzBanner key="fizz" />,
        <DessertsBanner key="desserts" />,
      ];

  return (
    <div>
      {/* ── Cinematic Hero ─────────────────────────────────────── */}
      <CinematicHero
        slides={heroSlides}
        onScrollHint={goToCatalog}
        hero={heroContent}
      />

      {/* ── Curtain into editorial chapter 01 ──────────────────── */}
      <CurtainTransition color="bg-natural-paper" />

      {/* ── Chapter deck: 5 stacked cards. Each scrolls through its
            own parallax pass, then flips out to reveal the next. ── */}
      <ChapterDeck
        chapters={cmsChapters
          ? cmsChapters.map<ChapterConfig>((c) => {
              const linked = c.productSlug ? products.find((p) => slugify(p.name) === c.productSlug) : undefined;
              return {
                index: c.index,
                eyebrow: c.eyebrow,
                title: (
                  <>
                    {c.titleHead}
                    {c.titleItalic ? <><br /><em className="font-serif italic font-light">{c.titleItalic}</em></> : null}
                  </>
                ),
                body: c.body,
                callouts: c.callouts ?? [],
                product: linked,
                imageUrl: c.imageUrl,
                imageAlt: c.eyebrow,
                align: c.align,
                theme: c.theme,
                onProductClick: linked ? () => navigateTo({ product: slugify(linked.name) }) : undefined,
              };
            })
          : [
          {
            index: "01 / 05",
            eyebrow: "Sourcing",
            title: <>Single origins.<br /><em className="font-serif italic font-light">Patient craft.</em></>,
            body: "Every harvest is hand-selected from partner farms across the Western Ghats and beyond. Beans rest, breathe, then meet our roasters for a slow, deliberate transformation.",
            callouts: ["Direct trade", "Hand-picked", "Estate-grown", "Traceable"],
            product: featuredBean,
            align: "left",
            theme: "light",
            onProductClick: featuredBean ? () => navigateTo({ product: slugify(featuredBean.name) }) : undefined,
          },
          {
            index: "02 / 05",
            eyebrow: "Craft",
            title: <>The art of <em className="font-serif italic font-light">roasting.</em></>,
            body: "Small-batch drums turn at the rhythm of our master roasters. Every degree, every minute is calibrated until the bean reveals its sweetest, most honest self — then packed whole, ground, or as Easy Coffee Bags ready to brew.",
            callouts: ["Small batch", "Slow roasted", "Cupped daily", "Brew-ready"],
            product: featuredBag,
            align: "right",
            theme: "dark",
            onProductClick: featuredBag ? () => navigateTo({ product: slugify(featuredBag.name) }) : undefined,
          },
          {
            index: "03 / 05",
            eyebrow: "Brewing",
            title: <>Built to <em className="font-serif italic font-light">brew.</em></>,
            body: "Grinders that whisper, presses that bloom, kettles tuned for that gooseneck pour. The tools we trust to coax the best out of every roast — now in your kitchen.",
            callouts: ["Curated", "Barista-tested", "Coffee-first", "Built to last"],
            product: featuredBrewing ?? featuredBag,
            align: "left",
            theme: "light",
            onProductClick: featuredBrewing ? () => navigateTo({ product: slugify(featuredBrewing.name) }) : undefined,
          },
          {
            index: "04 / 05",
            eyebrow: "Drinkware",
            title: <>The vessel <em className="font-serif italic font-light">matters.</em></>,
            body: "Ceramic that keeps the crema, double-walls that hold the heat, tumblers that travel as well as you do. Cups, mugs and bottles we'd reach for first thing in the morning.",
            callouts: ["Hand-finished", "Built for daily use", "Travel-ready"],
            product: featuredMerch,
            align: "right",
            theme: "dark",
            onProductClick: featuredMerch ? () => navigateTo({ product: slugify(featuredMerch.name) }) : undefined,
          },
          {
            index: "05 / 05",
            eyebrow: "Ritual",
            title: <>Pour. Pause. <em className="font-serif italic font-light">Repeat.</em></>,
            body: "From the first wisp of steam to the last warm sip — what we craft is meant to anchor the small, beautiful pauses in your day. Bags, keychains and trinkets that carry the ritual with you.",
            callouts: ["Carry it everywhere", "Made to share", "Everyday joy"],
            product: featuredKeychain ?? featuredMerch ?? featuredBean,
            align: "left",
            theme: "light",
            onProductClick: featuredKeychain
              ? () => navigateTo({ product: slugify(featuredKeychain.name) })
              : featuredMerch
              ? () => navigateTo({ product: slugify(featuredMerch.name) })
              : undefined,
          },
        ]}
      />

      {/* ── Straight from the last chapter into the catalog banner.
            No curtain in between: the deck's final card already sits on
            paper and CatalogBanner is paper too — a curtain would just
            be a blank stretch of identical color, reading as dead space. ── */}

      {/* ── Catalog intro — parallax editorial banner ──────────── */}
      <CatalogBanner
        eyebrow={sectionsContent.catalogBanner.eyebrow}
        title={sectionsContent.catalogBanner.title}
      />

      <div className="space-y-16 sm:space-y-24 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pb-24 pt-12">

      {/* ── Bento grid (desktop) / stacked tiles (mobile) ──────── */}
      <section id="categories" className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-natural-accent">{sectionsContent.categories.eyebrow}</p>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black mt-2">{sectionsContent.categories.title}</h2>
          </div>
          <span className="hidden sm:inline text-xs text-natural-text/40 font-bold uppercase tracking-widest">
            {allTiles.length} categories
          </span>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {/* Row 1: hero tile + 2 stacked side tiles */}
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4" style={{ minHeight: '360px' }}>
            {/* Hero — Beans */}
            {allTiles[0] && (
              <div className="md:flex-[3] flex flex-col min-h-[260px] md:min-h-0">
                <BentoTile tile={allTiles[0]} onClick={() => scrollTo(allTiles[0].target)} tall />
              </div>
            )}
            {/* Side stack — next 2 tiles */}
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
          {/* Row 2+: remaining tiles in a clean even grid */}
          {allTiles.slice(3).length > 0 && (
            <div className={`grid gap-3 sm:gap-4 grid-cols-2 ${
              allTiles.slice(3).length <= 2 ? 'sm:grid-cols-2' :
              allTiles.slice(3).length === 3 ? 'sm:grid-cols-3' :
              'sm:grid-cols-2 md:grid-cols-4'
            }`}>
              {allTiles.slice(3).map((t) => (
                <BentoTile key={t.target} tile={t} onClick={() => scrollTo(t.target)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Product sections — one per non-empty subcategory ───── */}
      {sections.map((s) => (
        <section key={s.id} id={s.id} className="space-y-8 scroll-mt-24">
          <div className="flex items-end border-b border-natural-border pb-6">
            <h3 className="text-2xl sm:text-4xl font-serif font-bold">{s.title}</h3>
            <span className="ml-auto text-xs text-natural-text/40 font-bold uppercase tracking-widest">
              {s.items.length} {s.items.length === 1 ? "option" : "options"}
            </span>
          </div>
          <HScrollRow products={s.items} onAddToCart={onAddToCart} />
        </section>
      ))}

      {/* ── Our Story ──────────────────────────────────────────── */}
      <section className="scroll-mt-24" id="our-story">
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
