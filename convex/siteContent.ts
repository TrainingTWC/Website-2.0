import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── Resolve slide URLs from storageIds (if any) ─────────────────────────────
// Slides may be stored as { storageId } only — we hydrate the URL on read.
async function hydrateSlides(ctx: any, parsed: any) {
  if (!parsed || !Array.isArray(parsed.slides)) return parsed;
  const slides = await Promise.all(
    parsed.slides.map(async (s: any) => {
      if (s?.storageId) {
        const url = await ctx.storage.getUrl(s.storageId);
        return { ...s, url: url ?? s.url ?? "" };
      }
      return s;
    })
  );
  return { ...parsed, slides };
}

// ── Get a single content entry by key ─────────────────────────────────────
export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("siteContent")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (!row) return null;
    let parsed: any = null;
    try {
      parsed = JSON.parse(row.json);
    } catch {
      parsed = null;
    }
    parsed = await hydrateSlides(ctx, parsed);
    return { key: row.key, value: parsed, updatedAt: row.updatedAt };
  },
});

// ── List all content entries (for admin) ──────────────────────────────────
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("siteContent").collect();
    return await Promise.all(
      rows.map(async (r) => {
        let parsed: any = null;
        try {
          parsed = JSON.parse(r.json);
        } catch {
          parsed = null;
        }
        parsed = await hydrateSlides(ctx, parsed);
        return { _id: r._id, key: r.key, value: parsed, updatedAt: r.updatedAt };
      })
    );
  },
});

// ── Upsert by key — admin saves content ───────────────────────────────────
export const set = mutation({
  args: {
    key: v.string(),
    // JSON-stringified value to avoid Convex validator complexity for nested shapes
    json: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("siteContent")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { json: args.json, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("siteContent", {
      key: args.key,
      json: args.json,
      updatedAt: now,
    });
  },
});

// ── Delete a key ──────────────────────────────────────────────────────────
export const remove = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("siteContent")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

// ── Upload URL + storage helpers (mirror posts.ts pattern) ────────────────
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
