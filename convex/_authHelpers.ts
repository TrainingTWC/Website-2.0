import type { MutationCtx, QueryCtx } from "./_generated/server";
import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Throws if the caller is not an authenticated, active admin (any role).
 * Returns the admin record on success.
 */
export async function requireAdmin(ctx: MutationCtx | QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Unauthorized: must be signed in as an admin.");
  const admin = await ctx.db
    .query("admins")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();
  if (!admin || !admin.active) {
    throw new ConvexError("Forbidden: admin access required.");
  }
  return admin;
}

/**
 * Throws unless the caller is an active superadmin.
 * Returns the admin record on success.
 */
export async function requireSuperadmin(ctx: MutationCtx | QueryCtx) {
  const admin = await requireAdmin(ctx);
  if (admin.role !== "superadmin") {
    throw new ConvexError("Forbidden: superadmin access required.");
  }
  return admin;
}
