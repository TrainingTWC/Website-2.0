# Testing

**Analysis Date:** 2026-05-20

## Current State

**Zero tests exist.** No `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx` files anywhere in the repository.

There is no test runner, no test framework, and no test-related scripts in `package.json`. The only quality check is:

```json
"scripts": {
  "lint": "tsc --noEmit"
}
```

TypeScript type-checking (`tsc --noEmit`) is the sole automated quality gate. It catches type errors but does not verify runtime behavior.

**No devDependencies** for testing: no vitest, jest, @testing-library/react, msw, or playwright.

## Test Setup

**None configured.** To add testing, the recommended setup for this Vite + React + TypeScript stack is:

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event
```

`vitest.config.ts` to add:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

Convex functions require a separate test harness — use `convex-test` package from the Convex team for unit-testing queries and mutations in isolation.

## Coverage Gaps

Every path is untested. Prioritized by risk:

**Critical (no coverage at all):**
- `convex/orders.ts` — `submitOrder` mutation: order creation, orderId format, discount code application
- `convex/recommendations.ts` — `getRecommendation` action: Mistral API call, cache hit/miss logic, JSON parse safety (`safeParseJSON` strips `<think>` tags and markdown fences)
- `src/components/CheckoutPage.tsx` — form validation logic (`validate()` function)
- `src/lib/useProducts.ts` — sessionStorage cache read/write/invalidation logic
- `convex/cache.ts` — SHA-256 cache key generation (`makeCacheKey`)

**High (business logic):**
- `src/types.ts` — `resolveTaxonomy()` function: fallback from legacy `type` to new `mainCategory`/`subCategory` fields
- `convex/discounts.ts` — discount validation, expiry, usage count enforcement
- `convex/orders.ts` — `updateStatus`, order lookup by orderId
- `convex/analytics.ts` — page view aggregation queries

**Medium (UI behavior):**
- `src/components/ShopPage.tsx` — filter/sort logic (`useMemo` with category and sort mode)
- `src/components/CartPanel.tsx` — subtotal calculation, qty update, empty state
- `src/components/widget/DiscoveryWidget.tsx` — quiz state machine (question progression, answer collection)
- Admin auth guard (`src/components/admin/AdminAuthGate.tsx`)

**Low (render/visual):**
- All animation components (`GalaxySweep`, `Cinematic`, `BestsellerCarousel3D`) — visual only, low business risk
- `SmartImage` — blur-up placeholder behavior

## Pre-Migration Test Plan

Before beginning the Next.js migration, establish a behavioral baseline by capturing/testing the following:

### 1. Install Test Framework
```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
npm install -D convex-test
```

### 2. Convex Function Unit Tests (Priority 1)

Test all Convex mutations and queries in isolation using `convex-test`:

| File | Functions to Test | Key Assertions |
|------|-------------------|----------------|
| `convex/orders.ts` | `submitOrder` | orderId format `TWC-XXXXXXXX`, items stored, denormalized fields set |
| `convex/orders.ts` | `getOrder` | returns null for unknown orderId, returns correct order |
| `convex/products.ts` | `list`, `listByType`, `getById` | returns correct shape, index filtering works |
| `convex/discounts.ts` | discount apply logic | expired codes rejected, maxUses enforced |
| `convex/cache.ts` | `getCached`, `setCached` | cache hit returns stored value, miss returns null |
| `convex/recommendations.ts` | `getRecommendation` | graceful error when `MISTRAL_API_KEY` missing |

### 3. Pure Function Unit Tests (Priority 1)

These have no external dependencies and are easiest to test:

```typescript
// src/types.ts — resolveTaxonomy()
// src/lib/slug.ts — slugify()
// src/lib/asset.ts — asset()
// convex/recommendations.ts — stableStringify(), makeCacheKey(), safeParseJSON()
```

`safeParseJSON` is especially important — it strips Mistral's `<think>...</think>` traces. Test with:
- Clean JSON string
- JSON wrapped in markdown fences (```json ... ```)
- JSON with `<think>` block prepended
- Malformed JSON (should throw)

### 4. Form Validation Tests (Priority 2)

The checkout form in `src/components/CheckoutPage.tsx` has inline `validate()` logic:
- Name required
- Email regex match
- Phone: exactly 10 digits
- Pincode: exactly 6 digits
- Required fields (address1, city, state)

Extract `validate()` to `src/lib/validateCheckoutForm.ts` to make it independently testable before migration.

### 5. Custom Hook Tests (Priority 2)

| Hook | Test Scenarios |
|------|----------------|
| `src/lib/useProducts.ts` | cache miss → fires query; cache hit → skips query; write to sessionStorage after query |
| `src/lib/useStoryContent.ts` | returns DEFAULTS when Convex returns undefined; merges partial data with defaults |
| `src/lib/useSiteContent.ts` | same pattern as useStoryContent |

### 6. Snapshot / Baseline Captures (Priority 3)

Before migration, capture visual snapshots and API response shapes for:
- Product listing page (`/shop`) rendered product cards
- Cart panel open state
- Checkout form empty state and error state
- Order confirmation page
- AI recommendation widget result state

Use Playwright or Storybook for visual baseline capture.

## Post-Migration Verification

After migrating to Next.js, verify equivalence across these dimensions:

### Routing Equivalence
| Current (SPA) | Next.js Target | Verify |
|---------------|----------------|--------|
| `page === "home"` state | `/` (app router) | Hero, storefront sections visible |
| `page === "shop"` state | `/shop` | Product grid, filters, AI widget |
| `page === "product"` + slug | `/product/[slug]` | Product details, 3D model, add to cart |
| `page === "checkout"` state | `/checkout` | Form, payment options |
| `page === "order-confirmation"` | `/order/[orderId]` | Order summary |
| `page === "order-portal"` | `/orders` | Order tracking, support chat |
| `page === "third-circle"` | `/third-circle` | Discovery widget full-screen |
| `page === "admin"` | `/admin` | Auth gate, dashboard |
| `page === "editorial"` | `/editorial` | Post listing |
| `page === "post"` + slug | `/editorial/[slug]` | Post detail |

### Convex Integration in Next.js
- ConvexProvider must be a Client Component wrapper in `app/layout.tsx`
- `useQuery`, `useMutation`, `useAction` only work in Client Components — verify no accidental use in Server Components
- Real-time subscriptions must still work (websocket connection maintained)
- Auth state persistence across page navigations (Convex Auth uses cookies/sessions)

### Asset URL Handling
Current code uses `asset()` helper (`src/lib/asset.ts`) to prepend `import.meta.env.BASE_URL`. In Next.js:
- `BASE_URL` does not exist — replace with `process.env.NEXT_PUBLIC_BASE_PATH` or use `next/image` + `publicRuntimeConfig`
- All `asset("logo.png")` calls must be audited and migrated
- `public/` assets resolve from `/` in Next.js without a helper

### Server-Side Rendering Concerns
| Component | SSR Risk | Mitigation |
|-----------|----------|------------|
| `SmartImage` | Uses `ref.current?.complete` — safe with `useEffect` guard | Verify no hydration mismatch |
| `MagneticCursor` | Accesses `window` directly | Must be `dynamic(() => ..., { ssr: false })` |
| `SmoothScroll` (Lenis) | Mutates `window.__lenis` | Must be `dynamic` or inside `useEffect` |
| `ProductHero3D` / `BestsellerCarousel3D` | Three.js accesses `window`/`canvas` | Must be `dynamic(() => ..., { ssr: false })` |
| `VisitorMap` (Leaflet) | Leaflet accesses `document` at import time | Must be `dynamic` with `ssr: false` |
| `GalaxySweep` | Canvas/WebGL | Verify or `dynamic` |
| `sessionStorage` in `useProducts` | Throws during SSR | Guard with `typeof window !== "undefined"` check |
| `(window as any).__lenis` in App.tsx | Throws during SSR | Move to `useEffect` |

### Performance Regression Checks
- Product list load time (sessionStorage cache layer must still work)
- Lighthouse scores on `/shop` before and after migration
- Convex subscription reconnect behavior after Next.js navigation

### Critical Paths to Re-Verify (Manual QA)
1. Load shop page → products appear → filter by category → sort → product card shows correct data
2. Add product to cart → cart panel opens → update quantity → remove item → subtotal correct
3. Proceed to checkout → fill form → validation errors appear correctly → submit order → order confirmation shows with orderId
4. Track order via order portal → enter orderId → status shown → support chat works
5. Discovery widget: complete all 6 questions → AI recommendation loads → click product → navigate to product page
6. Admin login → view dashboard → add product → product appears in shop
7. Editorial posts: published post appears on homepage → click → full post renders

## Critical User Flows to Test

These flows must work identically in Vite SPA and Next.js:

### Flow 1: Full Purchase Journey
```
Home → Shop → ProductPage → AddToCart → CartPanel → Checkout (form fill + validation) → OrderConfirmation
```
- Cart state preserved through navigation
- Shipping calculation: free if subtotal > ₹499, else ₹49
- OrderId format: `TWC-XXXXXXXX` (8 alphanumeric chars)

### Flow 2: AI Coffee Discovery
```
StoreFront → DiscoveryWidget → 6 quiz questions → Mistral AI call → RecommendationResult → Shop (filtered)
```
- Session created in Convex on widget open
- Answers accumulated per question
- AI response parsed and product IDs resolved
- `primaryProductIds` shown as "AI Pick", `crossSellProductIds` as "Suggested"
- Cache hit on repeat identical answers

### Flow 3: Order Tracking
```
OrderPortal → Enter orderId → Fetch order → Display status timeline → Support chat (AI-powered)
```
- Works with and without account login
- Support AI answers questions about the order

### Flow 4: Admin Product Management
```
AdminLogin → AdminAuthGate → AdminDashboard → Add Product (with image upload) → Product appears in shop
```
- Image upload to Convex storage (`generateUploadUrl`)
- URL resolved via `getStorageUrl` mutation
- Product immediately visible in shop (reactive subscription)

### Flow 5: CMS Content Updates
```
Admin → HomeContentCMS → Update hero text → Storefront reflects change in real-time
```
- `siteContent.set` mutation + reactive `useQuery` on frontend

---

*Testing analysis: 2026-05-20*
