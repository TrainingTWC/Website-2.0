# Concerns & Technical Debt

**Analysis Date:** 2026-05-20

---

## Critical Issues

**Orders submitted without authentication:**
- Risk: Any visitor can place an order with any email/phone — no identity verification.
- Files: `convex/orders.ts`, `src/components/CheckoutPage.tsx`
- Impact: Order spam, fake COD orders that cost real shipping. No way to tie orders to user accounts.
- Fix: Require auth token on `submitOrder` or add rate-limiting via `ctx.auth`.

**`api as any` casts bypass type safety on real mutations:**
- Files: `src/App.tsx` (lines 346–347), `src/components/admin/SuperAdminDashboard.tsx` (lines 888–900)
- Why: `pageViews.record`, `pageViews.updateDuration`, and all `dangerZone.*` mutations are cast to `any` because they aren't surfacing correctly in the generated API types, or were added after the last `npx convex dev` type-gen run.
- Impact: Broken mutations will silently fail at runtime with no TS errors.
- Fix: Run `npx convex dev` to regenerate types; remove all `(api as any)` casts.

**`pageViews.getStats` and `listOrders` do unbounded `.collect()`:**
- Files: `convex/pageViews.ts` (line ~57), `convex/orders.ts`
- Risk: As table grows, these queries will hit Convex's 16 MB document read limit and time out.
- Fix: Paginate with `.paginate()` or use indexed range queries with time-window filters.

---

## Technical Debt

**App.tsx is a 1700+ line monolith:**
- File: `src/App.tsx`
- Contains: Custom router, scroll helpers, geo resolution, page view tracking, toast system, all page-level components (`Storefront`, `FizzBanner`, `DessertsBanner`, and more).
- Problem: Difficult to test, impossible to SSR in isolation, merge conflicts guaranteed.
- Fix: Extract each section into its own file under `src/pages/` or `src/sections/` before migration.

**Hand-rolled URL router with no library:**
- Files: `src/App.tsx` — `useUrlQuery()`, `navigateTo()`, `currentScrollY()`, `scrollToY()`
- Pattern: Entire routing is `?page=shop`, `?product=slug`, `?panel=merchant` query params read from `window.location.search`, with `window.history.pushState` for navigation.
- No react-router-dom, no Next.js Link — every navigation decision is imperative.
- Impact: Zero chance of SSR without a complete router rewrite.

**AI response cache has no TTL or eviction:**
- File: `convex/cache.ts`
- The `set` mutation inserts and never expires. Old entries from stale prompt templates accumulate forever (mitigated by `CACHE_VERSION` bump in `recommendations.ts`, but old entries are orphaned — not deleted).
- Fix: Add `expiresAt` field; run a scheduled cleanup job.

**Session ID generated with `Math.random()`:**
- File: `src/App.tsx` line ~352
- `Math.random().toString(36).slice(2)` is not cryptographically random. Collision risk at scale.
- Fix: Use `crypto.randomUUID()` (available in all modern browsers and Node.js 14.17+).

**Hardcoded GitHub Pages URL in admin settings:**
- File: `src/components/admin/SuperAdminDashboard.tsx` line 609
- `useState("https://trainingtwc.github.io/brewmatch-ai/")` is hardcoded.
- Fix: Drive from an env var or Convex `siteContent` record.

**Hardcoded Unsplash image URL:**
- File: `src/App.tsx` line ~578
- One fallback hero image points directly to `images.unsplash.com`. Breaks offline, may violate Unsplash terms if used commercially at scale.
- Fix: Host image in `/public/` or Convex file storage.

**`GalaxySweep` uses `Math.random()` for particle layout:**
- File: `src/components/GalaxySweep.tsx`
- Non-deterministic on render. Fine for CSR, but creates hydration mismatches in SSR.
- Fix: Seed with a stable value or compute positions with a deterministic algorithm.

**No payment gateway integration:**
- Files: `src/components/CheckoutPage.tsx`, `convex/orders.ts`
- `paymentMethod: "upi" | "card"` is stored but no payment processor is called — all orders land as "pending" regardless of declared payment method.
- UPI and card are UI-only; actual money movement is manual/offline.
- Fix: Integrate Razorpay or Stripe before going to production.

---

## Performance Concerns

**Three.js / WebGL loaded eagerly on the product page:**
- Files: `src/components/ProductHero3D.tsx`, `src/components/BestsellerCarousel3D.tsx`
- `@react-three/fiber` and `three` (184 KB min+gzip) are not dynamically imported.
- The 3D model GLB files are fetched immediately when `ProductPage` mounts.
- Fix: Wrap with `React.lazy` + `Suspense`; lazy-load `@react-three/fiber`.

**`leaflet` and `react-leaflet` loaded in admin bundle:**
- File: `src/components/admin/VisitorMap.tsx`
- Leaflet adds ~142 KB min+gzip. The admin panel is already large; no code-splitting exists.
- Fix: Dynamic import `VisitorMap` with `React.lazy`.

**No route-based code splitting:**
- File: `src/App.tsx`
- All pages (shop, product, checkout, order portal, editorial, admin, superadmin) are imported at the top of `App.tsx` as static imports. The entire app ships in one bundle.
- Fix: Wrap each route component with `React.lazy()`.

**`sessionStorage` cache in `useProducts` is hit-or-miss:**
- File: `src/lib/useProducts.ts`
- The cache key is `brewmatch:products:v1` — no TTL. Stale product data (prices, stock status) can persist across the session with no refresh mechanism except closing the tab.
- Fix: Store `cachedAt` and invalidate after N minutes, or rely on Convex real-time subscriptions exclusively.

**IP geo resolution fires 3 sequential fetch calls on every session:**
- File: `src/App.tsx` lines ~403–445
- `ipapi.co → ipwho.is → ipify.org` are tried in series. Total worst-case latency is 7.5 s (3 × 2.5 s timeouts) before giving up.
- Fix: Parallelize with `Promise.any()` or cache the result more aggressively (currently only caches on `ip.country` truthy).

**`KioskPipeline` runs a 6.5-second timed animation on the main thread:**
- File: `src/components/widget/KioskPipeline.tsx`
- Uses multiple `setTimeout`/phase transitions. Not a blocking concern but heavy for low-end devices.

---

## Security Concerns

**IP geolocation and GPS tracked without explicit consent UI:**
- Files: `src/App.tsx` (geo resolution runs on every page load), `src/lib/useGeoAddress.ts`
- GPS is requested from user via browser prompt during checkout. Page-view IP geo runs silently.
- GDPR/privacy risk for EU visitors.
- Fix: Add a consent banner; document geo data collection in a privacy policy.

**`document.referrer` sent to Convex without sanitization:**
- File: `src/App.tsx` line ~460
- Raw referrer string is inserted directly into the database. Could contain sensitive URL fragments from the referring site.
- Fix: Truncate to hostname only before storing.

**Admin panel accessible via URL query param with no route guarding on the client:**
- Files: `src/App.tsx` — `panel=merchant` and `panel=superadmin` params
- The `AdminAuthGate` handles auth inside the component, but there's no HTTP-level protection. Bots can probe the admin panel surface.
- Convex auth enforces server-side checks, so this is low-risk but increases attack surface.

**`randomAlphaNum` for order IDs uses `Math.floor(Math.random())`:**
- File: `convex/orders.ts` lines 5–11
- Not cryptographically random. Order IDs could theoretically be guessed/enumerated.
- Fix: Use `crypto.randomUUID()` in Convex Node actions, or accept the risk for internal IDs.

---

## Next.js Migration Concerns

This section documents every non-trivial migration challenge for moving from Vite SPA → Next.js App Router.

---

### Routing

**Current state:** Entirely hand-rolled using `window.location.search` query params. No router library is used.
- `useUrlQuery()` reads `window.location.search` directly — must be replaced with `useSearchParams()` (Next.js client hook) or `searchParams` prop (server component).
- `navigateTo()` calls `window.history.pushState` + `window.dispatchEvent(new PopStateEvent(...))` — must be replaced with `router.push()` from `next/navigation`.
- `currentScrollY()` and `scrollToY()` reference `window.scrollY` and `window.__lenis` — must stay client-side in a `'use client'` component.
- All URLs use query params (`?page=shop&product=slug`). In Next.js this can be kept as dynamic routes (`/shop`, `/shop/[slug]`) or search params — requires a routing architecture decision before migration.
- **Risk: HIGH** — routing is the most pervasive change; no file in `src/` is untouched.

---

### SSR / SSG Implications

**Browser globals that break on the server (must be guarded with `typeof window !== 'undefined'` or moved to `useEffect`):**

| API | Files |
|-----|-------|
| `window.location.search / pathname / href` | `src/App.tsx` (lines 180, 218–222) |
| `window.history.pushState / replaceState` | `src/App.tsx` (`navigateTo`) |
| `window.addEventListener('popstate')` | `src/App.tsx` (lines 331–338) |
| `window.scrollTo / window.scrollY` | `src/App.tsx` (`scrollToY`) |
| `window.matchMedia(...)` | `src/components/SmoothScroll.tsx` line 15, `src/components/MagneticCursor.tsx` line 27 |
| `window.__lenis` (global singleton) | `src/App.tsx` (lines 196–207), `src/components/SmoothScroll.tsx` line 37 |
| `document.getElementById(...)` | `src/App.tsx` line 73, `src/components/SiteFooter.tsx` line 22 |
| `document.querySelector(...)` | `src/components/SmoothScroll.tsx` line 61 |
| `document.referrer` | `src/App.tsx` line ~460 |
| `document.documentElement.classList.add` | `src/components/MagneticCursor.tsx` line 32 |
| `sessionStorage` | `src/lib/useProducts.ts`, `src/App.tsx` (session ID, geo cache) |
| `localStorage` | `src/lib/useGeoAddress.ts` |
| `navigator.geolocation` | `src/lib/useGeoAddress.ts`, `src/App.tsx` |
| `requestAnimationFrame` | `src/components/ProductHero3D.tsx`, `src/components/BestsellerCarousel3D.tsx` |

**Rule for migration:** Every component that touches these APIs must either:
1. Be a `'use client'` component with the logic inside `useEffect`, OR
2. Use dynamic import with `ssr: false` (`next/dynamic`)

**SSG suitability:** Product pages (`?product=slug`) are excellent SSG candidates — product data changes rarely. Currently impossible because products are fetched only via Convex real-time subscription on the client.

---

### Convex Integration

**Current pattern:** `ConvexReactClient` + `ConvexAuthProvider` wrap the entire app in `src/main.tsx`. All Convex hooks (`useQuery`, `useMutation`, `useAction`) are called inside client components.

**Migration path for Next.js App Router:**
- Create a `ConvexClientProvider` client component wrapping `ConvexReactClient` and `ConvexAuthProvider`.
- Add it to the root layout: `app/layout.tsx` → `<ConvexClientProvider>`.
- All Convex hook callers must be `'use client'` components — this is the majority of the app.
- Convex does not run on the server in this pattern; SSR data hydration requires either:
  - Convex's experimental server-side fetch (`fetchQuery` from `convex/nextjs`) for RSC pre-rendering, OR
  - Accept client-only data fetching (no SSR benefit for product data).
- `convex/_generated/` import paths work identically in Next.js.
- File: `src/main.tsx` — the provider setup moves to `app/layout.tsx` (client wrapper).

---

### Auth (Convex Auth → Next.js)

**Current state:** `@convex-dev/auth` with `Password` provider. `ConvexAuthProvider` from `@convex-dev/auth/react` is the sole auth layer.
- No session cookies — auth state lives entirely in the Convex client (JWT in memory).
- Admin panel is gated by `AdminAuthGate` which calls `useConvexAuth()` + a Convex `isAdmin` query.
- File: `convex/auth.config.ts` — `CONVEX_SITE_URL` must be updated from GitHub Pages URL to the Next.js deployment URL.
- `@convex-dev/auth` has official Next.js App Router support — the migration path is documented. The `ConvexAuthProvider` becomes a client component wrapper in `app/layout.tsx`.
- Middleware-based route protection (protecting `/admin/*`) requires reading the Convex JWT from the request — possible via `@convex-dev/auth/nextjs` middleware helpers.
- **Risk: MEDIUM** — auth works client-side today and will continue to; middleware route protection is optional but desirable.

---

### GitHub Pages → Vercel/Other Hosting

**Current state:**
- `vite.config.ts`: `base: "/brewmatch-ai/"` — all asset URLs are prefixed with `/brewmatch-ai/`.
- `src/lib/asset.ts` — `asset()` helper reads `import.meta.env.BASE_URL` which returns `/brewmatch-ai/` in production.
- All banner image URLs in `src/App.tsx` use `import.meta.env.BASE_URL` for the path prefix.
- `convex/auth.config.ts` uses `process.env.CONVEX_SITE_URL` — currently set to the GitHub Pages URL.

**Migration steps:**
1. Remove `base: "/brewmatch-ai/"` from Vite config (or set `basePath: ""` in `next.config.ts`).
2. Replace `import.meta.env.BASE_URL` with `process.env.NEXT_PUBLIC_BASE_URL` or use Next.js `/public/` asset serving (no base path prefix needed).
3. Replace the `asset()` helper with Next.js `<Image>` component or plain `/public/` relative paths.
4. Update `CONVEX_SITE_URL` in Convex dashboard to the Vercel deployment URL.
5. Move `VITE_CONVEX_URL` → `NEXT_PUBLIC_CONVEX_URL` in env configuration.
- **Risk: MEDIUM** — asset paths are woven throughout the codebase; every `asset("...")` call needs updating.

---

### Vite-specific Patterns

**`import.meta.env.*` references:**
- `import.meta.env.VITE_CONVEX_URL` → `process.env.NEXT_PUBLIC_CONVEX_URL`
- `import.meta.env.BASE_URL` → must be removed or replaced (see above)
- Files: `src/main.tsx` line 8, `src/lib/asset.ts` line 9, `src/App.tsx` lines 249, 282

**HMR config in `vite.config.ts`:**
- `server.hmr: process.env.DISABLE_HMR !== 'true'` — Vite-only; not needed in Next.js.

**`@vitejs/plugin-react`:**
- Replaced by Next.js's built-in React/SWC compilation. No manual config needed.

**Build scripts:**
- `scripts/optimizeImages.ts`, `scripts/buildFavicon.ts`, `scripts/seedToConvex.ts` all use `tsx` directly — these are standalone and unaffected by the framework migration.

---

### CSS / Tailwind v4

**Current state:** Tailwind **v4** with the `@tailwindcss/vite` plugin (CSS-first config).
- `src/index.css` uses `@import "tailwindcss"` and `@theme {}` block — this is the v4 CSS-first API.
- Custom design tokens (`--color-natural-bg`, `--font-sans`, etc.) are defined in `@theme {}`.
- No `tailwind.config.js` exists.

**Migration challenge:**
- Next.js docs and most templates assume Tailwind v3 with `tailwind.config.js`.
- Tailwind v4 supports Next.js via `@tailwindcss/postcss` (PostCSS plugin), NOT `@tailwindcss/vite`.
- Replace `@tailwindcss/vite` in the plugin list with `@tailwindcss/postcss` in `postcss.config.mjs`.
- The `@theme {}` block and CSS-first config remain valid — no changes to `index.css`.
- **Risk: LOW** — the CSS itself is compatible; only the build plugin changes.

---

### Third-party Libraries with Client-Only Assumptions

| Library | Issue | Migration fix |
|---------|-------|---------------|
| `three` + `@react-three/fiber` + `@react-three/drei` | WebGL — browser-only. Crashes on Node.js server. | Wrap with `next/dynamic(..., { ssr: false })` for `ProductHero3D` and `BestsellerCarousel3D`. |
| `lenis` | Attaches to `window`, uses `requestAnimationFrame`. | Keep `SmoothScroll` as `'use client'`; ensure it only initialises inside `useEffect`. |
| `leaflet` + `react-leaflet` | Reads `document` on import (well-known SSR issue). | `next/dynamic(() => import('../components/admin/VisitorMap'), { ssr: false })` |
| `motion/react` (Framer Motion v12) | Has SSR support but layout animations / `useScroll` need the DOM. All `motion` components must be in `'use client'` components or use the `LazyMotion` API. | Add `'use client'` to all components using `motion.*`; no API change needed. |
| `MagneticCursor` | Reads `window.matchMedia`, attaches mouse event listeners on module execution. | Mark `'use client'`; ensure all logic is inside `useEffect`. Already structured this way — low effort. |

---

### Image Optimization

**Current state:**
- `SmartImage` (`src/components/SmartImage.tsx`) is a custom component using an `<img>` tag with `loading="lazy"` and a blur-up placeholder from `imageBlur` (base64 stored in Convex).
- Product `imageUrl` values are external CDN URLs (no Convex file storage).
- `asset()` helper resolves `/public/` images via `import.meta.env.BASE_URL`.
- The `scripts/optimizeImages.ts` script generates WebP/AVIF versions + manifest into `public/optimized/`.

**Migration:**
- Replace `SmartImage` with Next.js `<Image>` component — gets automatic WebP conversion, layout optimization, lazy loading for free.
- For external CDN image URLs, add the domain(s) to `next.config.ts` under `images.remotePatterns`.
- The optimized images in `public/optimized/` can be served directly from Next.js `/public/` without changes.
- The blur placeholder base64 in Convex maps directly to Next.js `<Image placeholder="blur" blurDataURL={...}>`.
- **Risk: LOW** — `SmartImage` is a thin wrapper; swap is mechanical.

---

### Environment Variables

| Current (Vite) | Next.js equivalent | Notes |
|-----------------|---------------------|-------|
| `VITE_CONVEX_URL` | `NEXT_PUBLIC_CONVEX_URL` | Must be prefixed `NEXT_PUBLIC_` for client-side access |
| `import.meta.env.BASE_URL` | Remove / use Next.js `basePath` | Vite-only; no equivalent needed on Vercel |
| `CONVEX_SITE_URL` (server-side in Convex) | Same — update value to Vercel URL | Not in frontend code |
| `MISTRAL_API_KEY` (Convex server env) | Same — lives in Convex dashboard | Not in frontend code |

**Migration risk:** All `import.meta.env.*` references must be found and replaced. There are 4 in the codebase. Easy to audit but easy to miss one.

---

## Pre-Migration Checklist

Before starting the Next.js migration:

- [ ] **Extract App.tsx** — break the 1700-line monolith into per-page components under `src/pages/` or `src/sections/`.
- [ ] **Install react-router-dom or decide on Next.js file-based routing** — the current hand-rolled router must be replaced before any other migration step can work.
- [ ] **Audit all `(api as any)` casts** — regenerate Convex types (`npx convex dev`) and remove all casts.
- [ ] **Fix the `pageViews.collect()` query** — add pagination before traffic grows.
- [ ] **Add a payment gateway** — COD/UPI/card must be real before going to production on any new domain.
- [ ] **Update `CONVEX_SITE_URL`** — change from GitHub Pages URL to new deployment URL.
- [ ] **Rename env vars** — `VITE_CONVEX_URL` → `NEXT_PUBLIC_CONVEX_URL` everywhere.
- [ ] **Audit all `import.meta.env.BASE_URL` uses** — replace with plain `/` paths or Next.js asset conventions.
- [ ] **Add `'use client'` boundary strategy** — decide which components are server vs. client before writing any Next.js route files.
- [ ] **Dynamic import for Three.js and Leaflet** — wrap before migration so the app doesn't crash on the server.
- [ ] **Replace `@tailwindcss/vite` with `@tailwindcss/postcss`** in build config.
- [ ] **Test Convex Auth `CONVEX_SITE_URL`** — must match the exact Next.js deployment origin or auth token validation fails.
- [ ] **Remove `base: "/brewmatch-ai/"` from vite.config** (or set `basePath` in `next.config.ts` if subpath deployment is needed on Vercel).

---

## Migration Risk Rating

| Area | Risk | Justification |
|------|------|---------------|
| **Routing** | HIGH | Custom `window.history` router must be completely rewritten. No library abstraction exists to port from. Every navigation call in the app is imperative. |
| **SSR / Browser globals** | HIGH | 15+ browser-only APIs used throughout the codebase, many at module scope or in non-`useEffect` positions. Each requires audit and guard. |
| **Convex integration** | LOW | `@convex-dev/auth` and `convex/react` both have documented Next.js App Router support. The migration is mechanical: add a client wrapper around the layout. |
| **Auth** | MEDIUM | `ConvexAuthProvider` moves to a client wrapper cleanly. Middleware-level route protection for admin panel requires additional setup. `CONVEX_SITE_URL` must be updated. |
| **Three.js / WebGL** | MEDIUM | Known SSR problem with a known fix (`ssr: false` dynamic import). Risk is low once identified; risk of forgetting is medium. |
| **Lenis smooth scroll** | MEDIUM | The `SmoothScroll` component mutates `window.__lenis` globally. Needs careful `useEffect` wrapping and `'use client'` isolation. |
| **Leaflet maps** | LOW | Known SSR problem; `ssr: false` dynamic import is a one-line fix. Admin-only component. |
| **Tailwind v4 CSS** | LOW | Plugin swap (`@tailwindcss/vite` → `@tailwindcss/postcss`) is the only change. CSS itself is compatible. |
| **Image optimization** | LOW | `SmartImage` is a thin wrapper around `<img>`. Replacing with Next.js `<Image>` is mechanical and improves performance. |
| **Environment variables** | LOW | 4 known `import.meta.env` references. Rename is straightforward but must be audited carefully in CI. |
| **GitHub Pages → Vercel** | MEDIUM | `base: "/brewmatch-ai/"` is woven throughout asset URLs. Removing the base path prefix requires updating every `asset(...)` call and banner image reference. |
| **No testing** | HIGH (meta-risk) | Zero test files exist. Any migration regression will be caught only in manual QA. Writing integration tests before migrating is strongly advised. |

---

*Concerns audit: 2026-05-20*
