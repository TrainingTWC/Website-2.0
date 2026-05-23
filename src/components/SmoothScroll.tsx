"use client";
import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { usePerfMode } from "@/src/context/PerfModeContext";

/**
 * Buttery smooth-scroll wrapper. Drives a single shared Lenis instance via rAF
 * so all `motion/react` `useScroll` listeners read interpolated scrollY values.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const { tier, reducedMotion } = usePerfMode();

  useEffect(() => {
    if (reducedMotion || tier === "low") {
      document.documentElement.classList.remove("lenis", "lenis-smooth");
      return;
    }

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

    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    // -------------------------------------------------------------
    // Soft chapter snap (desktop only, proximity-based)
    //
    // Trigger model: velocity-based, not timer-based. We watch Lenis'
    // own velocity each frame and fire the snap the instant inertia
    // decays below a small threshold. This removes the awkward
    // "pause, then jump" feel and blends the snap directly into the
    // tail of the user's flick.
    //
    // Snap motion: 0.95s with an exponential ease-out for a silky
    // glide that decelerates gradually instead of arriving abruptly.
    // -------------------------------------------------------------
    const mql = window.matchMedia("(min-width: 768px)");
    let snapInProgress = false;
    let cancelSnap = false;
    let recentInput = false;
    let inputTimer: number | null = null;
    let armed = false; // user has scrolled since last snap; eligible to snap again

    const VELOCITY_THRESHOLD = 0.08;     // px/ms-ish, Lenis units
    const PROXIMITY_VH = 0.45;           // snap if within +/- 45% of viewport height
    const ALIGNED_PX = 6;
    const SNAP_DURATION = 0.95;          // seconds
    const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const markInput = () => {
      recentInput = true;
      armed = true;
      if (snapInProgress) cancelSnap = true;
      if (inputTimer !== null) window.clearTimeout(inputTimer);
      // Tiny debounce so we don't claim "idle" while a flick is still spawning frames.
      inputTimer = window.setTimeout(() => {
        recentInput = false;
      }, 60);
    };

    const tryRunSnap = () => {
      if (!armed || snapInProgress || recentInput) return;
      if (!mql.matches) return;

      const vh = window.innerHeight;
      const proximityPx = vh * PROXIMITY_VH;
      const currentTop = window.scrollY;

      const sections = Array.from(
        document.querySelectorAll<HTMLElement>("[data-snap-chapter]")
      );
      if (sections.length === 0) return;

      let best: { targetTop: number; delta: number } | null = null;
      for (const el of sections) {
        const rect = el.getBoundingClientRect();
        const targetTop = currentTop + rect.top;
        const delta = Math.abs(rect.top);
        if (delta <= proximityPx) {
          if (!best || delta < best.delta) {
            best = { targetTop, delta };
          }
        }
      }

      if (!best) {
        armed = false;
        return;
      }
      if (best.delta < ALIGNED_PX) {
        armed = false;
        return;
      }

      armed = false;
      snapInProgress = true;
      cancelSnap = false;
      lenis.scrollTo(best.targetTop, {
        duration: SNAP_DURATION,
        easing: easeOutExpo,
        lock: false,
        onComplete: () => {
          snapInProgress = false;
        },
      });

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

    // Velocity watcher: fires the snap the instant inertia dies down.
    let velRaf = 0;
    const watchVelocity = () => {
      if (mql.matches && !snapInProgress && !recentInput && armed) {
        // Lenis exposes its current velocity in its own units.
        const v = Math.abs((lenis as unknown as { velocity?: number }).velocity ?? 0);
        if (v < VELOCITY_THRESHOLD) {
          tryRunSnap();
        }
      }
      velRaf = requestAnimationFrame(watchVelocity);
    };
    velRaf = requestAnimationFrame(watchVelocity);

    window.addEventListener("wheel", markInput, { passive: true });
    window.addEventListener("touchstart", markInput, { passive: true });
    window.addEventListener("touchmove", markInput, { passive: true });
    window.addEventListener("keydown", markInput);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(velRaf);
      if (inputTimer !== null) window.clearTimeout(inputTimer);
      window.removeEventListener("wheel", markInput);
      window.removeEventListener("touchstart", markInput);
      window.removeEventListener("touchmove", markInput);
      window.removeEventListener("keydown", markInput);
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