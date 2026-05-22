"use client";
import React, { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import {
  ShoppingCart,
  BookOpen,
  Home,
  Coffee,
  Package,
  ShoppingBag,
  Newspaper,
} from "lucide-react";
import { asset } from "@/src/lib/asset";

// ── Nav items constant ─────────────────────────────────────────
export const NAV_ITEMS: {
  key: string;
  label: string;
  target: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "home", label: "Home", target: "hero", Icon: Home },
  { key: "beans", label: "Beans", target: "section-coffee-beans", Icon: Coffee },
  { key: "bags", label: "Coffee Bags", target: "section-coffee-ecb", Icon: Package },
  { key: "merch", label: "Merch", target: "section-merch-drinkware", Icon: ShoppingBag },
  { key: "story", label: "Our Story", target: "our-story", Icon: BookOpen },
  { key: "editorial", label: "Third Circle", target: "third-circle", Icon: Newspaper },
];

// ── Active section tracker ─────────────────────────────────────
export function useActiveSection(): string {
  const [active, setActive] = useState<string>("home");
  useEffect(() => {
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
    const t = setTimeout(update, 600);
    return () => {
      clearTimeout(t);
      if (lenis) lenis.off("scroll", update);
      else window.removeEventListener("scroll", update);
    };
  }, []);
  return active;
}

// ── MorphNavItem ───────────────────────────────────────────────
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

// ── TI button in header ────────────────────────────────────────
function TIHeaderButton({
  compact,
  onClick,
}: {
  compact: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
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

// ── MorphingHeader ─────────────────────────────────────────────
export function MorphingHeader({
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
  useMotionValueEvent(scrollY, "change", (v) => {
    const next = v > 80;
    setCompact((prev) => (prev === next ? prev : next));
  });

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      {/* Mobile: full-width bar (unchanged) */}
      <motion.header
        style={{
          backgroundColor: headerBg,
          borderBottomColor: headerBorder,
          boxShadow: headerShadow,
        }}
        className="md:hidden pointer-events-auto backdrop-blur-2xl saturate-150 border-b"
      >
        <motion.div
          animate={{ paddingTop: compact ? 8 : 14, paddingBottom: compact ? 8 : 14 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="px-4 grid grid-cols-[1fr_auto_1fr] items-center"
        >
          {/* LEFT — logo */}
          <button
            onClick={() => onNavTo("hero")}
            className="flex items-center justify-start"
            aria-label="Third Wave Coffee—home"
          >
            <motion.img
              layoutId="brand-logo"
              src={asset("logo.png")}
              alt="Third Wave Coffee"
              initial={false}
              animate={{ height: compact ? 44 : 68 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-auto"
            />
          </button>
          {/* CENTER — mobile nav placeholder */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.slice(0, 4).map((item) => (
              <MorphNavItem
                key={item.key}
                label={item.label}
                Icon={item.Icon}
                active={active === item.key}
                compact
                onClick={() => onNavTo(item.target)}
              />
            ))}
          </nav>
          {/* RIGHT — cart */}
          <div className="flex items-center gap-1 justify-end">
            <div className="relative">
              <MorphNavItem label="Cart" Icon={ShoppingCart} active={false} compact onClick={onOpenCart} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] bg-natural-accent text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 pointer-events-none">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </motion.header>

      {/* Desktop: fluid water-drop header — layout FLIP drives the split animation */}
      <div className="hidden md:block absolute inset-x-0 top-0 pointer-events-none">
        {/* py-3 wrapper gives equal visual gap above and below the pill */}
        <div className={compact ? "w-full py-2 px-4" : "py-3"}>
        <motion.div
          layout
          initial={false}
          transition={{ layout: { type: "spring", stiffness: 260, damping: 30 } }}
          className={
            compact
              ? "flex items-center justify-between w-full relative pointer-events-none"
              : "flex items-center justify-between mx-auto px-6 py-1 relative pointer-events-none gap-8"
          }
          style={{ maxWidth: compact ? undefined : 920, borderRadius: 999 }}
        >
          {/* Island glass bg — covers all 3 when expanded, fades when compact */}
          <span
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: 999,
              background: "rgba(250,249,246,0.38)",
              backdropFilter: "blur(48px) saturate(180%) brightness(1.08)",
              WebkitBackdropFilter: "blur(48px) saturate(180%) brightness(1.08)",
              boxShadow: "0 8px 40px -8px rgba(44,24,16,0.18), 0 1.5px 0 rgba(255,255,255,0.75) inset",
              opacity: compact ? 0 : 1,
              transition: "opacity 0.38s cubic-bezier(0.22,1,0.36,1)",
            }}
          />

          {/* ── Logo — springs to top-left circle on scroll ── */}
          <motion.button
            layout
            initial={false}
            transition={{ layout: { type: "spring", stiffness: 260, damping: 30 } }}
            onClick={() => onNavTo("hero")}
            aria-label="Third Wave Coffee—home"
            className={`relative flex-shrink-0 flex items-center justify-center overflow-hidden rounded-full pointer-events-auto z-10${compact ? " w-14 h-14" : ""}`}
          >
            {/* Per-element glass — visible only when compact (circle mode) */}
            <span
              aria-hidden
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: "rgba(250,249,246,0.38)",
                backdropFilter: "blur(48px) saturate(180%) brightness(1.08)",
                WebkitBackdropFilter: "blur(48px) saturate(180%) brightness(1.08)",
                boxShadow: "0 8px 40px -8px rgba(44,24,16,0.18), 0 1.5px 0 rgba(255,255,255,0.75) inset",
                opacity: compact ? 1 : 0,
                transition: "opacity 0.38s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
            <motion.img
              initial={false}
              animate={{ height: compact ? 36 : 48 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              src={asset("logo.png")}
              alt="Third Wave Coffee"
              className="relative z-10 w-auto"
            />
          </motion.button>

          {/* ── Nav — stays centred, always has its own glass pill ── */}
          <motion.nav
            layout
            transition={{ layout: { type: "spring", stiffness: 260, damping: 30 } }}
            className="relative flex items-center gap-0.5 pointer-events-auto z-10 px-2 py-1"
            style={{
              borderRadius: 999,
              background: "rgba(250,249,246,0.38)",
              backdropFilter: "blur(48px) saturate(180%) brightness(1.08)",
              WebkitBackdropFilter: "blur(48px) saturate(180%) brightness(1.08)",
              boxShadow: "0 8px 40px -8px rgba(44,24,16,0.18), 0 1.5px 0 rgba(255,255,255,0.75) inset",
            }}
          >
            {NAV_ITEMS.filter((item) => item.key !== "home").map((item) => (
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
          </motion.nav>

          {/* ── Cart — springs to top-right circle on scroll ── */}
          <motion.div
            layout
            transition={{ layout: { type: "spring", stiffness: 260, damping: 30 } }}
            className={`relative flex-shrink-0 flex items-center justify-center rounded-full pointer-events-auto z-10${compact ? " w-12 h-12" : ""}`}
          >
            <span
              aria-hidden
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: "rgba(250,249,246,0.38)",
                backdropFilter: "blur(48px) saturate(180%) brightness(1.08)",
                WebkitBackdropFilter: "blur(48px) saturate(180%) brightness(1.08)",
                boxShadow: "0 8px 40px -8px rgba(44,24,16,0.18), 0 1.5px 0 rgba(255,255,255,0.75) inset",
                opacity: compact ? 1 : 0,
                transition: "opacity 0.38s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
            <MorphNavItem
              label="Cart"
              Icon={ShoppingCart}
              active={false}
              compact={compact}
              onClick={onOpenCart}
            />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] bg-natural-accent text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 pointer-events-none z-20">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </motion.div>
        </motion.div>
        </div>
      </div>
    </div>
  );
}
