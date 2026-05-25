/**
 * Internal data-export queries.
 *
 * Each function is an internalQuery — not callable from the browser.
 * Only the HTTP export action (convex/http.ts) invokes these via
 * ctx.runQuery(internal.dataExport.*).
 *
 * Tables exported:
 *   orders, orderSummary, products, categories, admins (PII-stripped),
 *   discounts, posts, pageViewDailySummary, customerEventsAnonymous,
 *   cartSnapshots, clientErrors, funnelSummary, webVitals, auditLog, media
 *
 * Tables intentionally NOT exported (security/irrelevance):
 *   adminOtp, adminLoginAttempts, adminOtpSessions — security credentials
 *   apiKeys                                        — key hashes must never leave Convex
 *   aiCache                                        — ephemeral LLM cache, no analytics value
 *   sessions / rules                               — AI quiz state, not needed for BI
 */

import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

// ── Orders ─────────────────────────────────────────────────────────────────

export const _getOrders = internalQuery({
  args: { from: v.number() },
  handler: async (ctx, { from }) =>
    ctx.db
      .query("orders")
      .withIndex("by_creation_time")
      .filter((q) => q.gte(q.field("_creationTime"), from))
      .order("desc")
      .take(5000),
});

export const _getOrderSummary = internalQuery({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("orderSummary")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first(),
});

// ── Catalogue ──────────────────────────────────────────────────────────────

export const _getProducts = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("products").collect(),
});

export const _getCategories = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("categories").collect(),
});

// ── Admins (safe fields only — no internal user IDs or auth tokens) ────────

export const _getAdmins = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("admins").collect();
    // Strip `userId` and `invitedBy` (internal Convex auth IDs — no value outside Convex)
    return rows.map(({ _id, email, name, role, permissions, active, invitedAt, lastSeenAt }) => ({
      _id,
      email,
      name,
      role,
      permissions,
      active,
      invitedAt,
      lastSeenAt,
    }));
  },
});

// ── Discounts ──────────────────────────────────────────────────────────────

export const _getDiscounts = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("discounts").collect(),
});

// ── Editorial posts ────────────────────────────────────────────────────────

export const _getPosts = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("posts").collect(),
});

// ── Page view aggregates ───────────────────────────────────────────────────

export const _getPageViewDailySummary = internalQuery({
  args: { fromDate: v.string() }, // ISO "YYYY-MM-DD"
  handler: async (ctx, { fromDate }) =>
    ctx.db
      .query("pageViewDailySummary")
      .withIndex("by_date", (q) => q.gte("date", fromDate))
      .collect(),
});

export const _getPageViews = internalQuery({
  args: { from: v.number() },
  handler: async (ctx, { from }) =>
    ctx.db
      .query("pageViews")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", from))
      .order("desc")
      .take(2000),
});

// ── Funnel telemetry ───────────────────────────────────────────────────────

export const _getCustomerEvents = internalQuery({
  args: { from: v.number() },
  handler: async (ctx, { from }) =>
    ctx.db
      .query("customerEventsAnonymous")
      .withIndex("by_ts", (q) => q.gte("ts", from))
      .order("desc")
      .take(5000),
});

export const _getCartSnapshots = internalQuery({
  args: { from: v.number() },
  handler: async (ctx, { from }) =>
    ctx.db
      .query("cartSnapshots")
      .withIndex("by_updatedAt", (q) => q.gte("updatedAt", from))
      .order("desc")
      .take(2000),
});

export const _getClientErrors = internalQuery({
  args: { from: v.number() },
  handler: async (ctx, { from }) =>
    ctx.db
      .query("clientErrors")
      .withIndex("by_ts", (q) => q.gte("ts", from))
      .order("desc")
      .take(1000),
});

export const _getFunnelSummary = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("funnelSummary").collect(),
});

// ── Web vitals ─────────────────────────────────────────────────────────────

export const _getWebVitals = internalQuery({
  args: { from: v.number() },
  handler: async (ctx, { from }) =>
    ctx.db
      .query("webVitals")
      .withIndex("by_creation_time")
      .filter((q) => q.gte(q.field("_creationTime"), from))
      .order("desc")
      .take(2000),
});

// ── Audit log ──────────────────────────────────────────────────────────────

export const _getAuditLog = internalQuery({
  args: { from: v.number() },
  handler: async (ctx, { from }) =>
    ctx.db
      .query("auditLog")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", from))
      .order("desc")
      .take(2000),
});

// ── Studio media ───────────────────────────────────────────────────────────

export const _getMedia = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("media").collect(),
});
