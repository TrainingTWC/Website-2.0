"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import type { ReactNode } from "react";
import { CartProvider } from "../src/context/CartContext";
import { DiscountProvider } from "../src/context/DiscountContext";
import { ToastProvider } from "../src/context/ToastContext";
import { CartPanelProvider } from "../src/context/CartPanelContext";
import { PerfModeProvider } from "../src/context/PerfModeContext";
import { WebVitalsBootstrap } from "../src/components/WebVitalsBootstrap";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://different-bulldog-772.convex.cloud"
);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider client={convex}>
      <PerfModeProvider>
        <WebVitalsBootstrap />
        <CartProvider>
          <DiscountProvider>
            <ToastProvider>
              <CartPanelProvider>{children}</CartPanelProvider>
            </ToastProvider>
          </DiscountProvider>
        </CartProvider>
      </PerfModeProvider>
    </ConvexAuthProvider>
  );
}
