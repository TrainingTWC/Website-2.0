"use client";
import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { usePerfMode } from "@/src/context/PerfModeContext";

/**
 * Buttery smooth-scroll wrapper. Drives a single shared Lenis instance via rAF
 * so all `motion/react` `useScroll` listeners read interpolated scrollY values.
 *
 * Tier-gated per CONTEXT D-04:
 *   • low tier or `prefers-reduced-motion`     → skip Lenis entirely
 *     (native scroll, no rAF loop, no synthetic events).
 *   • mid tier  → lerp 0.10, syncTouch off (saves a 60 Hz event firehose on phones).
 *   • high tier → lerp 0.08, syncTouch on  (full silk-curtain feel).
 *
 * D-05 — we deliberately do NOT dispatch a synthetic `scroll` event each
 * frame. motion/react's `useScroll` already reads the real scroll position
 * via its own listener; the synthetic dispatch was the single largest
 * scroll-fps regression in v5.x and is gone for good.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const { tier, reducedMotion } = usePerfMode();

  useEffect(() => {
    // Hard bail-outs: Lenis adds cost we don't want on these paths.
    if (reducedMotion || tier === "low") {
      document.documentElement.classList.remove("lenis", "lenis-smooth");
      return;
    }

    // Prevent the browser / Next.js from restoring scroll position on
    // back-forward navigation — Lenis owns the scroll position.
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const isHigh = tier === "high";
    const lenis = new Lenis({
      lerp: isHigh ? 0.08 : 0.1,
      smoothWheel: true,
      syncTouch: isHigh,
      syncTouchLerp: 0.075,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.4,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Expose for any imperative scrollTo calls (anchor links etc.).
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, [tier, reducedMotion]);

  return <>{children}</>;
}

/** Imperative scroll-to that respects the smooth scroller when available. */
export function smoothScrollTo(target: string | number | HTMLElement, opts?: { offset?: number }) {
  const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
  if (lenis) {
    lenis.scrollTo(target as string, {
      offset: opts?.offset ?? 0,
      duration: 1.2,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    });
    return;
  }
  if (typeof target === "string") {
    const el = document.querySelector(target);
    if (el) (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: "smooth" });
  } else {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
