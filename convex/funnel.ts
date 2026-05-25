/**
 * v8.0 funnel telemetry — anonymous event ingestion + admin dashboard queries.
 *
 * Schema: see `customerEventsAnonymous`, `cartSnapshots`, `clientErrors`,
 * `funnelSummary` in `convex/schema.ts`.
 *
 * Catalog: `.planning/milestones/v8.0-ANALYTICS-CATALOG.md`.
 *
 * Public mutations (NO admin gate — they accept anonymous traffic):
 *   - trackBatch         — write up to 50 events in one round-trip
 *   - snapshotCart       — upsert current cart per anonId
 *   - markCartConverted  — called by submitOrder finaliser
 *   - logClientError     — write a single JS / API error
 *
 * Admin queries (requireAdmin):
 *   - getFunnelOverview     — KPI tiles for dashboard
 *   - getDropoutHotspots    — top "last_interaction" before abandonment
 *   - getAbandonedCarts     — recent cart snapshots with no order
 *   - getPaymentFunnel      — checkout-init → payment-init → order
 *   - getDeviceBreakdown    — mobile vs tablet vs desktop dropout rates
 *   - getFrictionEvents     — rage / dead / slow click counts
 *   - getRecentClientErrors — JS/API error feed
 *   - getDailyTrend         — orders + sessions per day
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./authHelpers";

// ─── Constants ──────────────────────────────────────────────────────────────
const MAX_BATCH = 50;
const ABANDON_THRESHOLD_MS = 30 * 60 * 1000;       // 30 min idle = abandoned
const HOT_QUERY_WINDOW_MS = 90 * 24 * 60 * 60_000; // dashboard hard cap

// Event names we treat as "funnel stages" for the overview tile.
const STAGE_PRODUCT_VIEW = "product_viewed";
const STAGE_CART = "cart_item_added";
const STAGE_CHECKOUT_INIT = "checkout_initiated";
const STAGE_PAYMENT_INIT = "payment_initiated";
const STAGE_ORDER = "order_confirmed";

// ════════════════════════════════════════════════════════════════════════════
//  Public ingestion mutations (no admin gate)
// ════════════════════════════════════════════════════════════════════════════

export const trackBatch = mutation({
  args: {
    events: v.array(
      v.object({
        anonId: v.string(),
        sessionId: v.string(),
        ts: v.number(),
        name: v.string(),
        stage: v.optional(v.number()),
        route: v.optional(v.string()),
        propsJson: v.string(),
        device: v.optional(v.union(v.literal("mobile"), v.literal("tablet"), v.literal("desktop"))),
        connection: v.optional(v.string()),
        referrer: v.optional(v.string()),
        utmSource: v.optional(v.string()),
        utmMedium: v.optional(v.string()),
        utmCampaign: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (args.events.length === 0) return { written: 0 };
    if (args.events.length > MAX_BATCH) {
      // Trim rather than throw — never break the client over telemetry.
      args.events = args.events.slice(0, MAX_BATCH);
    }
    for (const ev of args.events) {
      // Defensive: cap propsJson size at 4 KB.
      const props = ev.propsJson.length > 4096 ? ev.propsJson.slice(0, 4096) : ev.propsJson;
      // Cap anonId/sessionId/route to reject oversized spam payloads (TELEMETRY-FLOOD-01).
      const anonId    = ev.anonId.slice(0, 128);
      const sessionId = ev.sessionId.slice(0, 128);
      const route     = ev.route ? ev.route.slice(0, 256) : ev.route;
      const name      = ev.name.slice(0, 128);
      await ctx.db.insert("customerEventsAnonymous", { ...ev, anonId, sessionId, route, name, propsJson: props });
    }
    return { written: args.events.length };
  },
});

export const snapshotCart = mutation({
  args: {
    anonId: v.string(),
    sessionId: v.string(),
    itemsJson: v.string(),
    itemCount: v.number(),
    subtotal: v.number(),
    lastEventName: v.optional(v.string()),
    lastRoute: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("cartSnapshots")
      .withIndex("by_anon", (q) => q.eq("anonId", args.anonId))
      .first();
    const payload = {
      ...args,
      updatedAt: Date.now(),
      converted: false as const,
    };
    if (existing) {
      // Don't overwrite contact if we previously captured it.
      const merged = {
        ...payload,
        contactPhone: args.contactPhone ?? existing.contactPhone,
        contactEmail: args.contactEmail ?? existing.contactEmail,
        // Once converted stays converted (next add-to-cart starts a new cycle
        // by anonId, but we keep history intact).
        converted: existing.converted,
        abandonedAt: existing.abandonedAt,
      };
      await ctx.db.patch(existing._id, merged);
      return { id: existing._id, mode: "update" as const };
    }
    const id = await ctx.db.insert("cartSnapshots", payload);
    return { id, mode: "insert" as const };
  },
});

export const markCartConverted = mutation({
  args: { anonId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("cartSnapshots")
      .withIndex("by_anon", (q) => q.eq("anonId", args.anonId))
      .first();
    if (!existing) return { ok: false };
    await ctx.db.patch(existing._id, { converted: true, updatedAt: Date.now() });
    return { ok: true };
  },
});

export const logClientError = mutation({
  args: {
    anonId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    route: v.optional(v.string()),
    type: v.string(),
    message: v.string(),
    stack: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    extraJson: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Cap string fields to prevent DB-flooding via oversized payloads (TELEMETRY-FLOOD-01).
    const safeMessage = args.message.slice(0, 2000);
    const safeStack   = args.stack ? args.stack.slice(0, 4000) : undefined;
    const safeExtra   = args.extraJson ? args.extraJson.slice(0, 2000) : undefined;
    await ctx.db.insert("clientErrors", {
      ...args,
      message: safeMessage,
      stack: safeStack,
      extraJson: safeExtra,
      ts: Date.now(),
    });
    return { ok: true };
  },
});

// ════════════════════════════════════════════════════════════════════════════
//  Admin queries
// ════════════════════════════════════════════════════════════════════════════

/** Window helpers — every query bounds its scan to the last N days. */
function sinceFor(days: number) {
  const clamped = Math.max(1, Math.min(90, days || 7));
  return { since: Date.now() - clamped * 24 * 60 * 60 * 1000, days: clamped };
}

export const getFunnelOverview = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { since, days } = sinceFor(args.days ?? 7);

    const events = await ctx.db
      .query("customerEventsAnonymous")
      .withIndex("by_ts", (q) => q.gte("ts", since))
      .collect();

    // Build per-session stage flags.
    const sessions = new Map<string, {
      pdp: boolean; cart: boolean; checkout: boolean; payment: boolean; order: boolean;
      device?: string; lastEventName?: string;
    }>();
    for (const ev of events) {
      const s = sessions.get(ev.sessionId) ?? {
        pdp: false, cart: false, checkout: false, payment: false, order: false,
      };
      if (ev.name === STAGE_PRODUCT_VIEW) s.pdp = true;
      if (ev.name === STAGE_CART) s.cart = true;
      if (ev.name === STAGE_CHECKOUT_INIT) s.checkout = true;
      if (ev.name === STAGE_PAYMENT_INIT) s.payment = true;
      if (ev.name === STAGE_ORDER) s.order = true;
      if (!s.device && ev.device) s.device = ev.device;
      s.lastEventName = ev.name;
      sessions.set(ev.sessionId, s);
    }

    const total = sessions.size;
    const pdp = [...sessions.values()].filter((s) => s.pdp).length;
    const cart = [...sessions.values()].filter((s) => s.cart).length;
    const checkout = [...sessions.values()].filter((s) => s.checkout).length;
    const payment = [...sessions.values()].filter((s) => s.payment).length;
    const order = [...sessions.values()].filter((s) => s.order).length;

    // Abandonment from snapshots.
    const snaps = await ctx.db
      .query("cartSnapshots")
      .withIndex("by_updatedAt", (q) => q.gte("updatedAt", since))
      .collect();
    const abandoned = snaps.filter(
      (s) => !s.converted && Date.now() - s.updatedAt > ABANDON_THRESHOLD_MS && s.itemCount > 0
    );
    const abandonedValue = abandoned.reduce((acc, s) => acc + s.subtotal, 0);

    return {
      days,
      sessions: total,
      funnel: [
        { stage: "Sessions", count: total },
        { stage: "Viewed product", count: pdp },
        { stage: "Added to cart", count: cart },
        { stage: "Started checkout", count: checkout },
        { stage: "Initiated payment", count: payment },
        { stage: "Ordered", count: order },
      ],
      rates: {
        atcRate: pdp > 0 ? cart / pdp : 0,
        checkoutRate: cart > 0 ? checkout / cart : 0,
        paymentRate: checkout > 0 ? payment / checkout : 0,
        conversionRate: total > 0 ? order / total : 0,
        cartAbandonRate: cart > 0 ? (cart - order) / cart : 0,
      },
      abandoned: {
        count: abandoned.length,
        value: abandonedValue,
      },
    };
  },
});

export const getDropoutHotspots = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { since } = sinceFor(args.days ?? 7);

    const events = await ctx.db
      .query("customerEventsAnonymous")
      .withIndex("by_ts", (q) => q.gte("ts", since))
      .collect();

    // For each session, find the latest event and whether it converted.
    const last = new Map<string, { name: string; route?: string; ts: number; converted: boolean }>();
    for (const ev of events) {
      const cur = last.get(ev.sessionId);
      if (!cur || ev.ts > cur.ts) {
        last.set(ev.sessionId, {
          name: ev.name,
          route: ev.route,
          ts: ev.ts,
          converted: cur?.converted ?? false,
        });
      }
      if (ev.name === STAGE_ORDER) {
        const c = last.get(ev.sessionId)!;
        c.converted = true;
      }
    }

    const buckets = new Map<string, { count: number; route?: string }>();
    for (const v of last.values()) {
      if (v.converted) continue;
      // Skip neutral "noise" events that aren't dropout points.
      if (v.name === STAGE_ORDER || v.name === "page_view") continue;
      const key = v.name;
      const cur = buckets.get(key) ?? { count: 0, route: v.route };
      cur.count++;
      buckets.set(key, cur);
    }

    return [...buckets.entries()]
      .map(([name, { count, route }]) => ({ name, count, route }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  },
});

export const getAbandonedCarts = query({
  args: { days: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { since } = sinceFor(args.days ?? 7);
    const limit = Math.max(1, Math.min(100, args.limit ?? 25));

    const snaps = await ctx.db
      .query("cartSnapshots")
      .withIndex("by_updatedAt", (q) => q.gte("updatedAt", since))
      .collect();

    const filtered = snaps.filter(
      (s) => !s.converted && Date.now() - s.updatedAt > ABANDON_THRESHOLD_MS && s.itemCount > 0
    );
    filtered.sort((a, b) => b.subtotal - a.subtotal);
    return filtered.slice(0, limit).map((s) => ({
      _id: s._id,
      updatedAt: s.updatedAt,
      itemCount: s.itemCount,
      subtotal: s.subtotal,
      lastEventName: s.lastEventName,
      lastRoute: s.lastRoute,
      hasContact: Boolean(s.contactEmail || s.contactPhone),
      itemsJson: s.itemsJson,
    }));
  },
});

export const getPaymentFunnel = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { since } = sinceFor(args.days ?? 7);
    const events = await ctx.db
      .query("customerEventsAnonymous")
      .withIndex("by_ts", (q) => q.gte("ts", since))
      .collect();

    let init = 0, attempt = 0, success = 0, failed = 0;
    const failureReasons = new Map<string, number>();
    const methodCounts = new Map<string, number>();

    for (const ev of events) {
      if (ev.name === "payment_initiated") {
        init++;
        try {
          const props = JSON.parse(ev.propsJson);
          if (props.method) methodCounts.set(props.method, (methodCounts.get(props.method) ?? 0) + 1);
        } catch { /* ignore */ }
      } else if (ev.name === "payment_attempted") {
        attempt++;
      } else if (ev.name === "payment_failed") {
        failed++;
        try {
          const props = JSON.parse(ev.propsJson);
          const reason = props.reason ?? "unknown";
          failureReasons.set(reason, (failureReasons.get(reason) ?? 0) + 1);
        } catch { /* ignore */ }
      } else if (ev.name === STAGE_ORDER) {
        success++;
      }
    }

    return {
      funnel: [
        { stage: "Payment initiated", count: init },
        { stage: "Attempt sent", count: attempt },
        { stage: "Failed", count: failed },
        { stage: "Order confirmed", count: success },
      ],
      methodMix: [...methodCounts.entries()].map(([method, count]) => ({ method, count })),
      failureReasons: [...failureReasons.entries()]
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count),
    };
  },
});

export const getDeviceBreakdown = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { since } = sinceFor(args.days ?? 7);
    const events = await ctx.db
      .query("customerEventsAnonymous")
      .withIndex("by_ts", (q) => q.gte("ts", since))
      .collect();

    const byDevice = new Map<string, { sessions: Set<string>; orders: Set<string> }>();
    for (const ev of events) {
      const d = ev.device ?? "unknown";
      const bucket = byDevice.get(d) ?? { sessions: new Set(), orders: new Set() };
      bucket.sessions.add(ev.sessionId);
      if (ev.name === STAGE_ORDER) bucket.orders.add(ev.sessionId);
      byDevice.set(d, bucket);
    }
    return [...byDevice.entries()].map(([device, { sessions, orders }]) => ({
      device,
      sessions: sessions.size,
      orders: orders.size,
      conversionRate: sessions.size > 0 ? orders.size / sessions.size : 0,
    }));
  },
});

export const getFrictionEvents = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { since } = sinceFor(args.days ?? 7);
    const events = await ctx.db
      .query("customerEventsAnonymous")
      .withIndex("by_ts", (q) => q.gte("ts", since))
      .collect();

    const tally: Record<string, number> = {
      rage_click: 0,
      dead_click: 0,
      slow_action: 0,
      field_invalid: 0,
      modal_dismissed: 0,
      browser_back_in_checkout: 0,
    };
    for (const ev of events) {
      if (ev.name in tally) tally[ev.name]++;
    }
    return Object.entries(tally).map(([name, count]) => ({ name, count }));
  },
});

export const getRecentClientErrors = query({
  args: { days: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { since } = sinceFor(args.days ?? 1);
    const limit = Math.max(1, Math.min(100, args.limit ?? 25));
    const rows = await ctx.db
      .query("clientErrors")
      .withIndex("by_ts", (q) => q.gte("ts", since))
      .order("desc")
      .take(limit);
    return rows.map((r) => ({
      _id: r._id,
      ts: r.ts,
      type: r.type,
      message: r.message,
      route: r.route,
      stack: r.stack?.slice(0, 400),
    }));
  },
});

export const getDailyTrend = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { since, days } = sinceFor(args.days ?? 14);
    const events = await ctx.db
      .query("customerEventsAnonymous")
      .withIndex("by_ts", (q) => q.gte("ts", since))
      .collect();

    const byDay = new Map<string, { sessions: Set<string>; orders: number; carts: number }>();
    for (const ev of events) {
      const d = new Date(ev.ts).toISOString().slice(0, 10);
      const cur = byDay.get(d) ?? { sessions: new Set(), orders: 0, carts: 0 };
      cur.sessions.add(ev.sessionId);
      if (ev.name === STAGE_ORDER) cur.orders++;
      if (ev.name === STAGE_CART) cur.carts++;
      byDay.set(d, cur);
    }
    const out: { date: string; sessions: number; carts: number; orders: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const cur = byDay.get(d);
      out.push({
        date: d,
        sessions: cur?.sessions.size ?? 0,
        carts: cur?.carts ?? 0,
        orders: cur?.orders ?? 0,
      });
    }
    return out;
  },
});
