# External Integrations

**Analysis Date:** 2026-05-20

---

## Convex

- **Purpose:** Full-stack BaaS — document database, server functions (queries/mutations/actions), file storage, HTTP routing, real-time subscriptions
- **SDK/package:** `convex ^1.38.0`
- **Config location:** `convex.json` (project identity), `VITE_CONVEX_URL` env var (frontend client URL)
- **Auth method:** Convex deployment URL passed to `ConvexReactClient` in `src/main.tsx`
- **Usage files:**
  - Client init: `src/main.tsx`
  - All backend logic: `convex/*.ts`
  - Generated API types: `convex/_generated/api.d.ts`, `convex/_generated/dataModel.d.ts`
- **Prod URL:** `https://different-bulldog-772.convex.cloud`
- **Next.js Migration Impact:** Convex backend is framework-agnostic — no changes needed. Client setup moves from `src/main.tsx` to a `'use client'` provider in `app/layout.tsx`. Rename `VITE_CONVEX_URL` → `NEXT_PUBLIC_CONVEX_URL`.

---

## Convex Auth (@convex-dev/auth)

- **Purpose:** Password-based authentication for admin panel users
- **SDK/package:** `@convex-dev/auth ^0.0.92`, `@auth/core ^0.37.4`
- **Config location:** `convex/auth.config.ts` (JWT domain = `CONVEX_SITE_URL`), `convex/auth.ts` (provider config)
- **Auth method:** Email + password via `Password` provider; JWT issued by Convex, verified server-side
- **Env var:** `CONVEX_SITE_URL` — set in Convex dashboard
- **Usage files:**
  - Backend: `convex/auth.ts`, `convex/auth.config.ts`, `convex/http.ts`, `convex/admins.ts`, `convex/authAdmin.ts`
  - Frontend: `src/main.tsx` (`ConvexAuthProvider`), `src/components/admin/AdminAuthGate.tsx`, `src/components/admin/AdminLogin.tsx`
- **Next.js Migration Impact:** `@convex-dev/auth` has a Next.js guide. Need to add Next.js middleware (`middleware.ts`) for server-side session checks. `ConvexAuthProvider` wraps inside a `'use client'` root layout provider.

---

## Mistral AI

- **Purpose:** Two uses — (1) AI coffee product recommendations based on personality quiz answers, (2) order support chatbot for customers
- **SDK/package:** Direct `fetch()` — no Mistral SDK installed
- **Model used:** `mistral-small-2603` (hybrid reasoning model; strips `<think>` tokens from responses)
- **API endpoint:** `https://api.mistral.ai/v1/chat/completions`
- **Config location:** `MISTRAL_API_KEY` — Convex server-side env var (set via `npx convex env set MISTRAL_API_KEY "..."`)
- **Auth method:** Bearer token in `Authorization` header
- **Usage files:**
  - Recommendations: `convex/recommendations.ts` (action, `"use node";`)
  - Support chatbot: `convex/support.ts` (action, `"use node";`)
  - Response cache: `convex/cache.ts` + `aiCache` Convex table (SHA-256 keyed, avoids re-calling API for identical inputs)
  - Brand/product context for prompts: `convex/productContext.ts`
- **Next.js Migration Impact:** No change — Mistral calls are entirely Convex server-side actions. Unaffected by frontend migration.

---

## Convex File Storage

- **Purpose:** Stores uploaded images — product images, editorial cover images, site content images (hero, banners, etc.)
- **SDK/package:** Built into `convex` SDK (`ctx.storage.generateUploadUrl()`, `ctx.storage.getUrl()`)
- **Auth method:** Short-lived signed upload URLs (60-second expiry) generated server-side
- **Usage files:**
  - `convex/products.ts` — product image uploads
  - `convex/posts.ts` — editorial post cover images
  - `convex/siteContent.ts` — home page / section image uploads
  - `convex/seed.ts` — seed script image uploads
  - Admin CMS components: `src/components/admin/EditorialCMS.tsx`, `src/components/admin/ImagePicker.tsx`, `src/components/admin/HomeContentCMS.tsx`
- **Upload pattern:** `generateUploadUrl` mutation → `fetch(url, { method: 'PUT', body: file })` → store `storageId` in DB
- **Next.js Migration Impact:** No change — all storage logic is Convex server-side.

---

## OpenStreetMap / Nominatim (Reverse Geocoding)

- **Purpose:** Converts browser GPS coordinates to a human-readable address during checkout (street, city, state, pincode)
- **SDK/package:** Direct `fetch()` — no SDK
- **API endpoint:** `https://nominatim.openstreetmap.org/reverse?format=json&lat=…&lon=…`
- **Auth method:** None (free, no API key required)
- **Config location:** Hardcoded URL in `src/lib/useGeoAddress.ts`
- **Usage files:** `src/lib/useGeoAddress.ts`, `src/components/CheckoutPage.tsx`
- **Result cached in:** `localStorage` (key: `twc_geo_address`, TTL: 7 days)
- **Next.js Migration Impact:** Works unchanged as a client-side hook (`'use client'`). Nominatim requires a valid `User-Agent` header — may need to set `Referer` or `User-Agent` per Nominatim usage policy if traffic increases.

---

## OpenStreetMap Tile Server (Maps)

- **Purpose:** Renders interactive visitor analytics map in admin dashboard
- **SDK/package:** `leaflet ^1.9.4`, `react-leaflet ^5.0.0`
- **Tile URL:** `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Auth method:** None (free public tiles)
- **Usage files:** `src/components/admin/VisitorMap.tsx`
- **Next.js Migration Impact:** Leaflet uses `window` at import time — **requires** `dynamic(() => import('./VisitorMap'), { ssr: false })` in Next.js. Add `'use client'` directive to `VisitorMap.tsx`.

---

## ipapi.co (IP Geolocation)

- **Purpose:** Geolocates visitor IP address for page view analytics (country, region, city, lat/lon) — primary provider
- **SDK/package:** Direct `fetch()` — no SDK
- **API endpoints:**
  - `https://ipapi.co/json/` — auto-detect current IP
  - `https://ipapi.co/{ip}/json/` — look up specific IP (used as fallback after ipify)
- **Auth method:** None (free tier, rate-limited)
- **Config location:** Hardcoded URL in `src/App.tsx` (~line 403)
- **Usage files:** `src/App.tsx` (geo detection chain for page view recording)
- **Timeout:** 2500ms `AbortSignal.timeout`
- **Next.js Migration Impact:** Must remain client-side (`'use client'`). In Next.js, could be moved to a Server Action or Route Handler to avoid CORS and improve rate limit headroom, but current client-side approach works.

---

## ipwho.is (IP Geolocation — Fallback)

- **Purpose:** Secondary IP geolocation provider if ipapi.co fails
- **SDK/package:** Direct `fetch()` — no SDK
- **API endpoint:** `https://ipwho.is/`
- **Auth method:** None (free, no API key)
- **Config location:** Hardcoded URL in `src/App.tsx` (~line 419)
- **Usage files:** `src/App.tsx`
- **Timeout:** 2500ms
- **Next.js Migration Impact:** Same as ipapi.co.

---

## ipify.org (Public IP Detection)

- **Purpose:** Detects the visitor's public IP address as a fallback when direct geo providers fail, then passes IP to ipapi.co for lookup
- **SDK/package:** Direct `fetch()` — no SDK
- **API endpoint:** `https://api.ipify.org?format=json`
- **Auth method:** None (free)
- **Config location:** Hardcoded URL in `src/App.tsx` (~line 435)
- **Usage files:** `src/App.tsx`
- **Timeout:** 2000ms
- **Next.js Migration Impact:** Same as ipapi.co. Could be eliminated if geo detection moves server-side (use `request.headers.get('x-forwarded-for')` in Next.js middleware/route handlers).

---

## Browser Geolocation API

- **Purpose:** Two uses — (1) auto-fill checkout address using GPS → Nominatim reverse geocoding, (2) high-accuracy geo data for page view analytics
- **SDK/package:** Native browser API (`navigator.geolocation`)
- **Auth method:** Browser permission prompt
- **Usage files:**
  - `src/lib/useGeoAddress.ts` — checkout address autofill
  - `src/App.tsx` — page view geo recording (GPS preferred over IP lookup)
  - `src/components/CheckoutPage.tsx` — UI button to trigger location request
- **Next.js Migration Impact:** Client-side only — add `'use client'` to consuming components. No other change needed.

---

## Geo Detection Chain (Page View Tracking)

The app uses a prioritized fallback chain for geolocating visitors:

1. **Browser GPS** (`navigator.geolocation`) — highest accuracy, requires permission
2. **ipapi.co** (`/json/`) — auto-detect
3. **ipwho.is** — fallback
4. **ipify.org** → **ipapi.co/{ip}** — last resort

Results are recorded via `convex/pageViews.ts` `record` mutation and displayed on the admin visitor map.

---

*Integration audit: 2026-05-20*
