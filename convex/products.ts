import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireAdmin } from "./authHelpers";
import { computeEffectiveMOQ } from "./inventory";

// Generate a short-lived upload URL for image uploads from the admin panel.
// Admin-only â€” uploads are CMS-driven so anonymous callers must be blocked.
export const generateUploadUrl = mutation(async (ctx) => {
  await requireAdmin(ctx);
  return await ctx.storage.generateUploadUrl();
});

// Resolve a storageId returned from an upload into a public CDN URL.
// Admin-only â€” pairs with generateUploadUrl.
export const getStorageUrl = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.storage.getUrl(args.storageId as any);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("products").collect();
  },
});

export const listByType = query({
  args: { type: v.union(v.literal("beans"), v.literal("bags"), v.literal("merch")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    type: v.union(v.literal("beans"), v.literal("bags"), v.literal("merch")),
    category: v.string(),
    mainCategory: v.optional(
      v.union(v.literal("coffee"), v.literal("merch"))
    ),
    subCategory: v.optional(
      v.union(
        v.literal("beans"),
        v.literal("ecb"),
        v.literal("drinkware"),
        v.literal("bags"),
        v.literal("keychains"),
        v.literal("chocolates-nuts"),
        v.literal("brewing-tools")
      )
    ),
    price: v.number(),
    imageUrl: v.string(),
    modelUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    roastLevel: v.optional(
      v.union(
        v.literal("light"),
        v.literal("medium"),
        v.literal("medium-dark"),
        v.literal("dark")
      )
    ),
    origin: v.optional(v.string()),
    weight: v.optional(v.string()),
    flavorNotes: v.array(v.string()),
    stockStatus: v.union(
      v.literal("in-stock"),
      v.literal("out-of-stock"),
      v.literal("low-stock")
    ),
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.price <= 0) throw new ConvexError("Price must be greater than zero.");
    return await ctx.db.insert("products", args);
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.union(v.literal("beans"), v.literal("bags"), v.literal("merch"))),
    category: v.optional(v.string()),
    mainCategory: v.optional(
      v.union(v.literal("coffee"), v.literal("merch"))
    ),
    subCategory: v.optional(
      v.union(
        v.literal("beans"),
        v.literal("ecb"),
        v.literal("drinkware"),
        v.literal("bags"),
        v.literal("keychains"),
        v.literal("chocolates-nuts"),
        v.literal("brewing-tools")
      )
    ),
    price: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    modelUrl: v.optional(v.string()),
    roastLevel: v.optional(
      v.union(
        v.literal("light"),
        v.literal("medium"),
        v.literal("medium-dark"),
        v.literal("dark")
      )
    ),
    origin: v.optional(v.string()),
    weight: v.optional(v.string()),
    flavorNotes: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    stockStatus: v.optional(
      v.union(
        v.literal("in-stock"),
        v.literal("out-of-stock"),
        v.literal("low-stock")
      )
    ),
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...fields } = args;
    if (fields.price !== undefined && fields.price <= 0) throw new ConvexError("Price must be greater than zero.");
    // Filter out undefined fields
    const updates: Record<string, any> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }
    await ctx.db.patch(id, updates);
  },
});

export const updateStock = mutation({
  args: {
    id: v.id("products"),
    stockQty: v.number(),
    lowStockThreshold: v.optional(v.number()),
    maxOrderQtyOverride: v.optional(v.number()),  // null = clear the override
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const threshold = args.lowStockThreshold ?? 10;
    const stockStatus =
      args.stockQty === 0
        ? ("out-of-stock" as const)
        : args.stockQty <= threshold
          ? ("low-stock" as const)
          : ("in-stock" as const);
    const patch: Record<string, unknown> = { stockQty: args.stockQty, lowStockThreshold: threshold, stockStatus };
    if (args.maxOrderQtyOverride !== undefined) {
      patch.maxOrderQtyOverride = args.maxOrderQtyOverride ?? undefined;
    }
    await ctx.db.patch(args.id, patch);
  },
});

// ─── getShopCatalogWithMOQ ────────────────────────────────────────────────────
/**
 * Enriched product catalog — each product includes its current effectiveMOQ
 * so the shop UI can clamp quantity selectors before the customer hits checkout.
 * Optionally filtered by product type. Drop-in replacement for `list`/`listByType`.
 */
export const getShopCatalogWithMOQ = query({
  args: {
    type: v.optional(
      v.union(v.literal("beans"), v.literal("bags"), v.literal("merch"))
    ),
  },
  handler: async (ctx, args) => {
    const products = args.type
      ? await ctx.db
          .query("products")
          .withIndex("by_type", (q) => q.eq("type", args.type!))
          .collect()
      : await ctx.db.query("products").collect();

    return Promise.all(
      products.map(async (p) => {
        const velocityRow = await ctx.db
          .query("productVelocityCache")
          .withIndex("by_productId", (q) => q.eq("productId", p._id))
          .first();
        const dailyAvg = velocityRow?.avgDailyDemand ?? 0;
        const effectiveMOQ = computeEffectiveMOQ(
          p.stockQty,
          p.stockStatus,
          p.maxOrderQtyOverride,
          dailyAvg
        );
        return { ...p, effectiveMOQ };
      })
    );
  },
});
