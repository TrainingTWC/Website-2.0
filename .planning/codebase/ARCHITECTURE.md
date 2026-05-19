# Architecture

<!-- refreshed: 2026-05-20 -->
**Analysis Date:** 2026-05-20

---

## Overview

Third Wave Coffee is a **React + TypeScript + Vite single-page application** deployed to GitHub Pages at `/brewmatch-ai/`. The backend is entirely **Convex cloud** (project: `different-bulldog-772.convex.cloud`), which provides the database, real-time reactive queries, server functions, file storage, and auth. There is no separate Node/Express server. The Convex backend is a separate cloud service that persists independently of the GitHub Pages deployment.

```text
┌──────────────────────────────────────────────────────────────┐
│         GitHub Pages (static SPA)                            │
│   index.html → main.tsx → App.tsx                            │
│                                                              │
│   React + Vite + TailwindCSS + Framer Motion                 │
│   Routing: URL query params (?page=, ?product=, ?panel=)     │
└───────────────────────────┬──────────────────────────────────┘
                            │  WebSocket (Convex client)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│         Convex Cloud  (different-bulldog-772)                 │
│                                                              │
│   Queries (reactive)  │  Mutations  │  Actions (Node.js)     │
│   products, orders,   │  orders,    │  getRecommendation     │
│   posts, siteContent, │  sessions,  │  (Mistral API)         │
│   analytics, admins   │  pageViews  │                        │
│                                                              │
│   Storage (images)  │  Auth (@convex-dev/auth/Password)      │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│         External APIs                                        │
│   Mistral AI (mistral-small-2603) — AI recommendations       │
│   Nominatim / ipapi.co / ipwho.is — geo resolution           │
│   Razorpay — payment (optional, fields in schema)            │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Standard product browse

```
User loads page
  → index.html served from GitHub Pages (static)
  → main.tsx: ConvexReactClient connects via WebSocket to Convex cloud
  → App.tsx: useProducts() → checks sessionStorage cache first
      → if cache hit: returns immediately, no Convex query
      → if cache miss: useQuery(api.products.list) subscribes to Convex
          → Convex executes query against DB
          → result streams back over WebSocket
          → React re-renders; result written to sessionStorage
  → Products rendered in ShopPage / DemoStorefront
```

### Order submission

```
User fills CheckoutPage
  → cart state lives in App.tsx (useState)
  → useMutation(api.orders.submitOrder) called on submit
  → Convex mutation runs server-side, inserts to orders table
  → Returns { orderId: "TWC-XXXXXXXX" }
  → App.tsx sets currentOrderId, navigates to ?page=order-confirmation
```

### Site content (CMS)

```
Components call useSiteContent hooks (src/lib/useSiteContent.ts)
  → useQuery(api.siteContent.get, { key: "hero" | "banner.slides" | ... })
  → Convex queries siteContent table by key
  → Returns JSON value; hooks apply defaults for missing fields
  → Admin panel writes via siteContent.set mutation
```

---

## Component Hierarchy

```
main.tsx
└── ConvexAuthProvider (from @convex-dev/auth/react)
    └── App
        ├── [?panel=merchant]  MerchantGate
        │   └── AdminAuthGate → AdminDashboard
        ├── [?panel=superadmin]  SuperAdminGate
        │   └── AdminAuthGate (requireSuperadmin) → SuperAdminDashboard
        └── SmoothScroll (Lenis smooth scroll)
            └── Storefront
                ├── LoadingScreen (gates render until products+hero ready)
                ├── ScrollProgressBar (thin top bar)
                ├── MorphingHeader (fixed nav, scroll-reactive opacity)
                ├── FloatingTIButton (mobile only)
                │
                ├── [?page=ti]  DiscoveryWidget (full-screen AI flow)
                │   ├── KioskPipeline (animated AI visualization)
                │   └── Results with add-to-cart
                │
                ├── [?page=third-circle]  EditorialHub or PostDetail
                │
                ├── [?page=order-portal]  OrderPortal
                ├── [?page=order-confirmation]  OrderConfirmation
                ├── [?page=checkout]  CheckoutPage
                │
                ├── [?product=<slug>]  ProductPage
                │   └── ProductHero3D (Three.js model viewer if modelUrl set)
                │
                ├── [?page=shop]  ShopPage
                │
                └── [default: home]
                    ├── CinematicHero (parallax hero)
                    ├── BannerSlideshow (partner banners, CMS-driven)
                    ├── PersonalitySection
                    ├── DemoStorefront
                    │   ├── BestsellerCarousel3D
                    │   └── product cards
                    ├── SipForecast
                    ├── BrewingStudio
                    ├── CountdownTimer
                    ├── DataBanner
                    ├── ChapterDeck (editorial chapters, CMS-driven)
                    └── SiteFooter
                │
                ├── CartPanel (slide-over, present on shop+product+home)
                └── ToastContainer
```

---

## Routing

### Current: URL Query-Parameter Routing (no React Router)

All routing is implemented in `src/App.tsx` using a custom `useUrlQuery()` hook that reads `window.location.search` and listens to `popstate` events.

**Route table:**

| URL params | Component rendered |
|---|---|
| (none) | Full home page (`Storefront`) |
| `?panel=merchant` | `AdminDashboard` (auth gated) |
| `?panel=superadmin` | `SuperAdminDashboard` (auth gated) |
| `?page=ti` | `DiscoveryWidget` (full-screen) |
| `?page=third-circle` | `EditorialHub` |
| `?page=third-circle&post=<id>` | `PostDetail` |
| `?page=shop` | `ShopPage` |
| `?page=checkout` | `CheckoutPage` |
| `?page=order-confirmation` | `OrderConfirmation` |
| `?page=order-portal` | `OrderPortal` |
| `?product=<slug>` | `ProductPage` (slug resolved to Convex `_id` via `slugify`) |

**Navigation helper:** `navigateTo(params)` in `src/App.tsx` wraps `history.pushState` + dispatches `popstate`. It also stamps `scrollY` onto the leaving entry so browser back/forward restores scroll position.

**Scroll restoration:** Lenis-aware — reads `window.__lenis.scroll` when available, falls back to `window.scrollY`.

### Next.js Migration: What Changes

| Current pattern | Next.js App Router equivalent |
|---|---|
| `?page=shop` query param route | `app/shop/page.tsx` |
| `?page=checkout` | `app/checkout/page.tsx` |
| `?page=order-portal` | `app/order-portal/page.tsx` |
| `?page=order-confirmation` | `app/order-confirmation/page.tsx` |
| `?page=ti` | `app/ti/page.tsx` |
| `?page=third-circle` | `app/third-circle/page.tsx` |
| `?page=third-circle&post=<id>` | `app/third-circle/[id]/page.tsx` |
| `?product=<slug>` | `app/products/[slug]/page.tsx` |
| `?panel=merchant` | `app/admin/page.tsx` |
| `?panel=superadmin` | `app/superadmin/page.tsx` |
| `navigateTo()` helper | `useRouter().push()` from `next/navigation` |
| `useUrlQuery()` hook | `useSearchParams()` from `next/navigation` |
| Scroll restore via `popstate` | Next.js built-in scroll restoration |
| `SmoothScroll` (Lenis) as wrapper | Lenis provider in `app/layout.tsx` |

---

## Auth Flow

Auth is provided by `@convex-dev/auth` with the `Password` provider only.

```
1. ConvexAuthProvider (main.tsx) wraps entire app
   → Manages auth session state; exposes via Convex reactive context

2. Customer-facing store: NO auth required
   → All product/order queries are public (no auth check on read)
   → Order submission mutation is public (no auth needed)

3. Admin panel access (?panel=merchant or ?panel=superadmin):
   → AdminAuthGate.tsx renders Convex <Authenticated> / <Unauthenticated>
   → If unauthenticated: shows AdminLogin (email+password form)
   → AdminLogin calls useAuthActions().signIn("password", { email, password })
   → On success: Convex <Authenticated> renders; bootstrapAdmin mutation runs
       → bootstrapAdmin (convex/admins.ts) checks admins table for user
       → Returns AdminMe: { userId, email, name, admin: { role, permissions } }
   → requireSuperadmin=true checks role === "superadmin" post-auth

4. Role system (convex/admins.ts):
   superadmin → all permissions (FULL_PERMS)
   admin      → all except rules+settings
   editor     → overview, editorial, home only
   viewer     → overview, analytics only

5. Auth HTTP routes:
   → convex/http.ts: auth.addHttpRoutes(http)
   → Handles /api/auth/* endpoints (session cookies, token refresh)
```

**Next.js Migration:** Wrap `app/layout.tsx` with `ConvexAuthProvider`. Replace `AdminAuthGate` render-prop pattern with Next.js middleware or a server component auth check. The Convex auth logic itself is unchanged.

---

## AI / Recommendation Pipeline

The "Third Intelligence" (TI) widget provides personality-based coffee recommendations using Mistral AI.

```
User opens DiscoveryWidget (?page=ti)
  → 6-question personality quiz (time, style, nature, job, flavor, brew)
  → Each answer stored in local state (answers: Record<string,string>)
  → On final answer: "Find My Match" clicked

  → useAction(api.recommendations.getRecommendation) called with:
      { answers, products: Product[] }    ← full product catalog passed from client

  → Convex Action (Node.js runtime, convex/recommendations.ts):
      1. Check aiCache table (SHA-256 hash of version+actionName+stableStringify(args))
         → Cache hit: return stored JSON result immediately
         → Cache miss: proceed to Mistral call

      2. Build prompt:
         → BRAND_CONTEXT from convex/productContext.ts
         → buildPersonalitiesBlock(productNames) — per-product personality blurbs
         → Catalog snippet with IDX numbers (not Convex IDs, to avoid mangling)

      3. POST to https://api.mistral.ai/v1/chat/completions
         Model: mistral-small-2603 (hybrid reasoning model)
         response_format: json_object

      4. safeParseJSON(): strips <think>…</think> reasoning traces + markdown fences

      5. resolveIds(): maps IDX numbers → real Convex _ids
         (fallback: name → _id lookup if model returns names)

      6. Store result in aiCache (internal.cache.set mutation)

      7. Return { primaryProductIds, crossSellProductIds, explanation }

  → While action runs: KioskPipeline animates 4 stages:
      INGEST → PARSE → MATCH → REVEAL  (~6.5s visual journey)

  → Results displayed with product cards + add-to-cart
```

**Next.js Migration:** The Convex action runs server-side and is unchanged. `useAction` hook works identically in Next.js. The `DiscoveryWidget` component needs `"use client"` directive.

---

## State Management

There is **no global state manager** (no Redux, no Zustand). State is handled at three levels:

### Convex reactive queries (server state)
- `useQuery(api.products.list)` — product catalog
- `useQuery(api.siteContent.get, { key })` — CMS data (hero, banners, chapters)
- `useQuery(api.posts.list*)` — editorial posts
- `useQuery(api.orders.getByOrderId)` — order status
- All queries are **auto-subscribed**: Convex pushes updates over WebSocket when data changes

### sessionStorage cache layer
- `src/lib/useProducts.ts`: wraps `useQuery(api.products.list)` with a sessionStorage cache keyed `"brewmatch:products:v1"`. Skips the Convex subscription entirely on cache hit (passes `"skip"` as args).
- Geo data cached in `"brewmatch:geo"` (set in `Storefront` component, App.tsx)
- Session ID in `"brewmatch:sid"`

### React local state (component state)
- Cart: `cart: { productId, qty }[]` — lives in `Storefront` (App.tsx), passed down as props
- `cartOpen: boolean` — slide-over panel visibility
- `currentOrderId: string | null` — set after order created, drives confirmation page
- `criticalReady: boolean` — gates `LoadingScreen` removal
- Toast queue: `toasts[]` via `useToast()` custom hook
- TI widget sweep animation origin: `tiSweep: { x, y } | null`

### URL as state
- Page/route stored in URL query params (browser-native, shareable, bookmarkable)
- Product slug in `?product=<slug>` (resolved to Convex `_id` via `slugMap` useMemo)

**Next.js Migration:** 
- Cart state → consider Zustand or React Context in `app/layout.tsx` (props drilling across Next.js page boundaries won't work)
- URL state → `useSearchParams()` + `useRouter()` 
- `useQuery` hooks work identically in client components

---

## Deployment Architecture

```
┌─────────────────────────────────────┐
│  GitHub Repository                  │
│  Branch: main                       │
│  GitHub Actions → vite build        │
│  Output: dist/ → GitHub Pages       │
│  URL: /brewmatch-ai/ (base path)    │
└─────────────────────────────────────┘
         │
         │  Static files (HTML, JS, CSS, assets)
         ▼
┌─────────────────────────────────────┐
│  GitHub Pages CDN                   │
│  No server-side rendering           │
│  All routing client-side            │
│  SPA: all paths serve index.html    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Convex Cloud (separate)            │
│  Project: brewmatch-ai              │
│  URL: different-bulldog-772.convex  │
│  .cloud                             │
│  Always-on, auto-scaling            │
│  Env vars: MISTRAL_API_KEY,         │
│  CONVEX_SITE_URL                    │
└─────────────────────────────────────┘
```

**Key configuration:**
- `vite.config.ts`: `base: "/brewmatch-ai/"` — all asset paths prefixed
- `src/lib/asset.ts`: `asset()` helper resolves paths against `import.meta.env.BASE_URL`
- `index.html`: preconnect hint to Convex cloud domain
- `VITE_CONVEX_URL` env var → passed to `ConvexReactClient`

---

## Anti-Patterns

### Routing via query parameters instead of path segments
**What happens:** All "pages" are rendered in a single `App.tsx` using `if (page === "X") return <Component />` guards. There are no URL paths like `/shop` — only `?page=shop`.

**Why it's wrong:** Hard to deep-link, poor SEO (all routes are the same URL to crawlers), breaks standard browser assumptions about page identity, requires custom scroll restoration instead of using the browser's built-in behavior.

**Do this instead:** In Next.js, use file-based routing (`app/shop/page.tsx`). Each page becomes a real URL path.

### Cart state prop-drilled from root
**What happens:** `cart`, `addToCart`, `removeFromCart`, `updateQty` are declared in `Storefront` (App.tsx ~L320) and prop-drilled into `CartPanel`, `ShopPage`, `ProductPage`, `CheckoutPage`.

**Why it's wrong:** In Next.js, each page is a separate module — you can't prop-drill across page boundaries.

**Do this instead:** Lift cart into a React Context provider or Zustand store in `app/layout.tsx`.

### `useUrlQuery()` custom hook (duplicates React Router/Next.js)
**What happens:** `src/App.tsx` implements its own URL observer via `window.addEventListener("popstate")` and `window.location.search`.

**Do this instead:** In Next.js, use `useSearchParams()` and `usePathname()` from `next/navigation`.

---

## Error Handling

**Strategy:** Mostly silent failure with fallbacks.

**Patterns:**
- Convex query returns `undefined` until loaded — components render loading states or use fallback data
- `useProducts` falls back to `sessionStorage` cache on Convex failure
- `useSiteContent` hooks return hardcoded `DEFAULT_*` values when Convex returns no data
- AI recommendation action: if `MISTRAL_API_KEY` missing, returns empty arrays + message string (no throw)
- Geo resolution: three-tier fallback (GPS → Nominatim → ipapi.co → ipwho.is) with silent catch blocks

---

## Cross-Cutting Concerns

**Logging:** `console.log` only; no structured logging framework.

**Validation:** Input validation at Convex mutation boundaries using `convex/values` validators (`v.string()`, `v.number()`, etc.). No client-side form validation library.

**Authentication:** Only admin panel is auth-gated. The entire storefront (products, orders, checkout) is unauthenticated/public.

**Analytics:** Page views tracked via `convex/pageViews.ts` — records path, session ID, geo, duration on `visibilitychange`. Displayed in `src/components/admin/SalesAnalytics.tsx`.

---

*Architecture analysis: 2026-05-20*
