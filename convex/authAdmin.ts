import { v, ConvexError } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * EMERGENCY: Wipe every trace of an email from the auth system + admins table.
 *
 * Requires the caller to be authenticated as a superadmin.
 * If you are completely locked out and cannot authenticate, you must run this
 * directly from the Convex dashboard "Functions" tab (which uses your
 * dashboard session, not a client JWT) — the auth check is bypassed there.
 */
export const purgeEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    // ── Auth guard ────────────────────────────────────────────────────────
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError(
        "Unauthorized: you must be signed in as a superadmin to use this function."
      );
    }
    const callerEmail = (identity.email ?? "").toLowerCase().trim();
    const callerAdmin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", callerEmail))
      .first();
    if (!callerAdmin || callerAdmin.role !== "superadmin" || !callerAdmin.active) {
      throw new ConvexError(
        "Forbidden: only active superadmins can purge email records."
      );
    }
    // ─────────────────────────────────────────────────────────────────────
    const target = email.toLowerCase().trim();
    let removed = {
      authAccounts: 0,
      authSessions: 0,
      authRefreshTokens: 0,
      authVerificationCodes: 0,
      users: 0,
      admins: 0,
    };

    // 1. authAccounts — indexed lookup (M-06: avoids full table scan)
    // @convex-dev/auth provides a compound index "providerAndAccountId" on
    // ["provider", "providerAccountId"] for O(1) lookups.
    const accounts = await (ctx.db as any)
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q: any) =>
        q.eq("provider", "password").eq("providerAccountId", target)
      )
      .collect();
    for (const acc of accounts) {
      {
        // Kill child rows first (sessions/refresh/verification)
        // We don't know userId for sure; gather it for cascade below.
        const userId = (acc as any).userId;
        if (userId) {
          const sessions = await ctx.db
            .query("authSessions")
            .filter((q) => q.eq(q.field("userId"), userId))
            .collect();
          for (const s of sessions) {
            const refresh = await ctx.db
              .query("authRefreshTokens")
              .filter((q) => q.eq(q.field("sessionId"), s._id))
              .collect();
            for (const r of refresh) {
              await ctx.db.delete(r._id);
              removed.authRefreshTokens++;
            }
            await ctx.db.delete(s._id);
            removed.authSessions++;
          }
        }
        const verifs = await ctx.db
          .query("authVerificationCodes")
          .filter((q) => q.eq(q.field("accountId"), acc._id))
          .collect();
        for (const vrow of verifs) {
          await ctx.db.delete(vrow._id);
          removed.authVerificationCodes++;
        }
        await ctx.db.delete(acc._id);
        removed.authAccounts++;
      }
    }

    // 2. users table — filter scan (M-06: avoids pulling all rows into memory)
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq((q as any).field("email"), target))
      .collect();
    for (const u of users) {
      await ctx.db.delete(u._id);
      removed.users++;
    }

    // 3. admins table — indexed by email (M-06: replaces full table scan)
    const adminRows = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", target))
      .collect();
    for (const a of adminRows) {
      await ctx.db.delete(a._id);
      removed.admins++;
    }

    return { ok: true, email: target, removed };
  },
});
