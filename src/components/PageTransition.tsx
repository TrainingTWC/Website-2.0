"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Liquid full-page route transition that completely masks the swap.
 *
 * Timeline (total ~1.8s):
 *   0.00s  →  overlay starts rising from below the viewport
 *   0.50s  →  overlay fully covers the screen
 *   0.85s  →  React swaps old page out / new page in (BEHIND the overlay)
 *   1.30s  →  overlay starts retracting upward
 *   1.80s  →  overlay gone, new page fully revealed
 *
 * The previous version exited the old page before the overlay finished
 * covering, so you could see the route swap. This version uses an
 * AnimatePresence exit duration that holds the outgoing page opaque until
 * after the overlay has fully covered — so the swap is never visible.
 */

const EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];

const WAVE_FRONT =
  "M0,20 C12,4 28,18 42,8 C58,-2 70,16 84,6 C92,1 96,12 100,8 L100,20 L0,20 Z";
const WAVE_BACK =
  "M0,20 C16,10 30,2 48,12 C66,22 78,4 92,10 C96,12 98,14 100,14 L100,20 L0,20 Z";

const TOTAL = 1.8;        // total animation duration in seconds
const COVER_AT = 0.5;     // overlay reaches full cover at t=0.5s
const HOLD_END_AT = 1.3;  // overlay starts retracting at t=1.3s
const SWAP_MS = 850;      // React swap happens at t=0.85s (mid-cover, fully hidden)
const OVERLAY_HEIGHT_VH = 10;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  // Trigger key bumps once per navigation — this remounts the overlay so it
  // replays the cover/reveal animation every time.
  const previousPath = useRef(pathname);
  const [transitionTick, setTransitionTick] = useState(0);
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      hasNavigated.current = true;
      if (!reducedMotion) setTransitionTick((t) => t + 1);
    }
  }, [pathname, reducedMotion]);

  if (reducedMotion) return <>{children}</>;

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          // No fade. The overlay does the masking. Keep the outgoing page
          // fully opaque for SWAP_MS so AnimatePresence delays the swap until
          // the overlay has fully covered the screen.
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
          transition={{ duration: SWAP_MS / 1000, ease: "linear" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {hasNavigated.current && (
        <div
          key={transitionTick}
          className="pointer-events-none fixed inset-0 z-[1000] overflow-hidden"
          aria-hidden
        >
          {/* Back wave: paper tone — leads slightly so the accent layer arrives on top */}
          <LiquidLayer
            color="var(--color-natural-paper)"
            wave={WAVE_BACK}
            delay={0}
          />
          {/* Front wave: theme accent — dominant signature colour of the sweep */}
          <LiquidLayer
            color="var(--color-natural-accent)"
            wave={WAVE_FRONT}
            delay={0.08}
          />
        </div>
      )}
    </>
  );
}

function LiquidLayer({
  color,
  wave,
  delay,
}: {
  color: string;
  wave: string;
  delay: number;
}) {
  // Keyframe positions:
  //   y = "118%"  → below viewport (resting)
  //   y = "0%"    → fully covering
  //   y = "-118%" → off the top (cleared)
  //
  // times are fractions of TOTAL — clamped so the layer fully covers at
  // COVER_AT and starts leaving at HOLD_END_AT, leaving a generous hold
  // window where the route swap can happen invisibly.
  const t1 = COVER_AT / TOTAL;       // ~0.278
  const t2 = HOLD_END_AT / TOTAL;    // ~0.722

  return (
    <motion.div
      initial={{ y: "118%" }}
      animate={{ y: ["118%", "0%", "0%", "-118%"] }}
      transition={{
        duration: TOTAL,
        times: [0, t1, t2, 1],
        ease: EASE,
        delay,
      }}
      className="absolute inset-x-0"
      style={{
        top: 0,
        height: "100%",
        backgroundColor: color,
        willChange: "transform",
      }}
    >
      <svg
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
        className="absolute left-0 right-0 w-full"
        style={{
          top: `-${OVERLAY_HEIGHT_VH}vh`,
          height: `${OVERLAY_HEIGHT_VH}vh`,
          color,
          display: "block",
        }}
      >
        <path d={wave} fill="currentColor" />
      </svg>
    </motion.div>
  );
}
