import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── Public: published posts for the frontend hub ──────────────────────────
export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .order("desc")
      .take(100);
    // Filter out expired posts client-side after bounded fetch
    return posts.filter(
      (p) => p.expiresAt === undefined || p.expiresAt > now
    );
  },
});

// ── Admin: all posts regardless of status ────────────────────────────────
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("posts").order("desc").take(200);
  },
});

// ── Get single post by ID ─────────────────────────────────────────────────
export const getPost = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ── Create post ───────────────────────────────────────────────────────────
export const createPost = mutation({
  args: {
    type: v.union(
      v.literal("flash-sale"),
      v.literal("product-launch"),
      v.literal("cafe-news"),
      v.literal("brand-story"),
      v.literal("champion")
    ),
    headline: v.string(),
    subhead: v.optional(v.string()),
    body: v.string(),
    coverImageStorageId: v.optional(v.id("_storage")),
    coverImageUrl: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("scheduled")),
    publishAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    linkedProductId: v.optional(v.id("products")),
    discountId: v.optional(v.id("discounts")),
    personName: v.optional(v.string()),
    personRole: v.optional(v.string()),
    personStory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("posts", args);
  },
});

// ── Update post ───────────────────────────────────────────────────────────
export const updatePost = mutation({
  args: {
    id: v.id("posts"),
    type: v.optional(v.union(
      v.literal("flash-sale"),
      v.literal("product-launch"),
      v.literal("cafe-news"),
      v.literal("brand-story"),
      v.literal("champion")
    )),
    headline: v.optional(v.string()),
    subhead: v.optional(v.string()),
    body: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    coverImageUrl: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("scheduled"))),
    publishAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    linkedProductId: v.optional(v.id("products")),
    discountId: v.optional(v.id("discounts")),
    personName: v.optional(v.string()),
    personRole: v.optional(v.string()),
    personStory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    // Only patch fields that are actually provided (not undefined)
    const update: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) update[k] = val;
    }
    await ctx.db.patch(id, update);
  },
});

// ── Toggle publish status ─────────────────────────────────────────────────
export const togglePublish = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) throw new Error("Post not found");
    const newStatus = post.status === "published" ? "draft" : "published";
    await ctx.db.patch(args.id, { status: newStatus });
    return newStatus;
  },
});

// ── Delete post ───────────────────────────────────────────────────────────
export const deletePost = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ── Generate upload URL for cover image (must be a mutation per Convex rules) ─
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// ── Get storage URL from storage ID ──────────────────────────────────────
export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
