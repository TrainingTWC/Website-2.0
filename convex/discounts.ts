import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireAdmin } from "./authHelpers";

// ── Admin: list all discount codes ────────────────────────────────────────
export const listDiscounts = query({
  args: {},
  handler: async (ctx) => {    await requireAdmin(ctx);    return await ctx.db.query("discounts").order("desc").take(200);
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
    cartSubtotal: v.optional(v.number()),   // used to check minOrderValue
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

    if (
      discount.minOrderValue !== undefined &&
      args.cartSubtotal !== undefined &&
      args.cartSubtotal < discount.minOrderValue
    ) {
      return {
        valid: false as const,
        reason: "min-order-not-met" as const,
        minOrderValue: discount.minOrderValue,
      };
    }

    if (discount.firstOrderOnly) {
      // DISC-FIRST-ORDER-03: Check both phone AND email — same as submitOrder.
      let hasPriorOrder = false;
      if (args.customerPhone) {
        const byPhone = await ctx.db
          .query("orders")
          .withIndex("by_customerPhone", (q) =>
            q.eq("customerPhone", args.customerPhone!)
          )
          .first();
        if (byPhone) hasPriorOrder = true;
      }
      if (!hasPriorOrder && args.customerEmail) {
        const byEmail = await ctx.db
          .query("orders")
          .withIndex("by_customerEmail", (q) =>
            q.eq("customerEmail", args.customerEmail!)
          )
          .first();
        if (byEmail) hasPriorOrder = true;
      }
      if (hasPriorOrder) {
        return { valid: false as const, reason: "first-order-only" as const };
      }
    }

    return {
      valid: true as const,
      discountType: discount.discountType,
      amount: discount.amount,
      discountId: discount._id,
      offerKind: discount.offerKind ?? "coupon",
      description: discount.description,
      maxDiscount: discount.maxDiscount,
      minOrderValue: discount.minOrderValue,
    };
  },
});

// ── Public: suggest applicable discounts based on cart ────────────────────
// Returns all non-expired, non-maxed discounts with eligibility computed.
// Used by the checkout discount panel to show the user their best options.
export const suggestDiscounts = query({
  args: {
    cartSubtotal: v.number(),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const all = await ctx.db.query("discounts").order("desc").take(100);

    type Result = {
      _id: string;
      code: string;
      discountType: "percent" | "flat";
      amount: number;
      description?: string;
      minOrderValue?: number;
      maxDiscount?: number;
      offerKind: string;
      firstOrderOnly: boolean;
      eligible: boolean;
      savings: number;
      ineligibleReason?: string;
    };

    const results: Result[] = [];

    for (const d of all) {
      // Skip expired
      if (d.expiresAt && d.expiresAt < now) continue;
      // Skip maxed out
      if (d.maxUses !== undefined && d.usageCount >= d.maxUses) continue;
      // DISC-ENUM-01: Only surface auto/cashback/freeShipping offers in the
      // public suggestion list. Plain "coupon" codes are private/campaign
      // codes that users must enter manually — listing them leaks their
      // existence to every visitor and enables automated enumeration.
      const kind = d.offerKind ?? "coupon";
      if (kind === "coupon") continue;

      // Check minOrderValue
      const meetsMinOrder =
        d.minOrderValue === undefined || args.cartSubtotal >= d.minOrderValue;

      // Check firstOrderOnly (only when we have contact info to query with)
      let meetsFirstOrder = true;
      let firstOrderIneligible = false;
      if (d.firstOrderOnly && (args.customerPhone || args.customerEmail)) {
        let priorOrder = null;
        if (args.customerPhone) {
          priorOrder = await ctx.db
            .query("orders")
            .withIndex("by_customerPhone", (q) =>
              q.eq("customerPhone", args.customerPhone!)
            )
            .first();
        }
        if (!priorOrder && args.customerEmail) {
          priorOrder = await ctx.db
            .query("orders")
            .withIndex("by_customerEmail", (q) =>
              q.eq("customerEmail", args.customerEmail!)
            )
            .first();
        }
        if (priorOrder) {
          meetsFirstOrder = false;
          firstOrderIneligible = true;
        }
      }

      const eligible = meetsMinOrder && meetsFirstOrder;

      // Compute savings (only meaningful when eligible)
      let savings = 0;
      if (eligible) {
        if (d.discountType === "flat") {
          savings = Math.min(d.amount, args.cartSubtotal);
        } else {
          savings = (args.cartSubtotal * d.amount) / 100;
          if (d.maxDiscount !== undefined) savings = Math.min(savings, d.maxDiscount);
        }
      }

      // Build human-readable ineligible reason
      let ineligibleReason: string | undefined;
      if (!meetsMinOrder && d.minOrderValue !== undefined) {
        const gap = d.minOrderValue - args.cartSubtotal;
        ineligibleReason = `Add ₹${Math.ceil(gap).toLocaleString("en-IN")} more to unlock`;
      } else if (firstOrderIneligible) {
        ineligibleReason = "For first-time customers only";
      }

      results.push({
        _id: d._id as unknown as string,
        code: d.code,
        discountType: d.discountType,
        amount: d.amount,
        description: d.description,
        minOrderValue: d.minOrderValue,
        maxDiscount: d.maxDiscount,
        offerKind: kind,
        firstOrderOnly: d.firstOrderOnly,
        eligible,
        savings,
        ineligibleReason,
      });
    }

    // Sort: eligible first (best savings first), then ineligible
    results.sort((a, b) => {
      if (a.eligible && !b.eligible) return -1;
      if (!a.eligible && b.eligible) return 1;
      return b.savings - a.savings;
    });

    return results;
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
    // SECURITY (H-04): Require a valid phone or email to prevent fully anonymous
    // automated discount code enumeration and exhaustion attacks.
    const hasPhone = typeof args.customerPhone === "string" && args.customerPhone.trim().length >= 7;
    const hasEmail = typeof args.customerEmail === "string" && args.customerEmail.includes("@");
    if (!hasPhone && !hasEmail) {
      throw new ConvexError("A valid phone number or email address is required to claim this offer.");
    }

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

    // Do NOT increment usageCount here — only submitOrder increments it.
    // Incrementing in both places causes a TOCTOU double-use bug (API-03).
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
    // Extended fields
    description: v.optional(v.string()),
    minOrderValue: v.optional(v.number()),
    maxDiscount: v.optional(v.number()),
    offerKind: v.optional(
      v.union(
        v.literal("coupon"),
        v.literal("cashback"),
        v.literal("auto"),
        v.literal("freeShipping"),
      )
    ),
  },
  handler: async (ctx, args) => {    await requireAdmin(ctx);
    // CODE-FORMAT-01: Validate code format — uppercase alphanumeric + hyphens/underscores,
    // 2–24 chars. Spaces and lowercase would create codes that can never be redeemed
    // because the frontend uppercases user input but can't match a stored code with a space.
    const codeRegex = /^[A-Z0-9_-]{2,24}$/;
    if (!codeRegex.test(args.code)) {
      throw new ConvexError(
        "Code must be 2–24 uppercase letters/digits (hyphens and underscores allowed, no spaces)."
      );
    }
    // Validate bounds
    if (args.amount <= 0) throw new ConvexError("Discount amount must be greater than zero.");
    if (args.discountType === "percent" && args.amount > 100) throw new ConvexError("Percent discount cannot exceed 100.");
    if (args.maxUses !== undefined && args.maxUses < 1) throw new ConvexError("maxUses must be at least 1 if set.");
    if (args.minOrderValue !== undefined && args.minOrderValue < 0) throw new ConvexError("minOrderValue must be >= 0.");
    if (args.maxDiscount !== undefined && args.maxDiscount <= 0) throw new ConvexError("maxDiscount must be > 0.");
    if (args.discountType === "percent" && args.maxDiscount === undefined) {
      // Nudge admins to always set a cap on percent discounts — silently allow but
      // this is logged in the comment so reviewers notice unbounded percent codes.
    }
    // Round flat amounts to avoid fractional-rupee totals
    const normalizedAmount =
      args.discountType === "flat" ? Math.round(args.amount) : args.amount;
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
      amount: normalizedAmount,
      usageCount: 0,
    });
  },
});

// ── Admin: delete a discount code ─────────────────────────────────────────
export const deleteDiscount = mutation({
  args: { id: v.id("discounts") },
  handler: async (ctx, args) => {    await requireAdmin(ctx);    await ctx.db.delete(args.id);
  },
});
