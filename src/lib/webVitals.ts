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

interface ReportOptions {
  tier: PerfTier;
  sendToConvex: (m: VitalsPayload) => void;
}

/**
 * Subscribes to web-vitals metrics and forwards them to Convex.
 *
 * - Dynamically imports `web-vitals` so it stays out of the critical path.
 * - In dev (`NODE_ENV !== "production"`), each metric is also logged.
 * - Safe to call on the client only; no-ops if `window` is undefined.
 */
export function reportWebVitals(opts: ReportOptions): void {
  if (typeof window === "undefined") return;

  void import("web-vitals").then((wv) => {
    const emit = (name: VitalsName) => (metric: { value: number; rating: VitalsRating }) => {
      const payload: VitalsPayload = {
        name,
        value: metric.value,
        rating: metric.rating,
        page: window.location.pathname || "/",
        userAgent: navigator.userAgent || "unknown",
        tier: opts.tier,
      };
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log("[vitals]", payload);
      }
      try {
        opts.sendToConvex(payload);
      } catch {
        /* swallow — never let telemetry break the app */
      }
    };
    wv.onFCP(emit("FCP"));
    wv.onLCP(emit("LCP"));
    wv.onINP(emit("INP"));
    wv.onCLS(emit("CLS"));
    wv.onTTFB(emit("TTFB"));
  });
}
