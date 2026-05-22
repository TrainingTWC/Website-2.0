import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const vitalName = v.union(
  v.literal("FCP"),
  v.literal("LCP"),
  v.literal("INP"),
  v.literal("CLS"),
  v.literal("TTFB"),
);

const vitalRating = v.union(
  v.literal("good"),
  v.literal("needs-improvement"),
  v.literal("poor"),
);

const perfTier = v.union(
  v.literal("low"),
  v.literal("mid"),
  v.literal("high"),
);

export const record = mutation({
  args: {
    name: vitalName,
    value: v.number(),
    rating: vitalRating,
    page: v.string(),
    userAgent: v.string(),
    tier: perfTier,
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webVitals", args);
  },
});

export const recent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    return await ctx.db.query("webVitals").order("desc").take(limit);
  },
});

// Batch insert — one mutation per page load instead of one per metric (Fix #2).
export const recordBatch = mutation({
  args: {
    vitals: v.array(v.object({
      name: vitalName,
      value: v.number(),
      rating: vitalRating,
      page: v.string(),
      userAgent: v.string(),
      tier: perfTier,
    })),
  },
  handler: async (ctx, args) => {
    await Promise.all(args.vitals.map((vital) => ctx.db.insert("webVitals", vital)));
  },
});
