import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sessions").order("desc").take(100);
  },
});

export const create = mutation({
  args: {
    answers: v.any(),
    recommendations: v.array(v.string()),
    completed: v.boolean(),
    converted: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sessions", args);
  },
});
