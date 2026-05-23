"use client";
/**
 * AboutPageShell — common chrome for /about/* pages.
 *
 * Mirrors the home page setup (HomeContent.tsx) so every About page gets:
 *   • SmoothScroll wrapper (Lenis) — same butter-smooth scrolling
 *   • MorphingHeader pill nav — same topbar the user sees on Home (compacts on
 *     scroll, dropdown for Our Story now lists all 4 sub-pages)
 *   • Scroll-reactive header tinting (matches home behaviour)
 *   • SiteFooter at the bottom — keeps navigation symmetrical
 *
 * The page body is passed via `children`. Each About page is responsible for
 * its own parallax composition using the primitives in `ParallaxPrimitives.tsx`.
 */
import React from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "motion/react";
import { SmoothScroll } from "../SmoothScroll";
import { MorphingHeader } from "../MorphingHeader";
import { SiteFooter } from "../SiteFooter";
import { useCartPanel } from "../../context/CartPanelContext";
import { useCart } from "../../context/CartContext";
import { hrefForNavTarget } from "../../lib/navigation";

interface AboutPageShellProps {
  /** Slug for the current page — used to highlight the active dropdown item. */
  active: "our-story" | "our-coffee" | "careers" | "newsroom";
  children: React.ReactNode;
}

export function AboutPageShell({ active, children }: AboutPageShellProps) {
  const router = useRouter();
  const { openCart } = useCartPanel();
  const { cart } = useCart();
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // Identical scroll-tint values to HomeContent so the bar feels native.
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 120], [
    "rgba(250,249,246,0.35)",
    "rgba(250,249,246,0.62)",
  ]);
  const headerBorder = useTransform(scrollY, [0, 120], [
    "rgba(255,255,255,0.25)",
    "rgba(255,255,255,0.45)",
  ]);
  const headerShadow = useTransform(scrollY, [0, 120], [
    "0 0 0 rgba(0,0,0,0)",
    "0 10px 40px -12px rgba(44,24,16,0.12)",
  ]);

  const handleNavTo = (target: string) => {
    // Anchor on the home page → push to / with hash; route otherwise.
    router.push(hrefForNavTarget(target));
  };

  const openTI = () => router.push("/?ti=1");
  const openCartPanel = () => openCart();

  return (
    <SmoothScroll>
      <div
        className="min-h-screen bg-natural-bg text-natural-text font-sans selection:bg-natural-accent/20"
        data-active-about={active}
      >
        <MorphingHeader
          headerBg={headerBg}
          headerBorder={headerBorder}
          headerShadow={headerShadow}
          onOpenTI={openTI}
          onOpenCart={openCartPanel}
          onNavTo={handleNavTo}
          cartCount={cartCount}
          activeOverride="story"
        />

        <main className="pt-20 md:pt-20 lg:pt-20 pb-28 sm:pb-12">{children}</main>

        <SiteFooter
          onNavigate={(t) => router.push(hrefForNavTarget(t))}
        />
      </div>
    </SmoothScroll>
  );
}

/**
 * Tiny inline back-button you can drop above a hero if the page needs it.
 * Most pages don't — the header already covers nav.
 */
export function BackToHomeLink() {
  const router = useRouter();
  return (
    <motion.button
      onClick={() => router.push("/")}
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      whileHover={{ x: -4 }}
      className="text-natural-text/55 hover:text-natural-text text-xs font-bold uppercase tracking-[0.3em] inline-flex items-center gap-2"
    >
      ← Back to home
    </motion.button>
  );
}
