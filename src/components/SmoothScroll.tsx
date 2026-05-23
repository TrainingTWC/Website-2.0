"use client";
import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { usePerfMode } from "@/src/context/PerfModeContext";

/**
 * Buttery smooth-scroll wrapper. Drives a single shared Lenis instance via rAF
 * so all `motion/react` `useScroll` listeners read interpolated scrollY values.
 *
 * Tier-gated per CONTEXT D-04:
 *   - low tier or `prefers-reduced-motion` -> skip Lenis entirely
 *     (native scroll, no rAF loop, no synthetic events).
 *   - mid tier  -> lerp 0.10, syncTouch off (saves a 60 Hz event firehose on phones).
 *   - high tier -> lerp 0.08, syncTouch on  (full silk-curtain feel).
 *
 * D-05 - we deliberately do NOT dispatch a synthetic `scroll` event each
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
    // back-forward navigation - Lenis owns the scroll position.
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

    // -------------------------------------------------------------
    // Soft chapter snap (desktop only, proximity-based, idle-triggered)
    // -------------------------------------------------------------
    // Behaviour:
    //   - Watch scroll. ~180ms after user stops, find the nearest
    //     [data-snap-chapter] section whose top is within +/-40% vh
    //     of the current viewport top.
    //   - If found and we aren't already aligned (within 6px),
    //     gently scrollTo it with Lenis.
    //   - Any wheel/touch/key input during the snap aborts it.
    //   - Disabled on <768px viewports.
    const mql = window.matchMedia("(min-width: 768px)");
    let snapIdleTimer: number | null = null;
    let snapInProgress = false;
    let cancelSnap = false;

    const clearIdleTimer = () => {
      if (snapIdleTimer !== null) {
        window.clearTimeout(snapIdleTimer);
        snapIdleTimer = null;
      }
    };

    const onUserInput = () => {
      // Any fresh input aborts an in-flight snap and resets the idle window.
      if (snapInProgress) cancelSnap = true;
      clearIdleTimer();
      scheduleSnapCheck();
    };

    const scheduleSnapCheck = () => {
      if (!mql.matches) return;
      clearIdleTimer();
      snapIdleTimer = window.setTimeout(runSnapCheck, 180);
    };

    const runSnapCheck = () => {
      snapIdleTimer = null;
      if (!mql.matches || snapInProgress) return;

      const vh = window.innerHeight;
      const proximityPx = vh * 0.4; // proximity zone: +/-40% vh
      const currentTop = window.scrollY;

      const sections = Array.from(
        document.querySelectorAll<HTMLElement>("[data-snap-chapter]")
      );
      if (sections.length === 0) return;

      let best: { el: HTMLElement; targetTop: number; delta: number } | null = null;
      for (const el of sections) {
        const rect = el.getBoundingClientRect();
        const targetTop = currentTop + rect.top;
        const delta = Math.abs(rect.top); // distance from viewport top
        if (delta <= proximityPx) {
          if (!best || delta < best.delta) {
            best = { el, targetTop, delta };
          }
        }
      }

      if (!best) return;
      if (best.delta < 6) return; // already aligned, do nothing

      snapInProgress = true;
      cancelSnap = false;
      lenis.scrollTo(best.targetTop, {
        duration: 0.6,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
        lock: false,
        onComplete: () => {
          snapInProgress = false;
        },
      });

      // Poll a few frames so a fresh user input can abort it.
      const abortRaf = () => {
        if (!snapInProgress) return;
        if (cancelSnap) {
          lenis.stop();
          lenis.start();
          snapInProgress = false;
          return;
        }
        requestAnimationFrame(abortRaf);
      };
      requestAnimationFrame(abortRaf);
    };

    const scrollHandler = () => {
      if (snapInProgress) return; // ignore our own snap-driven scroll
      scheduleSnapCheck();
    };

    window.addEventListener("scroll", scrollHandler, { passive: true });
    window.addEventListener("wheel", onUserInput, { passive: true });
    window.addEventListener("touchstart", onUserInput, { passive: true });
    window.addEventListener("keydown", onUserInput);

    return () => {
      cancelAnimationFrame(raf);
      clearIdleTimer();
      window.removeEventListener("scroll", scrollHandler);
      window.removeEventListener("wheel", onUserInput);
      window.removeEventListener("touchstart", onUserInput);
      window.removeEventListener("keydown", onUserInput);
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