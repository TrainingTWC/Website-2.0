/**
 * v8.0 client analytics — anonymous funnel telemetry.
 *
 * Mirrors the catalog in `.planning/milestones/v8.0-ANALYTICS-CATALOG.md`.
 *
 * Public API:
 *   track(name, props?)          — buffered, flushed on idle / visibility
 *   trackImmediate(name, props?) — flush immediately
 *   snapshotCart(items, subtotal, lastEvent?) — upsert cart snapshot to Convex
 *   markConverted()              — call after successful order submission
 *   logError(err, extra?)        — capture a JS / API error
 *   getAnonId() / getSessionId() — accessors (rare; mostly internal)
 *
 * Design notes:
 *   - NEVER stores PII in `customerEventsAnonymous`; the contact tuple lives
 *     only on `cartSnapshots.contactEmail/Phone` (set explicitly by checkout).
 *   - Sampling: keeps 100 % of order/payment/cart events; samples `impression`,
 *     `pdp_dwell`, `scroll_depth` at 10 %.
 *   - Resilient: every send is wrapped in try/catch so analytics never breaks
 *     the app.
 */
import { api } from "../../convex/_generated/api";
import { convex } from "../../app/providers";

// ─── Constants ──────────────────────────────────────────────────────────────
const STORAGE_ANON = "twc_anon_id";
const STORAGE_UTM = "twc_session_utm";
const FLUSH_INTERVAL_MS = 5_000;
const MAX_BUFFER = 20;
const SAMPLED_EVENTS = new Set(["impression", "pdp_dwell", "scroll_depth"]);
const SAMPLE_RATE = 0.1;

// ─── Types ─────────────────────────────────────────────────────────────────
export type TrackProps = Record<string, unknown>;
export type Device = "mobile" | "tablet" | "desktop";

interface BufferedEvent {
  anonId: string;
  sessionId: string;
  ts: number;
  name: string;
  stage?: number;
  route?: string;
  propsJson: string;
  device?: Device;
  connection?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// ─── Identity ──────────────────────────────────────────────────────────────
let _anonId: string | null = null;
let _sessionId: string | null = null;

function uuid(): string {
  // Crypto.randomUUID is available in all modern browsers; fall back if not.
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch { /* ignore */ }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getAnonId(): string {
  if (typeof window === "undefined") return "ssr";
  if (_anonId) return _anonId;
  try {
    let v = localStorage.getItem(STORAGE_ANON);
    if (!v) {
      v = uuid();
      localStorage.setItem(STORAGE_ANON, v);
    }
    _anonId = v;
    return v;
  } catch {
    _anonId = uuid();
    return _anonId;
  }
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  if (_sessionId) return _sessionId;
  _sessionId = uuid();
  return _sessionId;
}

// ─── Device detection ─────────────────────────────────────────────────────
function detectDevice(): Device | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function detectConnection(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  // @ts-expect-error — `connection` is non-standard but widely available
  const c = navigator.connection ?? navigator.mozConnection ?? navigator.webkitConnection;
  return c?.effectiveType;
}

// ─── UTM persistence (first-touch attribution per session) ────────────────
interface SessionUtm {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}

function readUtm(): SessionUtm {
  if (typeof window === "undefined") return {};
  try {
    const stored = sessionStorage.getItem(STORAGE_UTM);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  const url = new URL(window.location.href);
  const utm: SessionUtm = {
    utmSource: url.searchParams.get("utm_source") ?? undefined,
    utmMedium: url.searchParams.get("utm_medium") ?? undefined,
    utmCampaign: url.searchParams.get("utm_campaign") ?? undefined,
    referrer: document.referrer || undefined,
  };
  try { sessionStorage.setItem(STORAGE_UTM, JSON.stringify(utm)); } catch { /* ignore */ }
  return utm;
}

// ─── Buffering ────────────────────────────────────────────────────────────
const buffer: BufferedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (flushTimer !== null) return;
  flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
}

async function flush() {
  if (flushTimer !== null) { clearTimeout(flushTimer); flushTimer = null; }
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, buffer.length);
  try {
    await convex.mutation(api.funnel.trackBatch, { events: batch });
  } catch {
    // Re-queue silently so we try again later — but cap to avoid leak.
    if (buffer.length < 200) buffer.unshift(...batch);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────

export function track(name: string, props?: TrackProps, opts?: { stage?: number; immediate?: boolean }): void {
  if (typeof window === "undefined") return;
  if (SAMPLED_EVENTS.has(name) && Math.random() > SAMPLE_RATE) return;

  const utm = readUtm();
  const propsJson = (() => {
    try { return JSON.stringify(props ?? {}); } catch { return "{}"; }
  })();

  const ev: BufferedEvent = {
    anonId: getAnonId(),
    sessionId: getSessionId(),
    ts: Date.now(),
    name,
    stage: opts?.stage,
    route: window.location.pathname,
    propsJson,
    device: detectDevice(),
    connection: detectConnection(),
    referrer: utm.referrer,
    utmSource: utm.utmSource,
    utmMedium: utm.utmMedium,
    utmCampaign: utm.utmCampaign,
  };
  buffer.push(ev);

  if (opts?.immediate || buffer.length >= MAX_BUFFER) {
    void flush();
  } else {
    scheduleFlush();
  }
}

export function trackImmediate(name: string, props?: TrackProps, opts?: { stage?: number }): void {
  track(name, props, { ...opts, immediate: true });
}

interface SnapshotCartItem {
  productId: string;
  qty: number;
  price: number;
  name: string;
}

export async function snapshotCart(
  items: SnapshotCartItem[],
  subtotal: number,
  lastEventName?: string,
  contact?: { phone?: string; email?: string }
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await convex.mutation(api.funnel.snapshotCart, {
      anonId: getAnonId(),
      sessionId: getSessionId(),
      itemsJson: JSON.stringify(items),
      itemCount: items.reduce((s, i) => s + i.qty, 0),
      subtotal,
      lastEventName,
      lastRoute: window.location.pathname,
      contactPhone: contact?.phone,
      contactEmail: contact?.email,
    });
  } catch { /* never break the app on telemetry */ }
}

export async function markConverted(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await convex.mutation(api.funnel.markCartConverted, { anonId: getAnonId() });
  } catch { /* ignore */ }
}

export async function logError(
  err: unknown,
  extra?: { type?: string; extra?: Record<string, unknown> }
): Promise<void> {
  if (typeof window === "undefined") return;
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  try {
    await convex.mutation(api.funnel.logClientError, {
      anonId: getAnonId(),
      sessionId: getSessionId(),
      route: window.location.pathname,
      type: extra?.type ?? "js",
      message: message.slice(0, 500),
      stack: stack?.slice(0, 2000),
      userAgent: navigator.userAgent,
      extraJson: extra?.extra ? JSON.stringify(extra.extra).slice(0, 2000) : undefined,
    });
  } catch { /* ignore */ }
}

// ─── Auto-instrumentation (mounted once by AnalyticsBootstrap) ────────────
let _bootstrapped = false;

export function bootstrapAnalytics(): void {
  if (typeof window === "undefined" || _bootstrapped) return;
  _bootstrapped = true;

  // First page view — UTM is captured here.
  readUtm();
  track("page_view", { path: window.location.pathname }, { stage: 1 });

  // Flush on tab hide / before unload.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush();
  });
  window.addEventListener("pagehide", () => { void flush(); });

  // Tab switch tracking (proxy for comparison shopping).
  document.addEventListener("visibilitychange", () => {
    track(document.visibilityState === "hidden" ? "tab_hidden" : "tab_visible");
  });

  // Global JS errors.
  window.addEventListener("error", (e) => {
    void logError(e.error ?? e.message, { type: "js" });
  });
  window.addEventListener("unhandledrejection", (e) => {
    void logError(e.reason, { type: "unhandled_rejection" });
  });

  // Network offline.
  window.addEventListener("offline", () => {
    void logError("offline", { type: "offline" });
  });

  // Rage-click heuristic — 3+ clicks on same element within 1 s.
  let lastTarget: EventTarget | null = null;
  let lastClicks = 0;
  let lastClickTs = 0;
  window.addEventListener("click", (e) => {
    const now = Date.now();
    if (e.target === lastTarget && now - lastClickTs < 1000) {
      lastClicks++;
      if (lastClicks === 3) {
        const target = (e.target as HTMLElement | null);
        track("rage_click", {
          tag: target?.tagName,
          id: target?.id || undefined,
          cls: target?.className || undefined,
        });
      }
    } else {
      lastTarget = e.target;
      lastClicks = 1;
    }
    lastClickTs = now;
  });

  // Dead-click heuristic — click on non-interactive element.
  window.addEventListener("click", (e) => {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    const interactive = t.closest("a,button,input,select,textarea,label,[role=button],[onclick]");
    if (!interactive) {
      track("dead_click", { tag: t.tagName, txt: (t.textContent ?? "").slice(0, 40) });
    }
  });
}
