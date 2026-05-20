"use client";
import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";

/**
 * Buttery smooth-scroll wrapper. Drives a single shared Lenis instance via rAF
 * so all `motion/react` `useScroll` listeners read interpolated scrollY values.
 *
 * The Autajon-style site feel is entirely keyed off this: chunky momentum,
 * slow ease-out, scroll velocity that lets Z-depth parallax read as a real
 * "dive" rather than a jagged wheel-jump.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Respect users that explicitly prefer reduced motion.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    // Prevent the browser / Next.js from restoring scroll position on
    // back-forward navigation — Lenis owns the scroll position.
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const lenis = new Lenis({
      // Frame-rate independent smoothing — feels identical at 60 / 120 / 144 Hz.
      // Lower lerp = more smoothing (buttery), higher = snappier (digital).
      // 0.08 gives the silk-curtain feel without perceptible lag.
      lerp: 0.08,
      smoothWheel: true,
      syncTouch: true,
      syncTouchLerp: 0.075,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.4,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      // Notify Framer Motion's useScroll listeners so useTransform values
      // update on the same frame as the Lenis position change.
      window.dispatchEvent(new Event("scroll"));
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
  }, []);

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
