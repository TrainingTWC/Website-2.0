import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const record = mutation({
  args: {
    path: v.string(),
    sessionId: v.string(),
    referrer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("pageViews", {
      path: args.path,
      sessionId: args.sessionId,
      referrer: args.referrer,
      timestamp: Date.now(),
    });
  },
});

export const updateDuration = mutation({
  args: {
    id: v.id("pageViews"),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { duration: args.duration });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const views = await ctx.db.query("pageViews").collect();
    const now = Date.now();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = today.getTime();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const todayViews = views.filter((v) => v.timestamp >= todayTs);
    const weekViews = views.filter((v) => v.timestamp >= weekAgo);
    const uniqueSessions = new Set(views.map((v) => v.sessionId)).size;

    const withDuration = views.filter((v) => v.duration != null);
    const avgDurationSec =
      withDuration.length > 0
        ? Math.round(
            withDuration.reduce((sum, v) => sum + (v.duration ?? 0), 0) /
              withDuration.length
          )
        : 0;

    // Daily views for last 7 days
    const dailyViews: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now - i * 24 * 60 * 60 * 1000);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
      dailyViews.push({
        date: day.toLocaleDateString("en-IN", { weekday: "short" }),
        count: views.filter(
          (v) =>
            v.timestamp >= day.getTime() && v.timestamp < nextDay.getTime()
        ).length,
      });
    }

    // Top paths
    const pathCounts: Record<string, number> = {};
    for (const v of views) {
      pathCounts[v.path] = (pathCounts[v.path] ?? 0) + 1;
    }

    return {
      totalViews: views.length,
      todayViews: todayViews.length,
      weekViews: weekViews.length,
      uniqueSessions,
      avgDurationSec,
      dailyViews,
      pathCounts,
    };
  },
});
