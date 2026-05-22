import type { PerfTier } from "@/src/lib/usePerfTier";

export type VitalsName = "FCP" | "LCP" | "INP" | "CLS" | "TTFB";
export type VitalsRating = "good" | "needs-improvement" | "poor";

export interface VitalsPayload {
  name: VitalsName;
  value: number;
  rating: VitalsRating;
  page: string;
  userAgent: string;
  tier: PerfTier;
}

const FLUSH_DELAY_MS = 10_000;

interface ReportOptions {
  tier: PerfTier;
  sendBatchToConvex: (vitals: VitalsPayload[]) => void;
}

/**
 * Subscribes to web-vitals metrics and forwards them to Convex as a single
 * batch (Fix #2: reduces 5 mutations → 1 per page load).
 *
 * Collects all metrics for FLUSH_DELAY_MS then sends one batch, or flushes
 * immediately on visibilitychange (tab close / navigation).
 */
export function reportWebVitals(opts: ReportOptions): void {
  if (typeof window === "undefined") return;

  const buffer: VitalsPayload[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (flushTimer !== null) { clearTimeout(flushTimer); flushTimer = null; }
    if (buffer.length === 0) return;
    const batch = buffer.splice(0);
    try {
      opts.sendBatchToConvex(batch);
    } catch {
      /* swallow — never let telemetry break the app */
    }
  };

  const scheduleFlush = () => {
    if (flushTimer !== null) return;
    flushTimer = setTimeout(flush, FLUSH_DELAY_MS);
  };

  const handleVisibility = () => {
    if (document.visibilityState === "hidden") flush();
  };
  document.addEventListener("visibilitychange", handleVisibility);

  void import("web-vitals").then((wv) => {
    const emit = (name: VitalsName) => (metric: { value: number; rating: VitalsRating }) => {
      buffer.push({
        name,
        value: metric.value,
        rating: metric.rating,
        page: window.location.pathname || "/",
        userAgent: navigator.userAgent || "unknown",
        tier: opts.tier,
      });
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log("[vitals]", name, metric.value, metric.rating);
      }
      scheduleFlush();
    };
    wv.onFCP(emit("FCP"));
    wv.onLCP(emit("LCP"));
    wv.onINP(emit("INP"));
    wv.onCLS(emit("CLS"));
    wv.onTTFB(emit("TTFB"));
  });
}
