import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * EMERGENCY: Wipe every trace of an email from the auth system + admins table.
 * Run this from the Convex dashboard "Functions" tab if you cannot sign up
 * because the email is stuck in authAccounts from a previous deployment.
 *
 * Usage from dashboard:
 *   authAdmin:purgeEmail  { "email": "amritanshu@thirdwavecoffee.in" }
 *
 * This is intentionally unauthenticated because it exists to recover from
 * a locked-out state. Remove or gate this file once you are signed in.
 */
export const purgeEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const target = email.toLowerCase().trim();
    let removed = {
      authAccounts: 0,
      authSessions: 0,
      authRefreshTokens: 0,
      authVerificationCodes: 0,
      users: 0,
      admins: 0,
    };

    // 1. authAccounts (provider rows keyed by providerAccountId = email)
    const accounts = await ctx.db.query("authAccounts").collect();
    for (const acc of accounts) {
      const id = ((acc as any).providerAccountId ?? "").toString().toLowerCase();
      if (id === target) {
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

    // 2. users table (matching email)
    const users = await ctx.db.query("users").collect();
    for (const u of users) {
      if (((u as any).email ?? "").toString().toLowerCase() === target) {
        await ctx.db.delete(u._id);
        removed.users++;
      }
    }

    // 3. admins table (matching email)
    const adminRows = await ctx.db.query("admins").collect();
    for (const a of adminRows) {
      if ((a.email ?? "").toLowerCase() === target) {
        await ctx.db.delete(a._id);
        removed.admins++;
      }
    }

    return { ok: true, email: target, removed };
  },
});
