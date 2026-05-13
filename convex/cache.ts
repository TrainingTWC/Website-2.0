// Internal cache helpers for AI response caching.
// These run in the default V8 runtime (not Node), keeping them fast and cheap.
import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/** Return a cached entry by key, or null if not found. */
export const get = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    return await ctx.db
      .query("aiCache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
  },
});

/** Store a successful AI result. No-op if the key already exists (race-safe). */
export const set = internalMutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const existing = await ctx.db
      .query("aiCache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (!existing) {
      await ctx.db.insert("aiCache", { key, value, createdAt: Date.now() });
    }
  },
});
