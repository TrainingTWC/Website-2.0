// server-only — do not import this file in client components
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!url) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set. Add it to .env.local.");
}

/**
 * Server-side Convex HTTP client singleton.
 * Use this in Next.js API routes to call mutations and actions without
 * exposing the Convex deployment URL to the browser or opening a WebSocket.
 */
export const convexServer = new ConvexHttpClient(url);

/**
 * Typed reference to the Convex generated API.
 * Re-exported here so proxy routes have a single import path.
 */
export const convexApi = api;
