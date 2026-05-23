"use client";

import React, { useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Liquid full-page route transition.
 *
 * Two stacked sheets sweep up from below the viewport, fully cover the page,
 * then continue rising off the top — each with a wavy SVG leading edge so the
 * transition reads as a fluid sheet rather than hard panels. Colours pull from
 * the active theme via CSS variables (see src/context/ThemeContext.tsx), so
 * each palette has its own signature sweep colour.
 */

const EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];

// Wave paths: drawn in viewBox 0 0 100 20 — the bottom row (y=20) is the
// "attach" line to the solid rectangle below. The curve along y=0..14 is the
// liquid edge that crests above the rectangle as it rises.
const WAVE_FRONT =
  "M0,20 C12,4 28,18 42,8 C58,-2 70,16 84,6 C92,1 96,12 100,8 L100,20 L0,20 Z";
const WAVE_BACK =
  "M0,20 C16,10 30,2 48,12 C66,22 78,4 92,10 C96,12 98,14 100,14 L100,20 L0,20 Z";

const OVERLAY_HEIGHT_VH = 10; // height of the wavy crest above the rectangle

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  // Track navigations so we don't run the overlay/fade on initial mount.
  const previousPath = useRef(pathname);
  const hasNavigated = useRef(false);
  if (previousPath.current !== pathname) {
    hasNavigated.current = true;
    previousPath.current = pathname;
  }

  if (reducedMotion) return <>{children}</>;

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={hasNavigated.current ? { opacity: 0, y: 14 } : false}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, delay: 0.5, ease: EASE },
          }}
          exit={{
            opacity: 0,
            y: -8,
            transition: { duration: 0.55, ease: EASE },
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {hasNavigated.current && (
        <div
          key={pathname}
          className="pointer-events-none fixed inset-0 z-[1000] overflow-hidden"
          aria-hidden
        >
          {/* Back wave: paper tone — leads slightly so the accent layer arrives on top */}
          <LiquidLayer
            color="var(--color-natural-paper)"
            wave={WAVE_BACK}
            duration={2.0}
            times={[0, 0.36, 0.56, 1]}
            delay={0}
          />
          {/* Front wave: theme accent — dominant signature colour of the sweep */}
          <LiquidLayer
            color="var(--color-natural-accent)"
            wave={WAVE_FRONT}
            duration={1.9}
            times={[0, 0.38, 0.6, 1]}
            delay={0.12}
          />
        </div>
      )}
    </>
  );
}

function LiquidLayer({
  color,
  wave,
  duration,
  times,
  delay,
}: {
  color: string;
  wave: string;
  duration: number;
  times: number[];
  delay: number;
}) {
  // Translate path: below viewport → covering → off the top.
  // Slight scaleY ripple sells the "liquid" stretch on the up-swing.
  return (
    <motion.div
      initial={{ y: "118%" }}
      animate={{ y: ["118%", "0%", "0%", "-118%"] }}
      transition={{ duration, times, ease: EASE, delay }}
      className="absolute inset-x-0"
      style={{
        // The rectangle covers the full viewport when y=0. The crest SVG sits
        // above it (negative top) so the leading edge looks curved as it rises.
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
