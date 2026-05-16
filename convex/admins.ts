import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

const FULL_PERMS = {
  overview: true,
  inventory: true,
  orders: true,
  analytics: true,
  editorial: true,
  home: true,
  rules: true,
  customers: true,
  settings: true,
};

const DEFAULT_ADMIN_PERMS = {
  overview: true,
  inventory: true,
  orders: true,
  analytics: true,
  editorial: true,
  home: true,
  rules: false,
  customers: true,
  settings: false,
};

const EDITOR_PERMS = {
  overview: true,
  inventory: false,
  orders: false,
  analytics: false,
  editorial: true,
  home: true,
  rules: false,
  customers: false,
  settings: false,
};

const VIEWER_PERMS = {
  overview: true,
  inventory: false,
  orders: false,
  analytics: true,
  editorial: false,
  home: false,
  rules: false,
  customers: false,
  settings: false,
};

function permsForRole(role: "superadmin" | "admin" | "editor" | "viewer") {
  if (role === "superadmin") return FULL_PERMS;
  if (role === "admin") return DEFAULT_ADMIN_PERMS;
  if (role === "editor") return EDITOR_PERMS;
  return VIEWER_PERMS;
}

// ── helpers ─────────────────────────────────────────────────────────────────
async function loadAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  const user = await ctx.db.get(userId);
  if (!user) return null;
  const admin = await ctx.db
    .query("admins")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();
  return { user, admin, userId };
}

async function requireSuperadmin(ctx: MutationCtx) {
  const ctxInfo = await loadAdmin(ctx);
  if (!ctxInfo?.admin || !ctxInfo.admin.active || ctxInfo.admin.role !== "superadmin") {
    throw new ConvexError("Forbidden: superadmin only.");
  }
  return ctxInfo as { user: any; admin: any; userId: Id<"users"> };
}

// ── queries ─────────────────────────────────────────────────────────────────

/** Returns the current viewer's admin record (or null). */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const info = await loadAdmin(ctx);
    if (!info) return null;
    return {
      userId: info.userId,
      email: info.user.email ?? null,
      name: info.user.name ?? null,
      admin: info.admin
        ? {
            _id: info.admin._id,
            role: info.admin.role,
            permissions: info.admin.permissions,
            active: info.admin.active,
            invitedAt: info.admin.invitedAt,
            lastSeenAt: info.admin.lastSeenAt,
          }
        : null,
    };
  },
});

/** List all admins. Superadmin only. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const info = await loadAdmin(ctx);
    if (!info?.admin || info.admin.role !== "superadmin") return [];
    return await ctx.db.query("admins").order("desc").collect();
  },
});

/** Recent audit log entries. Superadmin only. */
export const auditList = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const info = await loadAdmin(ctx);
    if (!info?.admin || info.admin.role !== "superadmin") return [];
    const rows = await ctx.db
      .query("auditLog")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit ?? 100);
    return rows;
  },
});

// ── mutations ───────────────────────────────────────────────────────────────

/**
 * Bootstrap: called by the client immediately after sign-in / sign-up.
 * If the logged-in user's email matches SUPERADMIN_EMAIL and no admin row
 * exists yet, creates the seed superadmin. Otherwise stamps lastSeenAt.
 */
export const bootstrap = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { ok: false, reason: "not-authenticated" as const };
    const user = await ctx.db.get(userId);
    if (!user) return { ok: false, reason: "no-user" as const };

    let admin = await ctx.db
      .query("admins")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const email = (user.email ?? "").toLowerCase();

    if (!admin) {
      // 1. Look for a pre-invite (admin row with matching email but no userId yet).
      const invite = await ctx.db
        .query("admins")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
      if (invite && !invite.userId) {
        await ctx.db.patch(invite._id, {
          userId,
          name: invite.name ?? user.name,
          lastSeenAt: Date.now(),
        });
        await ctx.db.insert("auditLog", {
          adminUserId: userId,
          adminEmail: email,
          action: "admin.invite.claimed",
          target: invite._id,
          timestamp: Date.now(),
        });
        admin = await ctx.db.get(invite._id);
      } else if (!invite) {
        // 2. No invite and no existing admin row at all → first user wins.
        const anyAdmin = await ctx.db.query("admins").first();
        if (!anyAdmin) {
          const id = await ctx.db.insert("admins", {
            userId,
            email,
            name: user.name,
            role: "superadmin",
            permissions: FULL_PERMS,
            active: true,
            invitedAt: Date.now(),
            lastSeenAt: Date.now(),
          });
          await ctx.db.insert("auditLog", {
            adminUserId: userId,
            adminEmail: email,
            action: "admin.bootstrap.superadmin",
            target: id,
            timestamp: Date.now(),
          });
          admin = await ctx.db.get(id);
        } else {
          return { ok: false, reason: "not-invited" as const };
        }
      } else {
        // Invite exists but already linked to a different user.
        return { ok: false, reason: "not-invited" as const };
      }
    } else {
      await ctx.db.patch(admin._id, { lastSeenAt: Date.now() });
    }

    return {
      ok: true as const,
      role: admin!.role,
      permissions: admin!.permissions,
    };
  },
});

/** Invite a new admin by email. Superadmin only. */
export const invite = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(
      v.literal("admin"),
      v.literal("editor"),
      v.literal("viewer")
    ),
    permissions: v.optional(
      v.object({
        overview: v.boolean(),
        inventory: v.boolean(),
        orders: v.boolean(),
        analytics: v.boolean(),
        editorial: v.boolean(),
        home: v.boolean(),
        rules: v.boolean(),
        customers: v.boolean(),
        settings: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { userId: actor } = await requireSuperadmin(ctx);
    const email = args.email.trim().toLowerCase();
    if (!email.includes("@")) throw new ConvexError("Invalid email.");

    // Already-invited admin?
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) throw new ConvexError("Already invited.");

    // If the user has already signed up with this email, link immediately.
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    const id = await ctx.db.insert("admins", {
      userId: existingUser?._id,
      email,
      name: args.name ?? existingUser?.name,
      role: args.role,
      permissions: args.permissions ?? permsForRole(args.role),
      active: true,
      invitedBy: actor,
      invitedAt: Date.now(),
    });

    await ctx.db.insert("auditLog", {
      adminUserId: actor,
      adminEmail: (await ctx.db.get(actor))?.email ?? "",
      action: "admin.invite",
      target: id,
      metadata: JSON.stringify({ email, role: args.role }),
      timestamp: Date.now(),
    });

    return id;
  },
});

/** Update an admin's role/permissions/active flag. Superadmin only. */
export const update = mutation({
  args: {
    id: v.id("admins"),
    role: v.optional(
      v.union(
        v.literal("superadmin"),
        v.literal("admin"),
        v.literal("editor"),
        v.literal("viewer")
      )
    ),
    permissions: v.optional(
      v.object({
        overview: v.boolean(),
        inventory: v.boolean(),
        orders: v.boolean(),
        analytics: v.boolean(),
        editorial: v.boolean(),
        home: v.boolean(),
        rules: v.boolean(),
        customers: v.boolean(),
        settings: v.boolean(),
      })
    ),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId: actor } = await requireSuperadmin(ctx);
    const patch: Record<string, unknown> = {};
    if (args.role !== undefined) patch.role = args.role;
    if (args.permissions !== undefined) patch.permissions = args.permissions;
    if (args.active !== undefined) patch.active = args.active;
    await ctx.db.patch(args.id, patch);
    await ctx.db.insert("auditLog", {
      adminUserId: actor,
      adminEmail: (await ctx.db.get(actor))?.email ?? "",
      action: "admin.update",
      target: args.id,
      metadata: JSON.stringify(patch),
      timestamp: Date.now(),
    });
  },
});

/** Revoke an admin (sets active=false). Superadmin only. */
export const revoke = mutation({
  args: { id: v.id("admins") },
  handler: async (ctx, args) => {
    const { userId: actor } = await requireSuperadmin(ctx);
    const target = await ctx.db.get(args.id);
    if (target?.role === "superadmin") {
      throw new ConvexError("Cannot revoke a superadmin.");
    }
    await ctx.db.patch(args.id, { active: false });
    await ctx.db.insert("auditLog", {
      adminUserId: actor,
      adminEmail: (await ctx.db.get(actor))?.email ?? "",
      action: "admin.revoke",
      target: args.id,
      timestamp: Date.now(),
    });
  },
});
