/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useInView,
} from "motion/react";
import {
  ShoppingCart,
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
            <a href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Third Wave Coffee" className="h-10 w-auto" />
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
          <img src="/logo.png" alt="Third Wave Coffee" className="h-16 w-auto" />
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
export default function App() {
  // Route to merchant panel if ?panel=merchant in URL
  const isMerchantPanel = new URLSearchParams(window.location.search).get("panel") === "merchant";
  if (isMerchantPanel) {
    return <MerchantGate />;
  }

  return <Storefront />;
}

function Storefront() {
  const products = useQuery(api.products.list);
  const { toasts, show: showToast } = useToast();
  const [widgetOpen, setWidgetOpen] = useState(false);

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
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans selection:bg-natural-accent/20 scroll-smooth">
      <ScrollProgressBar />
      {/* Main Navigation Header */}
      <motion.header
        style={{
          backgroundColor: headerBg,
          borderBottomColor: headerBorder,
          boxShadow: headerShadow,
        }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b px-6 py-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => scrollTo("hero")}
          >
            <img src="/logo.png" alt="Third Wave Coffee" className="h-10 w-auto" />
          </div>

          <nav className="flex items-center gap-6 text-sm font-serif font-bold">
            <button
              onClick={() => scrollTo("section-beans")}
              className="text-natural-text/60 hover:text-natural-accent transition-colors"
            >
              Beans
            </button>
            <button
              onClick={() => scrollTo("section-bags")}
              className="text-natural-text/60 hover:text-natural-accent transition-colors"
            >
              Coffee Bags
            </button>
            <button
              onClick={() => scrollTo("section-merch")}
              className="text-natural-text/60 hover:text-natural-accent transition-colors"
            >
              Merch
            </button>
            <button
              onClick={() => scrollTo("our-story")}
              className="text-natural-text/60 hover:text-natural-accent transition-colors"
            >
              Our Story
            </button>
            <motion.button
              onClick={() => setWidgetOpen(true)}
              className="relative flex items-center justify-center group"
              title="Third Intelligence — Find Your Match"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              {/* Pulse rings — warm natural-accent tones */}
              <motion.div
                animate={{ scale: [1, 1.9], opacity: [0.45, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute w-11 h-11 rounded-full bg-natural-accent/35"
              />
              <motion.div
                animate={{ scale: [1, 1.9], opacity: [0.4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.7 }}
                className="absolute w-11 h-11 rounded-full bg-natural-accent/25"
              />
              {/* Soft outer glow on hover */}
              <div className="absolute w-11 h-11 rounded-full bg-natural-accent/0 group-hover:bg-natural-accent/15 transition-colors blur-md" />
              {/* Icon container — paper aesthetic matching site */}
              <div className="relative w-10 h-10 rounded-full bg-natural-paper border border-natural-border shadow-sm group-hover:shadow-md group-hover:border-natural-accent/40 flex items-center justify-center overflow-hidden transition-all">
                <img
                  src="/third-intelligence-icon.png"
                  alt="Third Intelligence"
                  className="w-full h-full object-contain scale-90"
                />
              </div>
            </motion.button>
          </nav>

          <button
            onClick={() => showToast("Cart coming soon!", "cart")}
            className="flex items-center gap-2 bg-natural-accent text-white px-5 py-2.5 rounded-full text-sm font-serif font-bold hover:bg-natural-text transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart
          </button>
        </div>
      </motion.header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto" id="storefront-view">
          <DemoStorefront products={products ?? []} onAddToCart={(name) => showToast(`${name} added to cart`)} />
          <DiscoveryWidget open={widgetOpen} onClose={() => setWidgetOpen(false)} />
        </div>
      </main>

      <footer className="py-16 border-t border-natural-border bg-natural-paper" id="footer">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
            <div className="space-y-4 max-w-sm">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Third Wave Coffee" className="h-8 w-auto" />
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
    </div>
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
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
          <h4 className="text-lg font-bold leading-tight">{product.name}</h4>
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
    <div className="group flex flex-col md:flex-row bg-natural-paper rounded-[2.5rem] border border-natural-border overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1">
      <div className="w-full md:w-48 h-48 md:h-auto overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="flex-1 p-8 flex flex-col justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-natural-accent">
            {product.category}
          </span>
          <h4 className="text-xl font-bold mt-1">{product.name}</h4>
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
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  // Background drifts upward as you scroll past the hero
  const heroBgY = useTransform(heroProgress, [0, 1], ["0%", "30%"]);
  const heroScale = useTransform(heroProgress, [0, 1], [1, 1.15]);
  // Content fades + lifts slightly
  const heroContentY = useTransform(heroProgress, [0, 1], [0, -60]);
  const heroContentOpacity = useTransform(heroProgress, [0, 0.7], [1, 0.2]);
  const beans = products.filter((p) => p.type === "beans");
  const bags = products.filter((p) => p.type === "bags");
  const merch = products.filter((p) => p.type === "merch");

  const [showAllBeans, setShowAllBeans] = useState(false);
  const [showAllBags, setShowAllBags] = useState(false);

  const visibleBeans = showAllBeans ? beans : beans.slice(0, 4);
  const visibleBags = showAllBags ? bags : bags.slice(0, 4);

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative h-[70vh] rounded-[3rem] overflow-hidden bg-natural-text flex items-center px-12"
        id="hero"
      >
        <motion.div
          style={{ y: heroBgY, scale: heroScale }}
          className="absolute inset-0 opacity-50 bg-cover bg-center"
        >
          <div
            className="w-full h-[130%] bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=2070)",
            }}
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#2C1810] via-[#2C1810]/60 to-transparent" />

        <motion.div
          style={{ y: heroContentY, opacity: heroContentOpacity }}
          className="relative z-10 max-w-2xl space-y-8"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-full">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-white font-sans text-xs font-bold tracking-widest uppercase">
              Expert Curation
            </span>
          </div>
          <h2 className="text-6xl md:text-8xl font-serif font-bold text-white leading-[0.9]">
            Master the ritual.
          </h2>
          <p className="text-xl text-white/80 max-w-lg font-medium">
            Elevate your coffee experience with precision-roasted beans
            crafted by our expert roasters.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => scrollTo("section-beans")}
              className="bg-white text-natural-text px-10 py-5 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-2xl"
            >
              Shop Collections
            </button>
            <button
              onClick={() => scrollTo("our-story")}
              className="text-white font-bold border-b-2 border-white/30 pb-1 hover:border-white transition-all"
            >
              Our Story
            </button>
          </div>
        </motion.div>
      </section>

      {/* Product Categories — clickable to jump */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8" id="categories">
        {[
          {
            title: "Coffee Beans",
            subtitle: `${beans.length} freshly roasted`,
            icon: <Coffee className="w-5 h-5" />,
            color: "bg-natural-paper border-natural-border",
            target: "section-beans",
          },
          {
            title: "Easy Coffee Bags",
            subtitle: `${bags.length} ground & packed`,
            icon: <Package className="w-5 h-5" />,
            color: "bg-natural-muted border-natural-stone",
            target: "section-bags",
          },
          {
            title: "Merch",
            subtitle: `${merch.length} items`,
            icon: <ShoppingCart className="w-5 h-5" />,
            color: "bg-natural-stone/30 border-natural-stone",
            target: "section-merch",
          },
        ].map((item, i) => (
          <div
            key={i}
            onClick={() => scrollTo(item.target)}
            className={`p-10 rounded-[2.5rem] border ${item.color} flex flex-col justify-between h-72 group cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1`}
          >
            <div className="bg-white/80 backdrop-blur w-12 h-12 rounded-2xl flex items-center justify-center text-natural-accent shadow-sm group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-3xl font-serif font-bold">{item.title}</h3>
                <p className="text-sm text-natural-text opacity-60 font-medium">
                  {item.subtitle}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-natural-accent opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transition-transform" />
            </div>
          </div>
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
  );
}
