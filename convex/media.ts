// convex/media.ts
// Brewing Studio media — admin-only upload + CRUD + slot-active management.
// See src/lib/studioSlots.ts for the canonical slot/slotKey registry.

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requireAdmin } from "./_authHelpers";

// Inlined from src/lib/studioSlots.ts — Convex tsconfig "include" is scoped to
// ./convex/**, so cross-tree imports are not resolvable. Keep these two
// constants in sync manually when adding new kinds.
const MEDIA_KIND_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5 MB
  video: 25 * 1024 * 1024, // 25 MB
  gif: 10 * 1024 * 1024, // 10 MB
  lottie: 200 * 1024, // 200 KB
  glb: 15 * 1024 * 1024, // 15 MB
} as const;

const KIND = v.union(
  v.literal("image"),
  v.literal("video"),
  v.literal("gif"),
  v.literal("lottie"),
  v.literal("glb"),
);
const SLOT = v.union(
  v.literal("brew_method"),
  v.literal("brew_step"),
  v.literal("signature"),
  v.literal("product"),
  v.literal("ambience"),
);

// 1) Storage upload URL — admin-only, mirrors products.ts pattern.
export const generateUploadUrl = mutation(async (ctx) => {
  await requireAdmin(ctx);
  return await ctx.storage.generateUploadUrl();
});

// 2) Save a media ref after upload completes.
// Enforces size limit per kind, writes a `draft` row by default.
export const saveMediaRef = mutation({
  args: {
    kind: KIND,
    slot: SLOT,
    slotKey: v.string(),
    storageId: v.id("_storage"),
    sizeBytes: v.number(),
    posterStorageId: v.optional(v.id("_storage")),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    blurhash: v.optional(v.string()),
    provenance: v.optional(v.union(v.literal("upload"), v.literal("ai"))),
    aiMeta: v.optional(
      v.object({
        provider: v.string(),
        model: v.string(),
        prompt: v.string(),
        seed: v.optional(v.number()),
        costUsd: v.optional(v.number()),
        predictionId: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = MEDIA_KIND_SIZE_LIMITS[args.kind];
    if (args.sizeBytes > limit) {
      // Best-effort cleanup of the uploaded blob.
      await ctx.storage.delete(args.storageId).catch(() => {});
      throw new ConvexError(
        `Media too large: ${args.kind} limit is ${Math.round(limit / 1024)} KB, got ${Math.round(args.sizeBytes / 1024)} KB`,
      );
    }

    return await ctx.db.insert("media", {
      kind: args.kind,
      slot: args.slot,
      slotKey: args.slotKey,
      storageId: args.storageId,
      posterStorageId: args.posterStorageId,
      width: args.width,
      height: args.height,
      durationMs: args.durationMs,
      blurhash: args.blurhash,
      status: "draft",
      provenance: args.provenance ?? "upload",
      aiMeta: args.aiMeta,
    });
  },
});

// 3) Customer-facing query — returns ACTIVE media for a slot/slotKey, NEVER drafts.
// Returns null if no published asset exists.
export const getActive = query({
  args: { slot: SLOT, slotKey: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("media")
      .withIndex("by_slot_key", (q) =>
        q.eq("slot", args.slot).eq("slotKey", args.slotKey),
      )
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .first();
    if (!row) return null;
    const url = await ctx.storage.getUrl(row.storageId);
    const posterUrl = row.posterStorageId
      ? await ctx.storage.getUrl(row.posterStorageId)
      : null;
    return { ...row, url, posterUrl };
  },
});

// 4) Admin-only list view — returns all media (draft + published) for a slot, with URLs.
export const listBySlot = query({
  args: { slot: SLOT },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const published = await ctx.db
      .query("media")
      .withIndex("by_status_slot", (q) =>
        q.eq("status", "published").eq("slot", args.slot),
      )
      .collect();
    const drafts = await ctx.db
      .query("media")
      .withIndex("by_status_slot", (q) =>
        q.eq("status", "draft").eq("slot", args.slot),
      )
      .collect();
    const all = [...published, ...drafts].sort(
      (a, b) => b._creationTime - a._creationTime,
    );
    return Promise.all(
      all.map(async (r) => ({
        ...r,
        url: await ctx.storage.getUrl(r.storageId),
        posterUrl: r.posterStorageId
          ? await ctx.storage.getUrl(r.posterStorageId)
          : null,
      })),
    );
  },
});

// 5) Atomic publish-switch.
// Demotes any currently-published row for (slot, slotKey) to draft, then promotes
// the target row to published. Single mutation = atomic from the caller's POV.
export const setActive = mutation({
  args: { mediaId: v.id("media") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const target = await ctx.db.get(args.mediaId);
    if (!target) throw new ConvexError("Media not found");

    const current = await ctx.db
      .query("media")
      .withIndex("by_slot_key", (q) =>
        q.eq("slot", target.slot).eq("slotKey", target.slotKey),
      )
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    for (const row of current) {
      if (row._id !== target._id) {
        await ctx.db.patch(row._id, { status: "draft", publishedAt: undefined });
      }
    }

    await ctx.db.patch(target._id, {
      status: "published",
      publishedAt: Date.now(),
    });
  },
});

// 6) Delete — removes row + storage blob + poster blob.
export const deleteMedia = mutation({
  args: { mediaId: v.id("media") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const row = await ctx.db.get(args.mediaId);
    if (!row) return;
    await ctx.storage.delete(row.storageId).catch(() => {});
    if (row.posterStorageId) {
      await ctx.storage.delete(row.posterStorageId).catch(() => {});
    }
    await ctx.db.delete(args.mediaId);
  },
});
