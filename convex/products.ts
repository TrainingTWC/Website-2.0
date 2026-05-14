import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
    return await ctx.db.insert("products", args);
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
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
    const { id, ...fields } = args;
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
  },
  handler: async (ctx, args) => {
    const threshold = args.lowStockThreshold ?? 10;
    const stockStatus =
      args.stockQty === 0
        ? ("out-of-stock" as const)
        : args.stockQty <= threshold
          ? ("low-stock" as const)
          : ("in-stock" as const);
    await ctx.db.patch(args.id, {
      stockQty: args.stockQty,
      lowStockThreshold: threshold,
      stockStatus,
    });
  },
});
