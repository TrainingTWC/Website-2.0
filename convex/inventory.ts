/**
 * inventory.ts — Smart Inventory & Dynamic MOQ engine
 *
 * Exports two pure helper functions (no DB access):
 *   computeEffectiveMOQ  — calculates the maximum a customer can order
 *   applyCustomerMultiplier — adjusts MOQ based on customer purchase history
 *
 * These are imported by orders.ts (enforcement) and products.ts (read layer).
 */

// ── MOQ algorithm constants ──────────────────────────────────────────────────
const FLOOR_PERCENT = 0.10;      // 10% of stockQty — mandatory minimum cap
const FAIR_SHARE_HIGH = 0.15;    // cap when days-of-stock < 5 (fast-selling)
const FAIR_SHARE_MED = 0.20;     // cap when days-of-stock 5–14 (moderate demand)
const FAIR_SHARE_LOW = 0.30;     // cap when days-of-stock > 14 (healthy stock)
const LOW_STOCK_CAP = 0.15;      // cap when stockStatus === "low-stock"
const DEFAULT_MAX = 10;          // fallback when stockQty is undefined (no tracking)

/**
 * Compute the effective maximum order quantity for a product.
 *
 * Algorithm:
 *   1. Admin override wins unconditionally if set.
 *   2. No stockQty tracking → DEFAULT_MAX (10).
 *   3. stockQty === 0 → 0 (out of stock).
 *   4. floor = ceil(10% × stockQty)  ← the user-required 10% minimum
 *   5. velocity ceiling = ceil(capPct × stockQty), where capPct is chosen
 *      by "days of stock remaining" = stockQty / avgDailyDemand.
 *   6. Return max(floor, ceiling) clamped to stockQty.
 *
 * @param stockQty         Current units in stock (undefined = no tracking)
 * @param stockStatus      "in-stock" | "low-stock" | "out-of-stock"
 * @param maxOrderQtyOverride  Admin hard cap (undefined = use algorithm)
 * @param cachedAvgDailyDemand  7-day rolling average daily sold qty (0 if unknown)
 */
export function computeEffectiveMOQ(
  stockQty: number | undefined,
  stockStatus: string,
  maxOrderQtyOverride: number | undefined,
  cachedAvgDailyDemand: number
): number {
  // Step 0: Admin override always wins
  if (maxOrderQtyOverride != null && maxOrderQtyOverride > 0) {
    return maxOrderQtyOverride;
  }

  // Step 1: No inventory tracking
  if (stockQty == null) return DEFAULT_MAX;

  // Step 2: Out of stock
  if (stockQty === 0 || stockStatus === "out-of-stock") return 0;

  // Step 3: 10% floor — the minimum guaranteed cap per the product requirement
  const floor = Math.max(1, Math.ceil(FLOOR_PERCENT * stockQty));

  // Step 4: Days of stock remaining (Infinity when no demand signal)
  const daysRemaining =
    cachedAvgDailyDemand > 0 ? stockQty / cachedAvgDailyDemand : Infinity;

  // Step 5: Select cap percentage based on demand velocity
  let capPct: number;
  if (stockStatus === "low-stock") {
    capPct = LOW_STOCK_CAP;           // always tight when explicitly low-stock
  } else if (daysRemaining < 5) {
    capPct = FAIR_SHARE_HIGH;         // selling out fast — protect remaining stock
  } else if (daysRemaining < 14) {
    capPct = FAIR_SHARE_MED;
  } else {
    capPct = FAIR_SHARE_LOW;          // plenty of stock — generous limit
  }

  // Step 6: Velocity ceiling
  const ceiling = Math.ceil(capPct * stockQty);

  // Step 7: Apply floor, cap at actual stock
  return Math.min(Math.max(floor, ceiling), stockQty);
}

/**
 * Adjust a base MOQ based on the customer's purchase history for this product.
 *
 * Rules:
 *   - First-time buyer (recentQty === 0): +20% boost to encourage trial
 *   - Heavy recent buyer (recentQty ≥ 3× baseMax): -30% to spread stock fairly
 *   - Otherwise: no change
 *
 * @param baseMax            Result of computeEffectiveMOQ
 * @param stockQty           Current stock (used to clamp the boosted max)
 * @param recentQtyByCustomer  Total qty of this product ordered by this phone in last 30 days
 */
export function applyCustomerMultiplier(
  baseMax: number,
  stockQty: number,
  recentQtyByCustomer: number
): number {
  if (recentQtyByCustomer === 0) {
    // First-time buyer: +20% boost, capped at stockQty
    return Math.min(stockQty, Math.ceil(baseMax * 1.2));
  }
  if (recentQtyByCustomer >= 3 * baseMax) {
    // Heavy recent buyer: -30% reduction to spread stock
    return Math.max(1, Math.ceil(baseMax * 0.7));
  }
  return baseMax;
}

// --- Convex runtime imports (query + internal mutation) ---------------------
import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// --- cartValidate ------------------------------------------------------------
/**
 * Real-time cart validation � returns the per-item status so the UI can
 * show warnings before the customer hits checkout.
 *
 * Items beyond 50 are silently ignored (abuse guard). Malformed productIds
 * are skipped. No auth required � carts are anonymous pre-checkout.
 */
export const cartValidate = query({
  args: {
    items: v.array(
      v.object({
        productId: v.string(),
        qty: v.number(),
        price: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const safeItems = args.items
      .filter((i) => i.productId && i.productId.trim().length > 0)
      .slice(0, 50);

    return Promise.all(
      safeItems.map(async (item) => {
        const product = await ctx.db.get(item.productId as Id<"products">);
        if (!product) {
          return {
            productId: item.productId,
            status: "removed" as const,
            effectiveMOQ: 0,
            remainingQty: null,
            currentPrice: 0,
            priceChanged: false,
          };
        }

        const velocityRow = await ctx.db
          .query("productVelocityCache")
          .withIndex("by_productId", (q) => q.eq("productId", product._id))
          .first();
        const dailyAvg = velocityRow?.avgDailyDemand ?? 0;

        const effectiveMOQ = computeEffectiveMOQ(
          product.stockQty,
          product.stockStatus,
          product.maxOrderQtyOverride,
          dailyAvg
        );

        let status: "ok" | "removed" | "out-of-stock" | "insufficient-stock" | "exceeds-moq" | "low-stock";
        if (product.stockStatus === "out-of-stock") {
          status = "out-of-stock";
        } else if (product.stockQty != null && item.qty > product.stockQty) {
          status = "insufficient-stock";
        } else if (effectiveMOQ > 0 && item.qty > effectiveMOQ) {
          status = "exceeds-moq";
        } else if (product.stockStatus === "low-stock") {
          status = "low-stock";
        } else {
          status = "ok";
        }

        return {
          productId: item.productId,
          status,
          effectiveMOQ,
          remainingQty: product.stockQty ?? null,
          currentPrice: product.price,
          priceChanged: item.price !== product.price,
        };
      })
    );
  },
});

// --- refreshVelocityCache ----------------------------------------------------
/**
 * Internal mutation called by the 15-minute cron.
 * Scans all orders from the last 7 days, sums sold qty per product,
 * and upserts productVelocityCache rows.
 */
export const refreshVelocityCache = internalMutation({
  args: {},
  handler: async (ctx) => {
    const WINDOW_DAYS = 7;
    const windowStart = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;

    const allOrders = await ctx.db.query("orders").collect();
    const recentOrders = allOrders.filter((o) => o._creationTime >= windowStart);

    // Aggregate qty sold per productId across all recent orders
    const qtyMap = new Map<string, number>();
    for (const ord of recentOrders) {
      for (const item of ord.items) {
        qtyMap.set(item.productId, (qtyMap.get(item.productId) ?? 0) + item.qty);
      }
    }

    let updated = 0;
    for (const [rawProductId, totalQty] of qtyMap.entries()) {
      const productId = rawProductId as Id<"products">;
      const avgDailyDemand = totalQty / WINDOW_DAYS;
      const existing = await ctx.db
        .query("productVelocityCache")
        .withIndex("by_productId", (q) => q.eq("productId", productId))
        .first();

      const payload = {
        productId,
        recentSoldQty: totalQty,
        avgDailyDemand,
        windowDays: WINDOW_DAYS,
        computedAt: Date.now(),
      };

      if (existing) {
        await ctx.db.patch(existing._id, payload);
      } else {
        await ctx.db.insert("productVelocityCache", payload);
      }
      updated++;
    }

    return { updated };
  },
});
