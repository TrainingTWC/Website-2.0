"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePerfMode } from "@/src/context/PerfModeContext";

const MagneticCursorInner = dynamic(
  () =>
    import("./MagneticCursor").then((m) => ({
      default: m.MagneticCursor,
    })),
  { ssr: false }
);

/**
 * Tier-gated magnetic cursor.
 *
 * Only mounts when:
 *   - tier === "high"
 *   - reduced-motion is OFF
 *   - input device is a fine pointer (mouse/trackpad, not touch)
 *
 * Otherwise renders nothing — no bundle is requested.
 */
export function MagneticCursor() {
  const { tier, reducedMotion } = usePerfMode();
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    setFinePointer(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setFinePointer(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  if (tier !== "high" || reducedMotion || !finePointer) return null;
  return <MagneticCursorInner />;
}
