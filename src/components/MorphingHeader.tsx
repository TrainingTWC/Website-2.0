"use client";
import React, { useState, useEffect, useRef } from "react";
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
  Layers,
  Gift,
  Briefcase,
  Award,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { asset } from "@/src/lib/asset";

// ── Nav items ─────────────────────────────────────────────────
export const NAV_ITEMS: {
  key: string;
  label: string;
  target: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "home",      label: "Home",         target: "hero",                    Icon: Home       },
  { key: "chapters",  label: "Chapters",     target: "chapter-sourcing",        Icon: Layers     },
  { key: "beans",     label: "Beans",        target: "section-coffee-beans",    Icon: Coffee     },
  { key: "bags",      label: "Coffee Bags",  target: "section-coffee-ecb",      Icon: Package    },
  { key: "merch",     label: "Merch",        target: "section-merch-drinkware", Icon: ShoppingBag },
  { key: "story",     label: "Our Story",    target: "our-story",               Icon: BookOpen   },
  { key: "editorial", label: "Third Circle", target: "third-circle",            Icon: Newspaper  },
];

// ── Dropdown content per nav key ───────────────────────────────
type DropdownItem = {
  label: string;
  target: string;
  description?: string;
  Icon?: React.ComponentType<{ className?: string }>;
};

const STATIC_DROPDOWNS: Record<string, DropdownItem[]> = {
  beans: [
    { label: "Single Origin",    target: "section-coffee-beans",    description: "Estate-pure lots from 14 partner farms.", Icon: Coffee },
    { label: "Blends & Espresso", target: "section-coffee-beans",   description: "House blends built for milk & crema.",    Icon: Layers },
  ],
  bags: [
    { label: "Eco Craft Bags", target: "section-coffee-ecb", description: "Brew-in-bag, zero cleanup.", Icon: Package },
  ],
  merch: [
    { label: "Drinkware",  target: "section-merch-drinkware",  description: "Mugs, tumblers, glassware.",       Icon: Coffee },
    { label: "Bags",       target: "section-merch-bags",       description: "Totes & travel-friendly carriers.", Icon: ShoppingBag },
    { label: "Keychains",  target: "section-merch-keychains",  description: "Pocket-sized roastery keepsakes.",  Icon: Package },
    { label: "Chocolates", target: "section-merch-chocolates", description: "Single-origin pairings.",           Icon: Gift },
  ],
  story: [
    { label: "Our Story",  target: "/about/our-story",  description: "Founders, milestones, ten-year arc.", Icon: BookOpen },
    { label: "Our Coffee", target: "/about/our-coffee", description: "Estates, varietals & the cup.",       Icon: Coffee },
    { label: "Careers",    target: "/about/careers",    description: "Open roles + life at Third Wave.",    Icon: Briefcase },
    { label: "Newsroom",   target: "/about/newsroom",   description: "Press, releases & facts.",            Icon: Newspaper },
  ],
  editorial: [
    { label: "All",       target: "/third-circle",                    description: "Every story in one feed.",       Icon: Layers },
    { label: "Offers",    target: "/third-circle?filter=flash-sale",  description: "Limited drops & promotions.",    Icon: Sparkles },
    { label: "News",      target: "/third-circle?filter=cafe-news",   description: "What's new in our cafes.",       Icon: Newspaper },
    { label: "Stories",   target: "/third-circle?filter=brand-story", description: "Long reads from the team.",      Icon: BookOpen },
    { label: "Champions", target: "/third-circle?filter=champion",    description: "Baristas, growers & partners.",  Icon: Award },
  ],
};

// ── Active section tracker ─────────────────────────────────────
export function useActiveSection(chapterTargets: { target: string }[] = []) {
  const [active, setActive] = useState<string>("home");
  const chapRef = useRef(chapterTargets);
  chapRef.current = chapterTargets;
  const updateRef = useRef<(() => void) | null>(null);
  // Re-run update when chapter data arrives from Convex (user may not be scrolling)
  useEffect(() => {
    if (chapterTargets.length > 0) {
      updateRef.current?.();
    }
  }, [chapterTargets]);
  useEffect(() => {
    const update = () => {
      updateRef.current = update;
      const allItems = [
        ...NAV_ITEMS.map(({ key, target }) => ({ key, target })),
        ...chapRef.current.map(({ target }) => ({ key: "chapters", target })),
      ]
        .filter(({ target }) => !target.startsWith("/"))
        .map(({ key, target }) => {
          const el = document.getElementById(target);
          return el ? { key, el } : null;
        })
        .filter((x): x is { key: string; el: HTMLElement } => !!x);
      if (!allItems.length) return;
      // "Last section whose top has passed the 40% viewport trigger"
      // Works correctly for full-screen parallax chapters
      const trigger = window.scrollY + window.innerHeight * 0.4;
      const withTops = allItems.map((item) => ({
        ...item,
        top: window.scrollY + item.el.getBoundingClientRect().top,
      })).sort((a, b) => a.top - b.top);
      let best = withTops[0];
      for (const item of withTops) {
        if (item.top <= trigger) best = item;
      }
      setActive((prev) => (prev === best.key ? prev : best.key));
    };
    const lenis = (window as any).__lenis;
    if (lenis) lenis.on("scroll", update);
    else window.addEventListener("scroll", update, { passive: true });
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

// ── Shared glass style ─────────────────────────────────────────
const GLASS: React.CSSProperties = {
  background: "rgba(250,249,246,0.92)",
  backdropFilter: "blur(48px) saturate(180%) brightness(1.06)",
  WebkitBackdropFilter: "blur(48px) saturate(180%) brightness(1.06)",
  boxShadow:
    "0 16px 48px -8px rgba(44,24,16,0.22), 0 1.5px 0 rgba(255,255,255,0.8) inset, 0 0 0 1px rgba(255,255,255,0.45)",
};

// ── DropdownPanel ──────────────────────────────────────────────
function DropdownPanel({
  items,
  onSelect,
}: {
  items: DropdownItem[];
  onSelect: (t: string) => void;
}) {
  const hasDescriptions = items.some((i) => i.description);
  const twoCol = hasDescriptions && items.length >= 4;
  const panelWidth = twoCol ? 560 : hasDescriptions ? 320 : 220;
  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: "50%",
        zIndex: 200,
        paddingTop: 10,
        pointerEvents: "auto",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scaleY: 0.9, y: -6 }}
        animate={{ opacity: 1, scaleY: 1, y: 0 }}
        exit={{ opacity: 0, scaleY: 0.9, y: -6 }}
        transition={{ type: "spring", stiffness: 460, damping: 32, mass: 0.7 }}
        style={{
          transformOrigin: "top center",
          x: "-50%",
          width: panelWidth,
          borderRadius: 22,
          padding: 10,
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(180deg, rgba(255,254,251,0.85) 0%, rgba(250,249,246,0.78) 100%)",
          backdropFilter: "blur(56px) saturate(190%) brightness(1.08)",
          WebkitBackdropFilter: "blur(56px) saturate(190%) brightness(1.08)",
          boxShadow:
            "0 28px 64px -16px rgba(44,24,16,0.28), 0 8px 24px -8px rgba(44,24,16,0.16), 0 1px 0 rgba(255,255,255,0.95) inset, 0 0 0 1px rgba(255,255,255,0.55)",
        }}
      >
        {/* top sheen */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 56,
            pointerEvents: "none",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)",
          }}
        />
        {/* bottom warm glow */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            bottom: -40,
            left: "50%",
            transform: "translateX(-50%)",
            width: "70%",
            height: 80,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse at center, rgba(168,118,68,0.16) 0%, rgba(168,118,68,0) 70%)",
            filter: "blur(8px)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: twoCol ? "1fr 1fr" : "1fr",
            gap: 4,
          }}
        >
          {items.map((item) => {
            const Icon = item.Icon;
            return (
              <button
                key={item.target + item.label}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(item.target);
                }}
                className="group relative flex items-start gap-3 text-left rounded-2xl px-3 py-2.5 transition-all duration-200 hover:bg-white/55 hover:shadow-[0_4px_18px_-6px_rgba(44,24,16,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-natural-accent/50"
              >
                {Icon ? (
                  <span
                    aria-hidden
                    className="shrink-0 grid place-items-center w-9 h-9 rounded-xl transition-transform duration-200 group-hover:scale-[1.04]"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(168,118,68,0.18) 0%, rgba(168,118,68,0.06) 100%)",
                      boxShadow:
                        "0 1px 0 rgba(255,255,255,0.7) inset, 0 0 0 1px rgba(168,118,68,0.18)",
                    }}
                  >
                    <Icon className="w-[18px] h-[18px] text-natural-accent" />
                  </span>
                ) : null}
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] font-bold text-natural-text leading-tight">
                    {item.label}
                  </span>
                  {item.description ? (
                    <span className="block text-[11.5px] text-natural-text/55 mt-0.5 leading-snug">
                      {item.description}
                    </span>
                  ) : null}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-natural-text/30 mt-1.5 shrink-0 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
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

// ── TI button ─────────────────────────────────────────────────
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
  chapterItems,
}: {
  headerBg: any;
  headerBorder: any;
  headerShadow: any;
  onOpenTI: (e: React.MouseEvent) => void;
  onOpenCart: () => void;
  onNavTo: (target: string) => void;
  cartCount?: number;
  activeOverride?: string;
  chapterItems?: { label: string; target: string }[];
}) {
  const sectionActive = useActiveSection(chapterItems || []);
  const active = activeOverride ?? sectionActive;
  const { scrollY } = useScroll();
  const [compact, setCompact] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  useMotionValueEvent(scrollY, "change", (v) => {
    const next = v > 80;
    setCompact((prev) => (prev === next ? prev : next));
  });

  const getDropdownItems = (key: string) => {
    if (key === "chapters") return chapterItems || [];
    return STATIC_DROPDOWNS[key] || [];
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">

      {/* ── Mobile: full-width bar ── */}
      <motion.header
        style={{ backgroundColor: headerBg, borderBottomColor: headerBorder, boxShadow: headerShadow }}
        className="md:hidden pointer-events-auto backdrop-blur-2xl saturate-150 border-b"
      >
        <motion.div
          animate={{ paddingTop: compact ? 8 : 14, paddingBottom: compact ? 8 : 14 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="px-4 grid grid-cols-[1fr_auto_1fr] items-center"
        >
          <button onClick={() => onNavTo("hero")} className="flex items-center justify-start" aria-label="Third Wave Coffee—home">
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
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.slice(0, 5).map((item) => (
              <MorphNavItem
                key={item.key}
                label={item.label}
                Icon={item.Icon}
                active={active === item.key}
                compact
                onClick={() => {
                const dest = item.key === "chapters" && chapterItems?.length
                  ? chapterItems[0].target : item.target;
                onNavTo(dest);
              }}
              />
            ))}
          </nav>
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

      {/* ── Desktop: fluid water-drop header ── */}
      <div className="hidden md:block absolute inset-x-0 top-0 pointer-events-none">
        <motion.div
          layout
          initial={false}
          transition={{ layout: { type: "spring", stiffness: 260, damping: 30 } }}
          className={
            compact
              ? "flex items-center justify-between w-full px-4 pt-2 relative pointer-events-none"
              : "flex items-center justify-between mx-auto mt-3 px-6 py-1 relative pointer-events-none gap-8"
          }
          style={{ maxWidth: compact ? undefined : 920, borderRadius: 999 }}
        >
          {/* Island glass bg — single pill when expanded */}
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

          {/* Logo */}
          <motion.button
            layout
            initial={false}
            transition={{ layout: { type: "spring", stiffness: 260, damping: 30 } }}
            onClick={() => onNavTo("hero")}
            aria-label="Third Wave Coffee—home"
            className={`relative flex-shrink-0 flex items-center justify-center overflow-hidden rounded-full pointer-events-auto z-10${compact ? " w-14 h-14" : ""}`}
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
            <motion.img
              initial={false}
              animate={{ height: compact ? 36 : 48 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              src={asset("logo.png")}
              alt="Third Wave Coffee"
              className="relative z-10 w-auto"
            />
          </motion.button>

          {/* Nav pill */}
          <motion.nav
            layout
            transition={{ layout: { type: "spring", stiffness: 260, damping: 30 } }}
            className="relative flex items-center gap-0.5 pointer-events-auto z-10 px-2 py-1"
            style={{
              borderRadius: 999,
              background: compact ? "rgba(250,249,246,0.38)" : "transparent",
              backdropFilter: compact ? "blur(48px) saturate(180%) brightness(1.08)" : "none",
              WebkitBackdropFilter: compact ? "blur(48px) saturate(180%) brightness(1.08)" : "none",
              boxShadow: compact ? "0 8px 40px -8px rgba(44,24,16,0.18), 0 1.5px 0 rgba(255,255,255,0.75) inset" : "none",
            }}
          >
            {NAV_ITEMS.filter((item) => item.key !== "home").map((item) => {
              const dropItems = getDropdownItems(item.key);
              const showDrop = hoveredKey === item.key && dropItems.length > 0;
              return (
                <div
                  key={item.key}
                  style={{ position: "relative" }}
                  onMouseEnter={() => setHoveredKey(item.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                >
                  <MorphNavItem
                    label={item.label}
                    Icon={item.Icon}
                    active={active === item.key}
                    compact={compact}
                    onClick={() => {
                    setHoveredKey(null);
                    const dest = item.key === "chapters" && chapterItems?.length
                      ? chapterItems[0].target : item.target;
                    onNavTo(dest);
                  }}
                  />
                  <AnimatePresence>
                    {showDrop && (
                      <DropdownPanel
                        items={dropItems}
                        onSelect={(t) => { setHoveredKey(null); onNavTo(t); }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            <TIHeaderButton compact={compact} onClick={onOpenTI} />
          </motion.nav>

          {/* Cart */}
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
  );
}