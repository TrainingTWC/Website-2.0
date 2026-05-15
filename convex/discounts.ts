import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";

// ── Admin: list all discount codes ────────────────────────────────────────
export const listDiscounts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("discounts").order("desc").take(200);
  },
});

// ── Public: validate a discount code ─────────────────────────────────────
// Called from the frontend before showing "Claim Offer" or at cart entry.
// customerPhone / customerEmail are optional — if empty, firstOrderOnly check is skipped
// (the server re-validates at submitOrder time with full customer data).
export const validateDiscount = query({
  args: {
    code: v.string(),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const discount = await ctx.db
      .query("discounts")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (!discount) {
      return { valid: false as const, reason: "not-found" as const };
    }

    if (discount.expiresAt && discount.expiresAt < Date.now()) {
      return { valid: false as const, reason: "expired" as const };
    }

    if (discount.maxUses !== undefined && discount.usageCount >= discount.maxUses) {
      return { valid: false as const, reason: "max-uses-reached" as const };
    }

    if (discount.firstOrderOnly && args.customerPhone) {
      const priorOrder = await ctx.db
        .query("orders")
        .withIndex("by_customerPhone", (q) =>
          q.eq("customerPhone", args.customerPhone!)
        )
        .first();
      if (priorOrder) {
        return { valid: false as const, reason: "first-order-only" as const };
      }
    }

    return {
      valid: true as const,
      discountType: discount.discountType,
      amount: discount.amount,
      discountId: discount._id,
    };
  },
});

// ── Claim a discount (increment usageCount) ───────────────────────────────
// Called when user clicks "Claim Offer". Validates before incrementing.
export const claimDiscount = mutation({
  args: {
    code: v.string(),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const discount = await ctx.db
      .query("discounts")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (!discount) throw new ConvexError("Discount code not found");

    if (discount.expiresAt && discount.expiresAt < Date.now()) {
      throw new ConvexError("This offer has expired");
    }

    if (discount.maxUses !== undefined && discount.usageCount >= discount.maxUses) {
      throw new ConvexError("This offer has reached its usage limit");
    }

    if (discount.firstOrderOnly && args.customerPhone) {
      const priorOrder = await ctx.db
        .query("orders")
        .withIndex("by_customerPhone", (q) =>
          q.eq("customerPhone", args.customerPhone!)
        )
        .first();
      if (priorOrder) {
        throw new ConvexError(
          "This offer is for first-time orders only"
        );
      }
    }

    await ctx.db.patch(discount._id, {
      usageCount: discount.usageCount + 1,
    });

    return {
      code: discount.code,
      discountType: discount.discountType,
      amount: discount.amount,
    };
  },
});

// ── Admin: create a discount code ─────────────────────────────────────────
export const createDiscount = mutation({
  args: {
    code: v.string(),
    discountType: v.union(v.literal("percent"), v.literal("flat")),
    amount: v.number(),
    firstOrderOnly: v.boolean(),
    expiresAt: v.optional(v.number()),
    maxUses: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Ensure code is unique
    const existing = await ctx.db
      .query("discounts")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (existing) {
      throw new ConvexError(`Discount code "${args.code}" already exists`);
    }
    return await ctx.db.insert("discounts", {
      ...args,
      usageCount: 0,
    });
  },
});

// ── Admin: delete a discount code ─────────────────────────────────────────
export const deleteDiscount = mutation({
  args: { id: v.id("discounts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
