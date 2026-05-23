"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, useAnimation, useReducedMotion } from "motion/react";

// SSR-safe: useLayoutEffect in browser, useEffect on server.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const WAVE_FRONT =
  "M0,20 C12,4 28,18 42,8 C58,-2 70,16 84,6 C92,1 96,12 100,8 L100,20 L0,20 Z";
const WAVE_BACK =
  "M0,20 C16,10 30,2 48,12 C66,22 78,4 92,10 C96,12 98,14 100,14 L100,20 L0,20 Z";
const EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];

const HOLD_MS = 320;
const EXIT_S  = 0.85;
const STAGGER = 80;

/**
 * Instant-cover / wave-reveal page transition.
 *
 * Fix for "content visible before transition":
 *   useLayoutEffect fires synchronously BEFORE the browser paints the new
 *   render. controls.set() updates MotionValues immediately (no rAF delay),
 *   so the overlay snaps to full-cover BEFORE the browser paints — the swap
 *   is completely invisible.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const reduced   = useReducedMotion();
  const backCtrl  = useAnimation();
  const frontCtrl = useAnimation();
  const prev      = useRef(pathname);

  useIsoLayoutEffect(() => {
    if (prev.current === pathname) return;
    prev.current = pathname;
    if (reduced) return;

    // COVER: synchronous set() fires before browser paint.
    // The new page is never visible without the overlay on top.
    backCtrl.set({ y: "0%", opacity: 1 });
    frontCtrl.set({ y: "0%", opacity: 1 });

    const scrollT = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }, 30);

    const revealT = setTimeout(async () => {
      backCtrl.start({ y: "-118%", transition: { duration: EXIT_S, ease: EASE } });
      await new Promise<void>((r) => setTimeout(r, STAGGER));
      await frontCtrl.start({ y: "-118%", transition: { duration: EXIT_S, ease: EASE } });
      // Reset for next navigation.
      backCtrl.set({ y: "-118%", opacity: 0 });
      frontCtrl.set({ y: "-118%", opacity: 0 });
    }, HOLD_MS);

    return () => { clearTimeout(scrollT); clearTimeout(revealT); };
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (reduced) return <>{children}</>;

  return (
    <>
      {children}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
        <WaveLayer ctrl={backCtrl}  color="var(--color-natural-paper)" wave={WAVE_BACK}  />
        <WaveLayer ctrl={frontCtrl} color="var(--color-natural-accent)" wave={WAVE_FRONT} />
      </div>
    </>
  );
}

function WaveLayer({ ctrl, color, wave }: {
  ctrl: ReturnType<typeof useAnimation>;
  color: string;
  wave: string;
}) {
  return (
    <motion.div
      animate={ctrl}
      initial={{ y: "-118%", opacity: 0 }}
      className="absolute inset-x-0 top-0 h-full"
      style={{ backgroundColor: color, willChange: "transform" }}
    >
      <svg
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
        aria-hidden
        className="absolute left-0 right-0 w-full"
        style={{ bottom: "-10vh", height: "10vh", color, display: "block", transform: "scaleY(-1)" }}
      >
        <path d={wave} fill="currentColor" />
      </svg>
    </motion.div>
  );
}
