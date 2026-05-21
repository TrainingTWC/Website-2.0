"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePerfTier, type PerfSignals } from "@/src/lib/usePerfTier";

const DEFAULT: PerfSignals = {
  tier: "mid",
  deviceMemoryGB: null,
  hwConcurrency: null,
  reducedMotion: false,
  estimatedHz: null,
};

const PerfModeContext = createContext<PerfSignals>(DEFAULT);

export function PerfModeProvider({ children }: { children: ReactNode }) {
  const signals = usePerfTier();
  return (
    <PerfModeContext.Provider value={signals}>
      {children}
    </PerfModeContext.Provider>
  );
}

export function usePerfMode(): PerfSignals {
  return useContext(PerfModeContext);
}
