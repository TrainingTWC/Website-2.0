/**
 * PostHog thin wrapper — safe to import on both client and server.
 * No-op when NEXT_PUBLIC_POSTHOG_KEY is not set or during SSR.
 */
import posthog from "posthog-js";

export { posthog };

export function capture(event: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    posthog.capture(event, props);
  } catch {
    // PostHog not yet initialised — silently drop
  }
}
