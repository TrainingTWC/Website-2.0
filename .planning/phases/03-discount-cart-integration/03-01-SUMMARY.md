# Phase 03 Plan 01 — SUMMARY

**Phase:** 03-discount-cart-integration
**Plan:** 01 — Convex Backend: Server-Side Discount Validation
**Status:** Complete
**Commit:** 621f1f3

## What Was Built

### Task 1: `discountApplied` field in schema.ts

Added `discountApplied: v.optional(v.number())` to the `orders` defineTable block immediately after `discountCode`. This field stores server-computed rupee savings — never supplied by the client.

### Task 2: Server-side discount re-validation in `submitOrder` (orders.ts)

Replaced the client-trust model with a full server-side re-validation flow:

1. **Query discounts table by code** — uses `withIndex("by_code")` to find the discount document
2. **Re-validate** — checks expiry (`expiresAt > Date.now()`) and usage cap (`usageCount < maxUses`)
3. **Apply server math** — `percent`: `Math.round(subtotal * amount/100)`; `flat`: `Math.min(amount, subtotal)` (capped at subtotal)
4. **Compute `serverTotal`** — `discountedSubtotal + shipping`; stored on order (replaces `args.total`)
5. **Increment `usageCount`** — `ctx.db.patch` on the discount document
6. **Silent drop on invalid** — no `ConvexError` thrown; order proceeds without discount (per D-03)

Fields stored on order:
- `total: serverTotal` (server-computed, not `args.total`)
- `discountCode: validatedDiscountCode` (only present when discount passed validation)
- `discountApplied: savings` (rupees saved, only present when discount applied)

## Edge Cases Handled

- Expired discount (`expiresAt` in past): silently drops, `validatedDiscountCode` undefined
- `maxUses` reached: silently drops
- Flat discount > subtotal: `savings = subtotal` (not negative)
- No `discountCode` in args: skips validation block entirely, `serverTotal = subtotal + shipping`

## Security

- T-03-01 (Tampered total): server ignores `args.total`, computes from `args.subtotal + args.shipping`
- T-03-02 (Tampered discountCode): re-fetched from DB, not trusted from client
- T-03-03 (Savings inflation): percent uses server-stored `amount`, flat is capped at subtotal

## Self-Check: PASSED

- `grep -c "discountApplied" convex/schema.ts` → 1 ✓
- `grep -c "discountApplied" convex/orders.ts` → 3 ✓
- `grep -c "serverTotal" convex/orders.ts` → 3 ✓
- No TypeScript errors in convex/ files ✓
