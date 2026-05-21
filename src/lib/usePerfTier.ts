"use client";

import { useEffect, useRef, useState } from "react";

export type PerfTier = "low" | "mid" | "high";

export interface PerfSignals {
  tier: PerfTier;
  deviceMemoryGB: number | null;
  hwConcurrency: number | null;
  reducedMotion: boolean;
  /** Estimated display refresh rate (Hz), bucketed to nearest of 60/90/120/144. */
  estimatedHz: number | null;
}

/**
 * Adaptive performance tier detector.
 *
 * - SSR / pre-mount: returns `mid` (per CONTEXT D-01) — never causes hydration
 *   mismatch because the value is stable across SSR + first client render.
 * - Post-mount: samples device memory, hardware concurrency, prefers-reduced-motion,
 *   and a 60-frame rAF refresh sample, then classifies per CONTEXT D-04.
 * - `prefers-reduced-motion: reduce` always forces `low` (D-03).
 * - Re-runs classification when the reduced-motion media query changes.
 */
const DEFAULT_SIGNALS: PerfSignals = {
  tier: "mid",
  deviceMemoryGB: null,
  hwConcurrency: null,
  reducedMotion: false,
  estimatedHz: null,
};

function bucketHz(hz: number): number {
  const buckets = [60, 90, 120, 144];
  let best = buckets[0];
  let bestDelta = Math.abs(hz - best);
  for (const b of buckets) {
    const d = Math.abs(hz - b);
    if (d < bestDelta) {
      best = b;
      bestDelta = d;
    }
  }
  return best;
}

function classify(
  reducedMotion: boolean,
  deviceMemoryGB: number | null,
  hwConcurrency: number | null,
  estimatedHz: number | null,
): PerfTier {
  // D-03: reduced-motion always forces low
  if (reducedMotion) return "low";
  // D-04 low: deviceMemory ≤ 4 OR hwConcurrency ≤ 4 (treat null as "unknown — generous default")
  const memGB = deviceMemoryGB ?? 8;
  const cores = hwConcurrency ?? 8;
  if (memGB <= 4 || cores <= 4) return "low";
  // D-04 high: deviceMemory ≥ 8 AND hwConcurrency ≥ 8 AND refresh ≥ 90
  const hz = estimatedHz ?? 60;
  if (memGB >= 8 && cores >= 8 && hz >= 90) return "high";
  return "mid";
}

export function usePerfTier(): PerfSignals {
  const [signals, setSignals] = useState<PerfSignals>(DEFAULT_SIGNALS);
  const sampledRef = useRef(false);

  useEffect(() => {
    if (sampledRef.current) return;
    sampledRef.current = true;
    if (typeof window === "undefined") return;

    const nav = navigator as Navigator & { deviceMemory?: number };
    const deviceMemoryGB =
      typeof nav.deviceMemory === "number" ? nav.deviceMemory : null;
    const hwConcurrency =
      typeof nav.hardwareConcurrency === "number"
        ? nav.hardwareConcurrency
        : null;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Sample refresh rate: 60 frames of rAF deltas → median → bucket.
    const samples: number[] = [];
    let prev = performance.now();
    let raf = 0;
    const sample = (now: number) => {
      const delta = now - prev;
      prev = now;
      if (delta > 0 && delta < 100) samples.push(delta);
      if (samples.length < 60) {
        raf = requestAnimationFrame(sample);
      } else {
        const sorted = [...samples].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const hzRaw = median > 0 ? 1000 / median : 60;
        const estimatedHz = bucketHz(hzRaw);
        const reducedMotion = mql.matches;
        const tier = classify(
          reducedMotion,
          deviceMemoryGB,
          hwConcurrency,
          estimatedHz,
        );
        setSignals({
          tier,
          deviceMemoryGB,
          hwConcurrency,
          reducedMotion,
          estimatedHz,
        });
      }
    };
    raf = requestAnimationFrame(sample);

    const onMqlChange = () => {
      setSignals((s) => ({
        ...s,
        reducedMotion: mql.matches,
        tier: classify(
          mql.matches,
          s.deviceMemoryGB ?? deviceMemoryGB,
          s.hwConcurrency ?? hwConcurrency,
          s.estimatedHz,
        ),
      }));
    };
    mql.addEventListener("change", onMqlChange);

    return () => {
      cancelAnimationFrame(raf);
      mql.removeEventListener("change", onMqlChange);
    };
  }, []);

  return signals;
}
