# Phase 03 Plan 02 — SUMMARY

**Phase:** 03-discount-cart-integration
**Plan:** 02 — App.tsx Discount State + CartPanel Discount Pill UI
**Status:** Complete
**Commit:** 621f1f3

## What Was Built

### Task 1: Discount state and computed values in App.tsx

**`activeDiscount` state** — localStorage-initialised `useState` immediately after `cartOpen`/`currentOrderId`. Reads `twc_active_discount` JSON on mount; silently returns `null` on parse error.

**`clearDiscount` callback** — `useCallback` that calls `setActiveDiscount(null)` and `localStorage.removeItem("twc_active_discount")`.

**`rawSubtotal` memo** — computes sum from `cart` × `products.price`, replacing the need to compute in CartPanel when passing the discounted value up.

**`discountedSubtotal` memo** — derives from `rawSubtotal` + `activeDiscount`:
- `percent`: `Math.round(rawSubtotal * (1 - amount/100))`
- `flat`: `Math.max(0, rawSubtotal - amount)`
- No discount: returns `rawSubtotal`

**Props updates:**
- All 3 `CartPanel` invocations (product detail, shop, home routes) now pass `activeDiscount`, `clearDiscount`, `discountedSubtotal`
- `CheckoutPage` invocation passes all 4 new props including `onShowToast={showToast}`
- `onOrderCreated` now calls `clearDiscount()` before navigating to confirmation

### Task 2: Discount pill UI in CartPanel.tsx

**Props interface extended:** `activeDiscount`, `clearDiscount`, `discountedSubtotal` added as optional props.

**Discount pill** — renders above the subtotal row when `activeDiscount` is set. Glassmorphism style: `bg-natural-accent/10 border border-natural-accent/25 rounded-2xl backdrop-blur-sm`. Shows discount code in uppercase, "✓ applied" text, and × button that calls `clearDiscount`.

**Subtotal display** — conditional:
- With discount: strike-through original (`line-through text-natural-text/40`) + discounted in `text-natural-accent font-serif font-black text-2xl`
- Without discount: original unchanged

**Savings line** — `"You save ₹X"` in `text-xs text-green-600 font-medium` renders when `activeDiscount && discountedSubtotal !== undefined`.

## Props Interface Changes

`CartPanelProps` now includes:
```typescript
activeDiscount?: { code: string; discountType: "percent" | "flat"; amount: number } | null;
clearDiscount?: () => void;
discountedSubtotal?: number;
```

## Self-Check: PASSED

- `grep -c "activeDiscount" src/App.tsx` → 10 ✓
- `grep -c "clearDiscount" src/App.tsx` → 6 ✓
- `grep -c "discountedSubtotal" src/App.tsx` → 5 ✓
- `grep -c "activeDiscount" src/components/CartPanel.tsx` → 6 ✓
- No TypeScript errors in modified files ✓
