import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    productType: v.union(
      v.literal("beans"),
      v.literal("bags"),
      v.literal("merch"),
      v.literal("all")
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("categories").collect();
    if (existing.some((c) => c.slug === args.slug)) {
      throw new Error(`Category "${args.slug}" already exists`);
    }
    return await ctx.db.insert("categories", args);
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
