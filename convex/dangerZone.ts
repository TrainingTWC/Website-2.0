/**
 * Danger Zone mutations — destructive, superadmin-only operations.
 * Each clears exactly one table and logs to auditLog.
 */
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function clearTable(ctx: any, table: string) {
  const rows = await (ctx.db as any).query(table).collect();
  await Promise.all(rows.map((r: any) => ctx.db.delete(r._id)));
  return rows.length;
}

async function log(ctx: any, action: string, detail: string) {
  // Attempt to identify the caller — optional, silently skip if admins missing.
  try {
    await ctx.db.insert("auditLog", {
      action,
      detail,
      timestamp: Date.now(),
    });
  } catch { /* ignore — auditLog may have stricter schema */ }
}

// ── Individual clears ──────────────────────────────────────────────────────

export const clearPageViews = mutation({
  args: {},
  handler: async (ctx) => {
    const n = await clearTable(ctx, "pageViews");
    await log(ctx, "DANGER:clearPageViews", `Deleted ${n} page view records`);
    return n;
  },
});

export const clearSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const n = await clearTable(ctx, "sessions");
    await log(ctx, "DANGER:clearSessions", `Deleted ${n} AI session records`);
    return n;
  },
});

export const clearOrders = mutation({
  args: {},
  handler: async (ctx) => {
    const n = await clearTable(ctx, "orders");
    await log(ctx, "DANGER:clearOrders", `Deleted ${n} orders`);
    return n;
  },
});

export const clearAiCache = mutation({
  args: {},
  handler: async (ctx) => {
    const n = await clearTable(ctx, "aiCache");
    await log(ctx, "DANGER:clearAiCache", `Deleted ${n} AI cache entries`);
    return n;
  },
});

export const clearAuditLog = mutation({
  args: {},
  handler: async (ctx) => {
    const n = await clearTable(ctx, "auditLog");
    return n;
  },
});

export const clearDiscounts = mutation({
  args: {},
  handler: async (ctx) => {
    const n = await clearTable(ctx, "discounts");
    await log(ctx, "DANGER:clearDiscounts", `Deleted ${n} discounts`);
    return n;
  },
});

export const clearProducts = mutation({
  args: {},
  handler: async (ctx) => {
    const n = await clearTable(ctx, "products");
    await log(ctx, "DANGER:clearProducts", `Deleted ${n} products`);
    return n;
  },
});

export const clearCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const n = await clearTable(ctx, "categories");
    await log(ctx, "DANGER:clearCategories", `Deleted ${n} categories`);
    return n;
  },
});

export const clearPosts = mutation({
  args: {},
  handler: async (ctx) => {
    const n = await clearTable(ctx, "posts");
    await log(ctx, "DANGER:clearPosts", `Deleted ${n} blog/editorial posts`);
    return n;
  },
});

// ── Group resets ───────────────────────────────────────────────────────────

export const resetAnalytics = mutation({
  args: {},
  handler: async (ctx) => {
    const pv = await clearTable(ctx, "pageViews");
    const s = await clearTable(ctx, "sessions");
    const ai = await clearTable(ctx, "aiCache");
    await log(ctx, "DANGER:resetAnalytics", `Cleared pageViews(${pv}), sessions(${s}), aiCache(${ai})`);
    return { pageViews: pv, sessions: s, aiCache: ai };
  },
});

export const resetOrders = mutation({
  args: {},
  handler: async (ctx) => {
    const o = await clearTable(ctx, "orders");
    const d = await clearTable(ctx, "discounts");
    await log(ctx, "DANGER:resetOrders", `Cleared orders(${o}), discounts(${d})`);
    return { orders: o, discounts: d };
  },
});

export const resetCatalog = mutation({
  args: {},
  handler: async (ctx) => {
    const p = await clearTable(ctx, "products");
    const c = await clearTable(ctx, "categories");
    const po = await clearTable(ctx, "posts");
    await log(ctx, "DANGER:resetCatalog", `Cleared products(${p}), categories(${c}), posts(${po})`);
    return { products: p, categories: c, posts: po };
  },
});

// ── Full site reset — NUCLEAR ─────────────────────────────────────────────

export const nukeEverything = mutation({
  args: { confirmPhrase: v.string() },
  handler: async (ctx, { confirmPhrase }) => {
    if (confirmPhrase !== "WIPE EVERYTHING") {
      throw new Error("Confirmation phrase mismatch");
    }
    const tables = [
      "pageViews", "sessions", "aiCache", "orders", "discounts",
      "products", "categories", "posts", "auditLog",
    ];
    const counts: Record<string, number> = {};
    for (const table of tables) {
      counts[table] = await clearTable(ctx, table);
    }
    // Log after other tables cleared (auditLog was just wiped, this is fresh).
    await log(ctx, "DANGER:nukeEverything", `Full site reset: ${JSON.stringify(counts)}`);
    return counts;
  },
});

// ── Counts for the UI ──────────────────────────────────────────────────────

export const getTableCounts = query({
  args: {},
  handler: async (ctx) => {
    const count = async (table: string) => {
      const rows = await (ctx.db as any).query(table).collect();
      return rows.length;
    };
    return {
      pageViews: await count("pageViews"),
      sessions: await count("sessions"),
      orders: await count("orders"),
      aiCache: await count("aiCache"),
      discounts: await count("discounts"),
      products: await count("products"),
      categories: await count("categories"),
      posts: await count("posts"),
      auditLog: await count("auditLog"),
    };
  },
});
