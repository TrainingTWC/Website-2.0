"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { CartProvider } from "../src/context/CartContext";
import { DiscountProvider } from "../src/context/DiscountContext";
import { ToastProvider } from "../src/context/ToastContext";
import { CartPanelProvider } from "../src/context/CartPanelContext";
import { PerfModeProvider } from "../src/context/PerfModeContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import { WebVitalsBootstrap } from "../src/components/WebVitalsBootstrap";
import { LazyMotionRoot } from "../src/components/LazyMotionRoot";
import { ThemePicker } from "../src/components/ThemePicker";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://different-bulldog-772.convex.cloud"
);

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (key && typeof window !== "undefined") {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
        capture_pageview: true,
        capture_pageleave: true,
        // Manual event tracking only — autocapture adds noise at 100k+ visits
        autocapture: false,
      });
    }
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <ConvexAuthProvider client={convex}>
        <ThemeProvider>
          <PerfModeProvider>
            <WebVitalsBootstrap />
            <LazyMotionRoot>
              <CartProvider>
                <DiscountProvider>
                  <ToastProvider>
                    <CartPanelProvider>
                      {children}
                      <ThemePicker />
                    </CartPanelProvider>
                  </ToastProvider>
                </DiscountProvider>
              </CartProvider>
            </LazyMotionRoot>
          </PerfModeProvider>
        </ThemeProvider>
      </ConvexAuthProvider>
    </PostHogProvider>
  );
}
