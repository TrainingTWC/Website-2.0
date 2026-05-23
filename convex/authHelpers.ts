/**
 * Shared authentication / authorization helpers for Convex functions.
 *
 * Usage:
 *   import { requireAdmin, requireSuperadmin, getCallerAdmin } from "./authHelpers";
 *
 *   export const myMutation = mutation({
 *     handler: async (ctx) => {
 *       await requireAdmin(ctx);
 *       // ...
 *     },
 *   });
 */
import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Returns the active admin row for the current caller, or null if the caller
 * is not authenticated or is not an active admin.
 */
export async function getCallerAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  const admin = await ctx.db
    .query("admins")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();
  return admin && admin.active ? admin : null;
}

/**
 * Requires the caller to be an authenticated, active admin (any role).
 * Throws ConvexError("Unauthorized") otherwise.
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const admin = await getCallerAdmin(ctx);
  if (!admin) {
    throw new ConvexError("Unauthorized: admin access required.");
  }
  return admin;
}

/**
 * Requires the caller to be an authenticated, active superadmin.
 * Throws ConvexError("Forbidden") otherwise.
 */
export async function requireSuperadmin(ctx: QueryCtx | MutationCtx) {
  const admin = await getCallerAdmin(ctx);
  if (!admin || admin.role !== "superadmin") {
    throw new ConvexError("Forbidden: superadmin access required.");
  }
  return admin;
}
