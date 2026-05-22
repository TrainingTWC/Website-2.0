import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

async function incrementDailySummary(
  ctx: any,
  args: {
    sessionId: string;
    path: string;
    lat?: number;
    lon?: number;
    geoSource?: string;
    country?: string;
    city?: string;
    region?: string;
    locality?: string;
    countryCode?: string;
  }
) {
  const date = todayUTC();
  const existing = await ctx.db
    .query("pageViewDailySummary")
    .withIndex("by_date", (q: any) => q.eq("date", date))
    .first();

  if (existing) {
    const sessionIds: string[] = existing.sessionIdsJson
      ? JSON.parse(existing.sessionIdsJson)
      : [];
    const isNewSession = !sessionIds.includes(args.sessionId);
    const newSessionIds = isNewSession
      ? [...sessionIds, args.sessionId].slice(-10000)
      : sessionIds;

    const pathCounts: Record<string, number> = JSON.parse(existing.pathCountsJson);
    pathCounts[args.path] = (pathCounts[args.path] ?? 0) + 1;

    const geoData: any = JSON.parse(existing.geoJson);
    if (args.country) {
      geoData.countries = geoData.countries ?? {};
      geoData.countries[args.country] = (geoData.countries[args.country] ?? 0) + 1;
    }
    if (args.city) {
      geoData.cities = geoData.cities ?? {};
      geoData.cities[args.city] = (geoData.cities[args.city] ?? 0) + 1;
    }

    await ctx.db.patch(existing._id, {
      totalViews: existing.totalViews + 1,
      uniqueSessions: isNewSession
        ? existing.uniqueSessions + 1
        : existing.uniqueSessions,
      pathCountsJson: JSON.stringify(pathCounts),
      geoJson: JSON.stringify(geoData),
      gpsCount:
        args.geoSource === "gps" ? existing.gpsCount + 1 : existing.gpsCount,
      ipCount:
        args.geoSource === "ip" ? existing.ipCount + 1 : existing.ipCount,
      sessionIdsJson: JSON.stringify(newSessionIds),
    });
  } else {
    const pathCounts: Record<string, number> = { [args.path]: 1 };
    const geoData: any = {};
    if (args.country) geoData.countries = { [args.country]: 1 };
    if (args.city) geoData.cities = { [args.city]: 1 };

    await ctx.db.insert("pageViewDailySummary", {
      date,
      totalViews: 1,
      uniqueSessions: 1,
      pathCountsJson: JSON.stringify(pathCounts),
      geoJson: JSON.stringify(geoData),
      avgDurationSec: 0,
      durationSamples: 0,
      gpsCount: args.geoSource === "gps" ? 1 : 0,
      ipCount: args.geoSource === "ip" ? 1 : 0,
      sessionIdsJson: JSON.stringify([args.sessionId]),
    });
  }
}

export const record = mutation({
  args: {
    path: v.string(),
    sessionId: v.string(),
    referrer: v.optional(v.string()),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    locality: v.optional(v.string()),
    postcode: v.optional(v.string()),
    lat: v.optional(v.number()),
    lon: v.optional(v.number()),
    geoSource: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("pageViews", {
      path: args.path,
      sessionId: args.sessionId,
      referrer: args.referrer,
      country: args.country,
      countryCode: args.countryCode,
      region: args.region,
      city: args.city,
      locality: args.locality,
      postcode: args.postcode,
      lat: args.lat,
      lon: args.lon,
      geoSource: args.geoSource,
      timestamp: Date.now(),
    });
    await incrementDailySummary(ctx, args);
    return id;
  },
});

export const updateDuration = mutation({
  args: {
    id: v.id("pageViews"),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { duration: args.duration });
    const date = todayUTC();
    const summary = await ctx.db
      .query("pageViewDailySummary")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();
    if (summary && args.duration > 0) {
      const n = summary.durationSamples;
      const newAvg = (summary.avgDurationSec * n + args.duration / 1000) / (n + 1);
      await ctx.db.patch(summary._id, {
        avgDurationSec: Math.round(newAvg),
        durationSamples: n + 1,
      });
    }
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const summaries = await ctx.db
      .query("pageViewDailySummary")
      .order("desc")
      .take(30);

    const totalViews = summaries.reduce((s, d) => s + d.totalViews, 0);
    const uniqueSessions = summaries.reduce((s, d) => s + d.uniqueSessions, 0);
    const gpsCount = summaries.reduce((s, d) => s + d.gpsCount, 0);
    const ipCount = summaries.reduce((s, d) => s + d.ipCount, 0);

    const today = summaries.find((d) => d.date === todayUTC());
    const todayViews = today?.totalViews ?? 0;

    const weekSummaries = summaries.slice(0, 7);
    const weekViews = weekSummaries.reduce((s, d) => s + d.totalViews, 0);

    const withDuration = summaries.filter((d) => d.durationSamples > 0);
    const avgDurationSec =
      withDuration.length > 0
        ? Math.round(
            withDuration.reduce((s, d) => s + d.avgDurationSec, 0) /
              withDuration.length
          )
        : 0;

    const dailyViews = summaries
      .slice(0, 7)
      .reverse()
      .map((d) => ({
        date: new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" }),
        count: d.totalViews,
      }));

    const mergedPaths: Record<string, number> = {};
    for (const d of summaries) {
      const pc: Record<string, number> = JSON.parse(d.pathCountsJson);
      for (const [p, c] of Object.entries(pc)) {
        mergedPaths[p] = (mergedPaths[p] ?? 0) + c;
      }
    }
    const pathCounts = mergedPaths;

    const countryCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    for (const d of summaries) {
      const geo = JSON.parse(d.geoJson);
      if (geo.countries) {
        for (const [k, c] of Object.entries(geo.countries as Record<string, number>)) {
          countryCounts[k] = (countryCounts[k] ?? 0) + c;
        }
      }
      if (geo.cities) {
        for (const [k, c] of Object.entries(geo.cities as Record<string, number>)) {
          cityCounts[k] = (cityCounts[k] ?? 0) + c;
        }
      }
    }

    const topCountries = Object.entries(countryCounts)
      .map(([name, count]) => ({ name, count, code: undefined }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const topCities = Object.entries(cityCounts)
      .map(([name, count]) => ({ name, count, country: undefined }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      totalViews,
      todayViews,
      weekViews,
      uniqueSessions,
      avgDurationSec,
      dailyViews,
      pathCounts,
      topCountries,
      topCities,
      topRegions: [],
      topLocalities: [],
      knownGeo: gpsCount + ipCount,
      mapPoints: [],
      gpsCount,
      ipCount,
    };
  },
});

export const cleanupOldViews = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    const old = await ctx.db
      .query("pageViews")
      .withIndex("by_creation_time")
      .filter((q) => q.lt(q.field("_creationTime"), cutoff))
      .take(500);
    await Promise.all(old.map((v) => ctx.db.delete(v._id)));
    return { deleted: old.length };
  },
});
