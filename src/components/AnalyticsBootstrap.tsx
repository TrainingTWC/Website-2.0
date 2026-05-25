"use client";
import { useEffect } from "react";
import { bootstrapAnalytics } from "../lib/analytics";

/** Mounts global analytics listeners exactly once on the client. */
export function AnalyticsBootstrap() {
  useEffect(() => {
    bootstrapAnalytics();
  }, []);
  return null;
}
