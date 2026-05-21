"use client";

import { LazyMotion, domAnimation } from "motion/react";
import type { ReactNode } from "react";

/**
 * Lazy-loads motion/react's animation feature bundle so the initial JS
 * payload only ships the small `m` component shell. Components keep using
 * `motion.X` (not `m.X`) — `strict` mode is deliberately OFF because
 * migrating ~30 existing call-sites is out of scope for this phase.
 *
 * Per CONTEXT D-09.
 */
export function LazyMotionRoot({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
