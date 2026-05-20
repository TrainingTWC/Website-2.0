# Plan 02-01 Summary — CartProvider + DiscountProvider + ToastProvider + CartPanelProvider

**Phase:** 02-global-state-ssr
**Plan:** 01
**Status:** Complete
**Commits:** `c46d65d`, `cb6fa7d`, `4e3a93b`

## What Was Built

### Task 1 — CartContext + DiscountContext
- `src/context/CartContext.tsx` — `CartProvider` + `useCart()` with `{ cart, addToCart, removeFromCart, updateQty, clearCart, cartCount }`. Persists to localStorage key `twc_cart`. SSR-safe (typeof window guard on initial read).
- `src/context/DiscountContext.tsx` — `DiscountProvider` + `useDiscount()` with `{ activeDiscount, setActiveDiscount, clearDiscount, computeDiscountedSubtotal }`. Persists to `twc_active_discount`. Flat and percent discount modes supported.

### Task 2 — ToastContext + CartPanelContext + providers.tsx
- `src/context/ToastContext.tsx` — `ToastProvider` + `useToast()` with `{ showToast }`. Renders AnimatePresence overlay globally. Toasts auto-dismiss after 2500ms. Fixed position `bottom-[7rem] sm:bottom-8 right-4 sm:right-8 z-[200]`.
- `src/context/CartPanelContext.tsx` — `CartPanelProvider` + `useCartPanel()` with `{ cartOpen, openCart, closeCart }`. Renders `<CartPanel>` as single root-level overlay. `handleCheckout` uses `useRouter().push("/?page=checkout")`.
- `app/providers.tsx` — All 4 providers stacked: `ConvexAuthProvider → CartProvider → DiscountProvider → ToastProvider → CartPanelProvider`.

### Task 3 — App.tsx Refactor
- **Removed:** Local cart state (`useState<CartItem[]>`), cart callbacks (`addToCart`, `removeFromCart`, `updateQty`), `cartOpen` state, `cartCount` derived value, local `useToast()` function, `ToastContainer` component, and all 3 `<CartPanel>` JSX instances.
- **Added:** `useCart()`, `useDiscount()`, `useToast()`, `useCartPanel()` hook calls consuming the new contexts.
- **Wired:** `CheckoutPage` receives `activeDiscount`, `clearDiscount`, `discountedSubtotal`, `onShowToast`, and `onClose` now calls `openCart()`.
- **ShopPage:** `onAddToCart` calls `addToCart(productId)` + `showToast("Added to cart")`.
- **Net delta:** 107 lines removed, 26 lines added.

## Requirements Covered

| Req ID | Description | Status |
|--------|-------------|--------|
| STATE-01 | CartProvider context | ✅ |
| STATE-02 | DiscountProvider context | ✅ |
| STATE-03 | ToastProvider context | ✅ |
| STATE-04 | CartPanelProvider context | ✅ |

## Key Decisions
- `CartPanel` renders once inside `CartPanelProvider`, eliminating the triple-render that existed in App.tsx's 3 route branches.
- `addToCart` in `CartContext` does NOT call `showToast` — the wrapper in App.tsx's `onAddToCart` calls both, maintaining separation of concerns.
- `CartPanelContext` uses `next/navigation` `useRouter` for checkout navigation — safe because CartPanelContext is rendered inside the `"use client"` `app/providers.tsx` boundary.
