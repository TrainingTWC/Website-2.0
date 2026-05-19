# Phase 3: Discount Cart Integration — Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the active discount (already in `twc_active_discount` localStorage from Phase 2's "Claim Offer" flow) into the cart panel, checkout summary, and order record. No new discount logic — only surfacing what Phase 1+2 already built into the UI and persisting it on the order.

**In scope:**
- Cart panel (`CartPanel.tsx`) shows active discount pill, savings, discounted subtotal
- Checkout page (`CheckoutPage.tsx`) shows discount line in order summary
- `submitOrder` re-validates and applies discount server-side
- `OrderConfirmation.tsx` shows "saved ₹X" line when discount was used
- Clearing cart also clears discount from localStorage

**Out of scope (deferred to post-migration):**
- Extracting cart logic into a `useCart.ts` hook — defer until Next.js migration
- Any new discount types or validation rules

</domain>

<decisions>
## Decisions

### D-01 — Cart discount state location
Discount state (`activeDiscount`, `clearDiscount`, `discountedSubtotal`) lives in **`App.tsx`** alongside existing cart state (`cart`, `setCart`, `cartOpen`). Pass discount-related props down to `CartPanel` and `CheckoutPage` the same way cart props are passed today. **Do NOT create `useCart.ts`** — that refactor is deferred to after the Next.js migration.

### D-02 — File naming (CartPanel vs CartDrawer)
The ROADMAP references `CartDrawer.tsx` but the actual file is **`CartPanel.tsx`**. Modify `CartPanel.tsx` in place. Do not create or rename files.

### D-03 — Server rejection UX at checkout
If `submitOrder` rejects the discount code (e.g. `maxUses` reached between claim and submit):
- **Show a toast**: `"This offer is no longer available. Your order has been placed without the discount."`
- **Auto-strip**: remove `twc_active_discount` from localStorage
- **Re-submit automatically**: call `submitOrder` again without `discountCode`
- No hard block, no inline error. The order must go through.

### Agent's Discretion
- Toast styling: use the existing `showToast()` mechanism already in `App.tsx`
- Discount pill styling in CartPanel: follow the glassmorphism spec in ROADMAP (backdrop-blur, bg-white/10, border-white/20) — consistent with "Claim Offer" button from Phase 2
- `discountedSubtotal` precision: `Math.max(0, subtotal - amount)` for flat; `subtotal * (1 - amount/100)` for percent — round to nearest rupee

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing cart architecture (required reading)
- `src/App.tsx` — cart state lives here (lines ~312–550); understand prop-passing pattern before adding discount state
- `src/components/CartPanel.tsx` — current structure; discount pill goes between items list and footer subtotal
- `src/components/CheckoutPage.tsx` — current structure; discount line goes in the right-side order summary
- `src/components/OrderConfirmation.tsx` — add "saved ₹X" line here when `discountCode` is on the order

### Phase 1 outputs (discount backend)
- `convex/discounts.ts` — `validateDiscount`, `claimDiscount` mutations already exist
- `convex/orders.ts` — `submitOrder` already accepts `discountCode: v.optional(v.string())` but does NOT yet re-validate or apply server-side discount math
- `convex/schema.ts` — `orders` table has `discountCode: v.optional(v.string())` field

### Phase 2 outputs (localStorage contract)
- `.planning/phases/02-magazine-editorial-hub/02-SUMMARY.md` — confirms `twc_active_discount` localStorage key stores `{ code, discountType, amount, claimedAt }`

</canonical_refs>

<deferred>
## Deferred Ideas

- `useCart.ts` hook extraction — defer to Next.js migration
- Stacking multiple discounts — out of scope, single active discount only
- Discount analytics / usage dashboard — separate phase

</deferred>

---

*Phase: 03-discount-cart-integration*
*Context gathered: 2026-05-20*
