"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const PANELS = [
  "bg-natural-pink-soft",
  "bg-natural-green-soft",
  "bg-natural-orange-soft",
  "bg-natural-paper",
] as const;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <>{children}</>;
  }

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 14, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
          transition={{ duration: 0.38, ease: EASE }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none fixed inset-0 z-[1000] overflow-hidden" aria-hidden>
        {PANELS.map((panel, index) => (
          <motion.div
            key={`${pathname}-${panel}`}
            className={`absolute inset-x-0 ${panel}`}
            style={{ top: `${index * 25}%`, height: "25%" }}
            initial={{ x: index % 2 === 0 ? "-104%" : "104%" }}
            animate={{ x: index % 2 === 0 ? "104%" : "-104%" }}
            transition={{ duration: 0.82, delay: index * 0.045, ease: EASE }}
          />
        ))}
      </div>
    </>
  );
}