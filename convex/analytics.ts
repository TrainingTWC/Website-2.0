import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./authHelpers";

// ── getSalesOverview ────────────────────────────────────────────────────────
// Reads the O(1) orderSummary singleton instead of scanning all orders.
export const getSalesOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const summary = await ctx.db
      .query("orderSummary")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
    if (!summary) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        avgOrderValue: 0,
      };
    }
    return {
      totalRevenue: summary.totalRevenue,
      totalOrders: summary.totalOrders,
      completedOrders: summary.completedOrders,
      pendingOrders: summary.pendingOrders,
      cancelledOrders: summary.cancelledOrders,
      avgOrderValue: summary.avgOrderValue,
    };
  },
});

// ── getDailyRevenue ─────────────────────────────────────────────────────────
// Bounded scan: only fetches orders from the last N days using the index.
export const getDailyRevenue = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const windowDays = Math.min(args.days ?? 30, 90);
    const since = Date.now() - windowDays * 24 * 60 * 60 * 1000;
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_creation_time")
      .filter((q) => q.gte(q.field("_creationTime"), since))
      .collect();

    const buckets: Record<string, number> = {};
    for (const order of orders) {
      if (!["confirmed", "shipped", "delivered"].includes(order.status)) continue;
      const date = new Date(order._creationTime).toISOString().slice(0, 10);
      buckets[date] = (buckets[date] ?? 0) + (order.total ?? 0);
    }

    const result: { date: string; revenue: number }[] = [];
    for (let i = windowDays - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      result.push({ date: d, revenue: buckets[d] ?? 0 });
    }
    return result;
  },
});

// ── getTopProducts ──────────────────────────────────────────────────────────
// Bounded to 90 days to keep read fan-out manageable.
export const getTopProducts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const since = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_creation_time")
      .filter((q) => q.gte(q.field("_creationTime"), since))
      .collect();

    const counts: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const order of orders) {
      if (!["confirmed", "shipped", "delivered"].includes(order.status)) continue;
      for (const item of order.items ?? []) {
        const entry = counts[item.productId] ?? { name: item.name, qty: 0, revenue: 0 };
        entry.qty += item.qty;
        entry.revenue += item.price * item.qty;
        counts[item.productId] = entry;
      }
    }
    return Object.entries(counts)
      .map(([id, data]) => ({ productId: id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  },
});

// ── getOrderStatusBreakdown ─────────────────────────────────────────────────
export const getOrderStatusBreakdown = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const summary = await ctx.db
      .query("orderSummary")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
    if (!summary) return [];
    return [
      { status: "pending", count: summary.pendingOrders },
      { status: "confirmed/shipped/delivered", count: summary.completedOrders },
      { status: "cancelled", count: summary.cancelledOrders },
    ];
  },
});

// ── rebuildSummary ──────────────────────────────────────────────────────────
// One-time backfill. Run once from the dashboard to populate orderSummary.
export const rebuildSummary = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const REVENUE_STATUSES = new Set(["confirmed", "shipped", "delivered"]);
    const all = await ctx.db.query("orders").collect();

    let totalRevenue = 0;
    let completedOrders = 0;
    let pendingOrders = 0;
    let cancelledOrders = 0;

    for (const o of all) {
      if (REVENUE_STATUSES.has(o.status)) {
        totalRevenue += o.total ?? 0;
        completedOrders++;
      } else if (o.status === "pending") {
        pendingOrders++;
      } else if (o.status === "cancelled") {
        cancelledOrders++;
      }
    }

    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
    const payload = {
      key: "global" as const,
      totalRevenue,
      totalOrders: all.length,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      avgOrderValue,
      updatedAt: Date.now(),
    };

    const existing = await ctx.db
      .query("orderSummary")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, payload);
    } else {
      await ctx.db.insert("orderSummary", payload);
    }
    return { totalOrders: all.length, completedOrders, totalRevenue };
  },
});
