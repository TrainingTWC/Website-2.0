import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
    return await ctx.db.insert("pageViews", {
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

    // Geo aggregation
    const countryCounts: Record<string, { count: number; code?: string }> = {};
    const cityCounts: Record<string, { count: number; country?: string }> = {};
    const regionCounts: Record<string, { count: number; country?: string }> = {};
    const localityCounts: Record<string, { count: number; city?: string }> = {};
    for (const v of views) {
      if (v.country) {
        const c = countryCounts[v.country] ?? { count: 0, code: v.countryCode };
        c.count += 1;
        if (!c.code && v.countryCode) c.code = v.countryCode;
        countryCounts[v.country] = c;
      }
      if (v.city) {
        const c = cityCounts[v.city] ?? { count: 0, country: v.country };
        c.count += 1;
        cityCounts[v.city] = c;
      }
      if (v.region) {
        const c = regionCounts[v.region] ?? { count: 0, country: v.country };
        c.count += 1;
        regionCounts[v.region] = c;
      }
      if (v.locality) {
        const c = localityCounts[v.locality] ?? { count: 0, city: v.city };
        c.count += 1;
        localityCounts[v.locality] = c;
      }
    }
    const topCountries = Object.entries(countryCounts)
      .map(([name, info]) => ({ name, count: info.count, code: info.code }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const topCities = Object.entries(cityCounts)
      .map(([name, info]) => ({ name, count: info.count, country: info.country }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const topRegions = Object.entries(regionCounts)
      .map(([name, info]) => ({ name, count: info.count, country: info.country }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const topLocalities = Object.entries(localityCounts)
      .map(([name, info]) => ({ name, count: info.count, city: info.city }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const knownGeo = views.filter((v) => v.country).length;

    // Map points clustered by ~1km grid so we don't ship every view
    const pointMap = new Map<string, { lat: number; lon: number; count: number; label: string; source?: string }>();
    for (const v of views) {
      if (v.lat == null || v.lon == null) continue;
      const key = `${v.lat.toFixed(2)}|${v.lon.toFixed(2)}`;
      const existing = pointMap.get(key);
      const label = [v.locality, v.city, v.region, v.country].filter(Boolean).join(", ") || "Unknown";
      if (existing) {
        existing.count += 1;
      } else {
        pointMap.set(key, {
          lat: Number(v.lat.toFixed(4)),
          lon: Number(v.lon.toFixed(4)),
          count: 1,
          label,
          source: v.geoSource,
        });
      }
    }
    const mapPoints = Array.from(pointMap.values()).sort((a, b) => b.count - a.count).slice(0, 500);

    const gpsCount = views.filter((v) => v.geoSource === "gps").length;
    const ipCount = views.filter((v) => v.geoSource === "ip").length;

    return {
      totalViews: views.length,
      todayViews: todayViews.length,
      weekViews: weekViews.length,
      uniqueSessions,
      avgDurationSec,
      dailyViews,
      pathCounts,
      topCountries,
      topCities,
      topRegions,
      topLocalities,
      knownGeo,
      mapPoints,
      gpsCount,
      ipCount,
    };
  },
});
