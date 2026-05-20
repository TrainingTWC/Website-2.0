# Phase 2: Global State Providers + SSR Safety — Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract the four pieces of shared state currently scattered across `App.tsx` (cart items, active discount, toast notifications, cart panel open/close) into React context providers mounted at the Next.js root layout (`app/providers.tsx`). Simultaneously make every SSR-incompatible component safe for Next.js static export by wrapping with `dynamic(ssr:false)` or adding `"use client"` guards.

**In scope:**
- `src/context/CartContext.tsx` — CartProvider, useCart hook, localStorage persistence
- `src/context/DiscountContext.tsx` — DiscountProvider, useDiscount hook, localStorage sync
- `src/context/ToastContext.tsx` — ToastProvider, useToast hook, renders ToastContainer inline
- `src/context/CartPanelContext.tsx` — CartPanelProvider, useCartPanel hook, renders `<CartPanel>` at root
- `app/providers.tsx` — updated to wrap all four new providers
- `src/App.tsx` — stripped of all local cart/discount/toast/cartPanel state; replaced with hook calls
- Lazy wrapper files for: BestsellerCarousel3D, ProductHero3D, GalaxySweep, VisitorMap, MagneticCursor
- `"use client"` directive added to SmoothScroll.tsx

**Out of scope:**
- Refactoring CheckoutPage or CartPanel to call hooks directly (Phase 3)
- Adding new discount types or validation rules
- Any Convex schema changes
- Route migration (Phase 3)

</domain>

<decisions>
## Decisions

### D-01 — CartPanel moves to root layout now (not Phase 3)
`CartPanelProvider` renders `<CartPanel>` inside `app/providers.tsx` in Phase 2. All three `<CartPanel>` renders in `App.tsx` are removed. `CartPanelProvider` internally consumes `useCart()`, `useDiscount()`, and `useProducts()` to supply all CartPanel props. Navigation to checkout uses `useRouter().push('/?page=checkout')` (bridge-compatible).

### D-02 — Full DiscountProvider wiring including CartPanel and CheckoutPage
`DiscountProvider` is created and fully wired. `CartPanelProvider` passes `activeDiscount`, `clearDiscount`, and computed `discountedSubtotal` to CartPanel. In `App.tsx`, the checkout route branch reads from `useDiscount()` and passes `activeDiscount`, `clearDiscount`, `discountedSubtotal`, and `onShowToast` to `CheckoutPage`.

**Note:** `activeDiscount` does not currently exist in `App.tsx` — this is a new capability, not a state migration. The CartPanel discount props are currently unused optional props.

### D-03 — SSR wrappers as `*Lazy.tsx` files (not inline in App.tsx)
Five new wrapper files live at `src/components/*Lazy.tsx`. Each uses Next.js `dynamic()` with `ssr: false` and re-exports with the original component name. `App.tsx` and any future route files import from the lazy wrapper. The original component files are untouched (Phase 3 can import lazy or direct depending on context).

### Agent's Discretion
- Cart localStorage key: `twc_cart` (consistent with existing `twc_active_discount` naming)
- Provider ordering in providers.tsx (outer → inner): ConvexAuthProvider → CartProvider → DiscountProvider → ToastProvider → CartPanelProvider
- Toast UI: keep custom motion/react implementation extracted from App.tsx (no new library)
- Cart init: `useEffect` for localStorage hydration on mount (SSR-safe, no `useSyncExternalStore`)
- `Discount` interface exported from DiscountContext.tsx (re-used by CartPanel, CheckoutPage, EditorialHub)
- `computeDiscountedSubtotal(subtotal: number): number` method on DiscountContext (pure, no rounding quirks: flat = `Math.max(0, s - amount)`, percent = `Math.max(0, s * (1 - amount/100))`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before implementing.**

### Current state (all lives in App.tsx — to be extracted)
- `src/App.tsx` — `useToast()` hook (lines ~121–130), `ToastContainer` component (lines ~132–152), `Storefront()` cart state (lines ~311–313), cart callbacks (lines ~518–542), CartPanel renders (lines ~732, ~761, ~816), ToastContainer renders (three instances)
- `src/components/CartPanel.tsx` — prop interface (lines 10–20); `CartItem` type exported here — import from here in CartContext
- `src/components/CheckoutPage.tsx` — accepts optional `activeDiscount`, `clearDiscount`, `discountedSubtotal`, `onShowToast` props (lines 14–17)

### Provider tree target
```
ConvexAuthProvider
  CartProvider
    DiscountProvider
      ToastProvider
        CartPanelProvider   ← renders <CartPanel> + provides context
          {children}        ← Next.js page tree (App.tsx bridge)
```

### SSR-unsafe components
- `src/components/BestsellerCarousel3D.tsx` — Three.js / WebGL
- `src/components/ProductHero3D.tsx` — Three.js / WebGL
- `src/components/GalaxySweep.tsx` — uses motion/react + framer animation, no WebGL but window-dependent
- `src/components/admin/VisitorMap.tsx` — Leaflet, DOM-dependent
- `src/components/MagneticCursor.tsx` — direct `window` and `document` access in `useEffect` (already guarded) but must not be SSR'd
- `src/components/SmoothScroll.tsx` — uses hooks only, just needs `"use client"` directive

</canonical_refs>

<deferred>
## Deferred Ideas

- `useSyncExternalStore` for localStorage sync — deferred (useEffect hydration is correct for this app's needs)
- Refactoring CheckoutPage/CartPanel to consume hooks directly — Phase 3
- Adding `clearCart()` to order confirmation flow in EditorialHub — Phase 3
- Cart item count badge persistence across hard refresh — already handled by localStorage persistence

</deferred>

---

*Phase: 02-global-state-ssr*
*Context gathered: 2026-05-20*
