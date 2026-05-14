import { query } from "./_generated/server";
import { v } from "convex/values";

const COUNTABLE = ["confirmed", "shipped", "delivered"];

// ── getSalesOverview ───────────────────────────────────────────
export const getSalesOverview = query({
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();
    const revenue = orders
      .filter((o) => COUNTABLE.includes(o.status))
      .reduce((sum, o) => sum + (o.total ?? o.subtotal), 0);
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => COUNTABLE.includes(o.status)).length;
    const avgOrderValue = completedOrders > 0 ? revenue / completedOrders : 0;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    return { totalRevenue: revenue, totalOrders, avgOrderValue, pendingOrders };
  },
});

// ── getDailyRevenue ────────────────────────────────────────────
export const getDailyRevenue = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 30 }) => {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const orders = await ctx.db
      .query("orders")
      .filter((q) => q.gte(q.field("_creationTime"), since))
      .collect();
    const buckets: Record<string, { revenue: number; orderCount: number }> = {};
    for (const o of orders) {
      const date = new Date(o._creationTime).toISOString().slice(0, 10);
      if (!buckets[date]) buckets[date] = { revenue: 0, orderCount: 0 };
      if (COUNTABLE.includes(o.status)) buckets[date].revenue += o.total ?? o.subtotal;
      buckets[date].orderCount += 1;
    }
    return Object.entries(buckets)
      .map(([date, vals]) => ({ date, ...vals }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

// ── getTopProducts ─────────────────────────────────────────────
export const getTopProducts = query({
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const o of orders) {
      for (const item of o.items ?? []) {
        if (!map[item.productId])
          map[item.productId] = { name: item.name, qty: 0, revenue: 0 };
        map[item.productId].qty += item.qty;
        map[item.productId].revenue += item.qty * item.price;
      }
    }
    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  },
});

// ── getOrderStatusBreakdown ────────────────────────────────────
export const getOrderStatusBreakdown = query({
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();
    const result: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const o of orders) {
      result[o.status] = (result[o.status] ?? 0) + 1;
    }
    return result;
  },
});
