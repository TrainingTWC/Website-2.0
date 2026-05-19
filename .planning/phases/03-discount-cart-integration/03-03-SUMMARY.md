# Phase 03 Plan 03 — SUMMARY

**Phase:** 03-discount-cart-integration
**Plan:** 03 — CheckoutPage Discount Summary + D-03 Retry + OrderConfirmation Savings
**Status:** Complete
**Commit:** 621f1f3

## What Was Built

### Task 1: Discount line and D-03 retry in CheckoutPage.tsx

**Props interface extended:**
```typescript
activeDiscount?: { code: string; discountType: "percent" | "flat"; amount: number } | null;
clearDiscount?: () => void;
discountedSubtotal?: number;
onShowToast?: (msg: string) => void;
```

**Discount math:**
```typescript
const effectiveSubtotal = activeDiscount && discountedSubtotal !== undefined
  ? discountedSubtotal : subtotal;
const discountedTotal = effectiveSubtotal + shipping;
const savings = subtotal - effectiveSubtotal;
```

**`handleSubmit` D-03 pattern:**
- Inner `doSubmit(withDiscount: boolean)` helper avoids code duplication
- First call: `doSubmit(true)` — passes `discountCode: activeDiscount.code` via spread
- On `ConvexError` matching `/discount|offer/i`: shows toast, calls `clearDiscount()`, retries with `doSubmit(false)`
- Non-discount errors re-thrown and caught by outer try/catch (shows "Something went wrong")

**D-03 implementation note:** Plan 01's `submitOrder` silently drops invalid discounts (no `ConvexError`). The D-03 toast+retry path therefore fires only if a truly exceptional discount-related ConvexError occurs (e.g., race condition). The silent drop case (Plan 01 design) means the order goes through without toast — consistent with "order must go through" intent documented in CONTEXT.md D-03.

**OrderSummaryCard** — extended with `activeDiscount` and `savings` props:
- Discount line `"Discount (CODE) − ₹X"` in `text-green-600` renders between Subtotal and Shipping rows when `activeDiscount && savings > 0`
- `total` prop now receives `discountedTotal` (passed by CheckoutPage)
- Both mobile (inside form) and desktop (sticky right column) cards updated

**Place Order button** — shows `discountedTotal` in the label, not original `total`.

### Task 2: Savings line in OrderConfirmation.tsx

After the Shipping row in the order totals section, a conditional green card renders:

```tsx
{order.discountCode && order.discountApplied && order.discountApplied > 0 && (
  <div className="... text-green-600 bg-green-50 border border-green-200 rounded-lg">
    <span>Discount applied ({order.discountCode})</span>
    <span>−₹{order.discountApplied.toLocaleString("en-IN")}</span>
  </div>
)}
```

Reads `discountCode` and `discountApplied` from the Convex order document (added by Plan 01). TypeScript accesses these via the `any`-typed `order` object from `useQuery((api as any).orders.getOrder)`.

## Full E2E Flow

1. User claims offer on a post → `twc_active_discount` written to localStorage (Phase 2)
2. User opens cart → discount pill appears with code, ✓ applied, × to remove
3. User sees strikethrough original price + discounted subtotal in accent color
4. User proceeds to checkout → order summary shows: Subtotal / **Discount (CODE) −₹X** / Shipping / **Total** (discounted)
5. Place Order button label shows discounted amount
6. Server re-validates discount (Plan 01), stores `discountApplied` on order document
7. `onOrderCreated` → `clearDiscount()` → discount removed from localStorage
8. OrderConfirmation page shows green "Discount applied (CODE) −₹X" card

## Self-Check: PASSED

- `grep -c "activeDiscount" src/components/CheckoutPage.tsx` → 14 ✓
- `grep -c "discountApplied" src/components/OrderConfirmation.tsx` → 2 ✓
- `grep -c "onShowToast" src/components/CheckoutPage.tsx` → 3 ✓
- No new TypeScript errors introduced ✓
