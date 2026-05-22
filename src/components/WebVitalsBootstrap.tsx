"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePerfMode } from "@/src/context/PerfModeContext";
import { reportWebVitals } from "@/src/lib/webVitals";

/**
 * Mounts once near the provider root and pipes web-vitals to Convex.
 * Tier-tagged so we can correlate metrics with the device's perf tier.
 *
 * Subscribes on first mount only — web-vitals itself handles per-metric
 * deduping. The tier value at first report may still be the SSR default
 * (`mid`) if the perf hook has not yet settled; that's intentional and
 * accurately reflects what the user experienced at first paint.
 */
export function WebVitalsBootstrap() {
  const { tier } = usePerfMode();
  const recordBatch = useMutation(api.webVitals.recordBatch);
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;
    reportWebVitals({
      tier,
      sendBatchToConvex: (vitals) => {
        void recordBatch({ vitals }).catch(() => {
          /* never let telemetry break the app */
        });
      },
    });
  }, [tier, recordBatch]);

  return null;
}
