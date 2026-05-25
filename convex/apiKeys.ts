/**
 * API key management for external data-export integrations.
 *
 * Security model:
 *  - Only superadmins can create, list, or revoke keys.
 *  - The raw key (twc_live_<64 hex chars>) is returned exactly once on creation
 *    and is NEVER stored. Only the SHA-256 hash is persisted.
 *  - The first 20 characters of the key ("twc_live_" + 11 chars) are stored
 *    as `keyPrefix` for UI identification without exposing the full secret.
 *  - The HTTP export route (`GET /api/v1/export`) validates keys via
 *    _validateAndTouch, which also stamps lastUsedAt on every successful call.
 */

import { internalMutation, mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireSuperadmin } from "./authHelpers";

// ── Crypto helpers ─────────────────────────────────────────────────────────

async function sha256hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Generates a cryptographically random 73-character API key. */
function generateRawKey(): string {
  const bytes = new Uint8Array(32); // 32 bytes → 64 hex chars
  crypto.getRandomValues(bytes);
  return (
    "twc_live_" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

// ── Public superadmin mutations ────────────────────────────────────────────

/**
 * List all API keys. Returns display-safe fields only — keyHash is never
 * included in the response.
 */
export const listApiKeys = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperadmin(ctx);
    const keys = await ctx.db.query("apiKeys").order("desc").collect();
    return keys.map(
      ({ _id, label, keyPrefix, createdBy, createdAt, lastUsedAt, active }) => ({
        _id,
        label,
        keyPrefix,
        createdBy,
        createdAt,
        lastUsedAt,
        active,
      })
    );
  },
});

/**
 * Create a new API key.
 * Returns { key, keyPrefix } — `key` is the full raw secret shown exactly once.
 * Store it immediately; it cannot be recovered after this call.
 */
export const createApiKey = mutation({
  args: { label: v.string() },
  handler: async (ctx, { label }) => {
    const admin = await requireSuperadmin(ctx);
    const trimmedLabel = label.trim();
    if (!trimmedLabel) throw new ConvexError("Label is required.");

    const rawKey = generateRawKey();
    const keyHash = await sha256hex(rawKey);
    const keyPrefix = rawKey.slice(0, 20); // "twc_live_" + first 11 hex chars

    // Astronomically unlikely hash collision guard
    const collision = await ctx.db
      .query("apiKeys")
      .withIndex("by_keyHash", (q) => q.eq("keyHash", keyHash))
      .first();
    if (collision) throw new ConvexError("Key generation collision — please retry.");

    await ctx.db.insert("apiKeys", {
      label: trimmedLabel.slice(0, 100),
      keyPrefix,
      keyHash,
      createdBy: admin.email,
      createdAt: Date.now(),
      active: true,
    });

    // Full key is ONLY returned here and NEVER stored or retrievable again.
    return { key: rawKey, keyPrefix };
  },
});

/**
 * Revoke an API key. It will be rejected immediately on the next export request.
 */
export const revokeApiKey = mutation({
  args: { id: v.id("apiKeys") },
  handler: async (ctx, { id }) => {
    await requireSuperadmin(ctx);
    const apiKey = await ctx.db.get(id);
    if (!apiKey) throw new ConvexError("API key not found.");
    await ctx.db.patch(id, { active: false });
  },
});

// ── Internal — called only by the HTTP export action ──────────────────────

/**
 * Validate a raw key hash and stamp `lastUsedAt`.
 * Not callable from the browser — only from httpAction via internal.apiKeys.
 */
export const _validateAndTouch = internalMutation({
  args: { keyHash: v.string() },
  handler: async (ctx, { keyHash }) => {
    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_keyHash", (q) => q.eq("keyHash", keyHash))
      .first();
    if (!apiKey || !apiKey.active) return { valid: false as const };
    await ctx.db.patch(apiKey._id, { lastUsedAt: Date.now() });
    return { valid: true as const };
  },
});
