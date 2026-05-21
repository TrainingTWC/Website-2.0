"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { usePerfMode } from "@/src/context/PerfModeContext";

const GalaxySweepInner = dynamic(
  () =>
    import("./GalaxySweep").then((m) => ({
      default: m.GalaxySweep,
    })),
  { ssr: false }
);

interface Props {
  origin: { x: number; y: number };
  onComplete: () => void;
  duration?: number;
}

/**
 * Tier-routed galaxy sweep.
 *  - low / reduced-motion → render nothing, fire `onComplete` immediately.
 *  - mid → CSS-keyframe lite variant (~600 ms, no rAF).
 *  - high → full bloom + ripples + glitters + grain.
 */
export function GalaxySweep({ origin, onComplete, duration }: Props) {
  const { tier, reducedMotion } = usePerfMode();
  const skip = tier === "low" || reducedMotion;

  useEffect(() => {
    if (skip) {
      const id = window.setTimeout(onComplete, 0);
      return () => window.clearTimeout(id);
    }
  }, [skip, onComplete]);

  if (skip) return null;

  return (
    <GalaxySweepInner
      origin={origin}
      onComplete={onComplete}
      duration={duration}
      variant={tier === "high" ? "full" : "lite"}
    />
  );
}
