# BrewMatch AI · Third Wave Coffee — Project Changelog

A complete, chronological record of every change shipped from the initial commit (`8ee9b01`, May 12 2026) through the latest deploy (`dc648e4`, May 25 2026). Grouped by theme/milestone, with commit SHAs preserved for traceability.

- **Repo:** <https://github.com/TrainingTWC/Website-2.0>
- **Live:** <https://thirdwavecoffee.prismintelligence.in>
- **Convex (prod):** `https://watchful-cormorant-351.convex.cloud`

---

## 1 · Bootstrap (May 12)

| SHA | Change |
| --- | --- |
| `8ee9b01` | **Initial commit** — React 18 + Vite + TypeScript SPA, "BrewMatch AI" with warm aesthetic and premium 3D effects, Tailwind v4 `@theme` tokens (`natural-bg`, `natural-paper`, `natural-text`, `natural-accent`, `natural-border`, `natural-muted`). |
| `c8d9e7f` | GitHub Actions Pages deploy workflow + `/brewmatch-ai/` base path. |
| `9de7ec5` | `convex.json` linked to the `twc-website` production deployment. |

## 2 · Cinematic core (May 12–13)

- `83008ee` Cinematic loading screen; `SmartImage` with LQIP blur-up; kiosk AI decision pipeline scaffold.
- `6f3cea2` 3D bestseller carousel hero; product detail page; slim category cards; transparent Third Intelligence icon.
- `4678ce9` **Autajon-style scrollytelling** stack — Lenis smooth scroll, magnetic cursor, `ChapterReveal`, `CurtainTransition`, pinned big-text backgrounds.
- `8056d0d` Auto-rotating `BannerSlideshow`; TI redesigned as split-pane (controls + live coffee curation canvas).
- `1fa884a` Killed parallax lag; live product shortlist with per-answer filters; removed magnetic cursor; Fizz + Desserts banner JSX; dimmed hero bg.
- `c604b85` Frame-rate-independent Lenis lerp; smooth home → product transition (blur + scale); rich parallax on product hero (image, title, orbs, side, tasting story).

## 3 · TI promoted to a route + early polish (May 13)

- `ca5a232` TI as full-page route (`?ti=1`); scrollable shortlist; `GOOGLE_AI_API_KEY` env var; CI deploys Convex functions.
- `f661a7f` Single scrollbar on product page; TI shows top-2-per-category with animated replacements.
- `e4baf2d` Pretty slugs in URLs (`?product=kenyan-single-origin`); trackpad scroll on product page.
- `742440b` Restored missing `useMemo` import.
- `fdbec28` Removed 40 vh dead-zone gap in cinematic chapter sections.

## 4 · Nav evolution + full mobile pass (May 13)

- `9b8f874` Thin header + side-rail nav slides in from left on scroll.
- `8a9da92` Icon side-rail with active-section tracking; cart in rail; smooth TI pulse; mobile bottom rail.
- `ce8a6f8` **Morphing header** (text → icons on scroll), bigger logo.
- `587128e` Hoisted fixed header out of the transformed wrapper so it stays pinned; TI placed next to "Our Story".
- `1bd7b66` Swapped `IntersectionObserver` for scroll-position active-section detection.
- `fc69239` Full mobile pass — bottom nav pill, responsive grids/text/spacing, product page, cinematic chapters.
- `4b965b4` Horizontal product scroll; Home nav tab; fixed active-section indicator.
- `5b08f7c` Local Our Story image; renamed site → **Third Wave Coffee**; favicon.
- `bcd2b0c` Fixed Our Story image path.

## 5 · Catalog editorial + H-scroll behaviour (May 13)

- `755212b` Dark editorial catalog header replaces empty curtain + plain-text section.
- `bb643bc` Parallax catalog banner on natural-paper theme.
- `cf68a72` Touch-optimised H-scroll; TI compact no-scroll grid; mobile product strip.
- `796d2ad` Wheel scroll for H-scroll; TI note-only continue; ranked product badges.
- `3856280` Removed snap; drag-to-scroll; fixed wheel normalization.
- `100dc95` **Inertia momentum** H-scroll (rAF + friction); reduced page scroll speed.
- `7617a9f` Product clicks work again; page scrolls through product section cleanly.

## 6 · Product page upgrades (May 13)

- `9537c3d` 3D rotating bag; fit-to-viewport product page; nav closes product page.
- `37883d5` Added missing `handleNavTo` declaration.

## 7 · TI personality + AI provider switch (May 13)

- `102dc95` Third Intelligence context; product personalities; freeform bypass.
- `603db56` Renamed `GOOGLE_AI_API_KEY` → `GEMINI_API_KEY` in deploy workflow.
- `9b078e0` **AI provider: Groq → Mistral** (`mistral-small-latest`).
- `83a672e` Recommendation cards clickable → product page; fixed scroll in "Made for You".

## 8 · Shoutout banners, Cart, Checkout (May 13–14)

- `e78c2dd` Replaced placeholder banners with actual **Schweppes** + **Third Rush** images.
- `c99a424` **Cart system** — slide-out panel, badge on header & mobile nav, clickable recommendation cards.
- `5103c43` Use `BASE_URL` prefix for banner images (GitHub Pages path).
- `a9537cc` Moved `CartPanel` outside transformed wrapper so `fixed` works.
- `b06f1bb` **Checkout page**; cart button on product page; cart opens from product page.
- `e1c0f6b` Removed duplicate cart button from product strip.
- `57ec9bb` **TI and Checkout converted to full-page URL routes** (no more overlays).

## 9 · Coffee personality, Brewing Studio, Sip Forecast (May 14)

- `0588bfd` Product page: **Coffee Personality** section with parallax + illustrated trait cards.
- `68f2a6d` Product page renders as full-page route with native window scroll.
- `9420af4` Scroll position restored on browser back/forward via `history.state`.
- `88f426b` **Brewing Studio** — interactive AI recipe; fixed story text legibility.
- `d039da1` Switched `brewingRecipe` from Gemini → Mistral; purged Gemini refs everywhere.
- `c6ecddf` ECB / cold-brew: replaced Brewing Studio with **Sip Forecast** (mood-driven AI cup forecast).
- `5750ba2` Per-step water grammage in Brewing Studio; skip loading screen on subsequent mounts in a session.
- `4700d82` **Signature Drink** mode; premium UI redesign for Brewing Studio and Sip Forecast.
- `3c64536` 3-category pairings (Food, Book, Music) in Sip Forecast & Brewing Studio.
- `63c1f60` Live water flow counter in brew timer.
- `2df7440` Fixed brew math — `brew water = dose × ratio` (total poured), `yield = brew water − grounds absorption`.
- `26af1e8` Signature Drink mode in Sip Forecast (bag-specific flavored-drink builder).

## 10 · Performance pass (May 14)

- `0a2ac6f` **AI response cache** — skip Mistral for repeat inputs (SHA-256 keyed, version-tagged) via a Convex `cache` table.
- `3cfcb3d` Serve product images from GitHub Pages CDN (zero Convex file bandwidth).
- `58bc27b` Cache products in `sessionStorage` — one Convex query per session instead of per page.
- `f5b15a4` Skip Convex query with the `"skip"` args token (correct convex/react pattern), not `undefined`.

## 11 · Branding refinements (May 14)

- `901582a` Portrait hero banners on mobile; morphing logo from loader → centred mobile header.
- `3112bfd` Standardised every AI surface on the **Third Intelligence** icon.
- `2a0202d` Stripped black background from TI icon; aligned with nav pills.
- `53db764` White-circle favicon; lighter TI badge background on dark surfaces.
- `b51babf` Trimmed whitespace + tight-cropped logo so it reads big.
- `a47e4a1` 3D product hero for **Signature South Indian Filter Blend**.
- `eceee29` Seamless image → 3D crossfade (no blank gap).
- `beed134` Centred nav in header; fixed nav-click dead zones.
- `5805640` Product card images clickable.
- `a4bb1e8` 3D hero for **El Diablo Blend**.

## 12 · v2.0 eShop milestone — Admin + Stock + Orders (May 14)

- `81acef4` Initialised v2.0 eShop milestone (no Shopify).
- `3d81800` Admin: **automated stock management**.
- `52875b9` Tasteful **glassmorphism** across storefront.
- `689a6fc` **Comprehensive admin overhaul** — categories, full product editor, site analytics (new `pageViews` + `categories` tables).
- `ecf6cb3` Added 10 new merch products with brand photography.
- `83683ed` **Order backend** — Convex `orders` table; checkout → Convex; order confirmation page; admin orders tab.
- `d211b96` Admin inventory uses **live Convex query** — deletes/edits reflect instantly.
- `c9d9c3e` Asset uploads.
- `fce1344` Lighter scroll; stricter H-scroll threshold; `object-top` images; sideways parallax on merch row.
- `57c8bda` Reduced H-scroll parallax to 0.05; widened image buffer to 140 % / −20 % to prevent empty edges.
- `d212fe9` Reduced product-page hero `paddingTop`; hero images → `object-cover` to remove white gap.

## 13 · v3.0 milestone — Analytics, GPS, Order Portal (May 14)

- `896e8d4` **Admin sales analytics dashboard** — revenue KPIs, sparkline chart, top products, status doughnut.
- `32438bc` **GPS address autofill at checkout** — `useGeoAddress` hook, Nominatim reverse geocode, 7-day localStorage cache.
- `e27caf2` **Customer order portal** with AI support chat — order lookup, status timeline, cancel order, Mistral-powered chat.
- `fc8c917` Marked v3.0 milestone complete in `STATE.md`.
- `97ca865` Analytics tab combines **sales + site traffic + AI widget stats**.
- `c6735c8` Shop page; order-portal tabs & visibility; Shop More CTA.

## 14 · Find-Your-Match transition — GalaxySweep evolution (May 14)

- `bdc02ed` Gradient overlay transition when opening Find Your Match / TI widget.
- `b468239` **Gemini-style circular sweep** from click point.
- `1a8bb7b` **Galaxy-AI sweep** (sea-green / blue + grainy); site-wide footer; shop header polish; fixed product nav.
- `a0f5df6` **GalaxySweep v2** — radial burst from origin, translucent wash, 54 drifting glitter sparks.
- `3b05bfd` **GalaxySweep v3** — wave-like staggered ripples, morphing bloom border-radius, silkier cubic easing.
- `f725545` Asset uploads.
- `27fdcc5` Viewport-centred parallax + **two-tier Coffee/Merch product taxonomy** (`mainCategory` + `subCategory` on `products`).

## 15 · Final pass — softened sweep, bento, ChapterDeck (May 14–15)

- `9e5e099` **Subtler GalaxySweep** (5 layers, peak opacity ≤ 0.55, 28 sparse glitters, 36 px bloom blur) · **landing-page bento grid** · **8 subcategory product sections** · **taxonomy backfill migration** (`convex/migrations.ts` → 29/29 products classified: 9 beans · 6 ECB · 4 drinkware · 5 keychains · 2 bags · 2 brewing tools · 1 chocolates).
- `8ac85a3` **ChapterDeck** — 5 stacked chapter cards w/ per-card parallax then a 3D flip-out, replacing the 3 `ChapterReveal`s on the homepage. Bento rebuilt as a single 6-col **dense** grid with row-spans (Beans 3×2 hero, Drinkware 3×1 wide). `BannerSlideshow` gains **drag-swipe** with elastic threshold.
- `57791ef` **ChapterDeck flip → clean cross-fade morph** (no rotation, no perspective; opacity + 1.0→1.04 scale + 0→6 px blur ramp). `BannerSlideshow` gains **prev/next arrows** (hover scale + nudge, `stopPropagation` so drag isn't triggered).

---

## 16 · v8.0 — Admin auth hardening, OTP 2FA, RBAC (May 15–24)

> This section covers the large v4.0–v7.0 feature work that bridged the May 15 architecture snapshot and the v8.0 analytics milestone. Commits `5a6700b` → `138e87b`.

- `5a6700b` OTP error messages use `err.data` for ConvexError propagation.
- `ee3cc23` OTP messages simplified to "OTP Sent / Failed" to avoid leaking email existence.
- `68578f6` Repo renamed → **Website-2.0**; all internal references updated.
- `282e4a8` Product image URLs repointed to custom domain (`thirdwavecoffee.prismintelligence.in`) after repo rename.
- `3696198` v8.0 CRM & order-fulfillment milestone drafted in `.planning/`.
- `178680f` Analytics & friction event catalog (`ANALYTICS-CATALOG.md`) — 122 data-point inventory.
- `17f8894` **v8.0 live: Funnel telemetry + Admin Funnel Dashboard MVP** — `convex/funnel.ts` (8 reactive queries); `src/lib/analytics.ts` client tracker (5 s flush, 20-event batch, UTM first-touch); `AnalyticsBootstrap` component wired into root layout; `FunnelDashboard` (10 dashboard sections: KPI tiles, funnel bar chart, daily trend, dropout hotspots, abandoned carts, payment funnel, device breakdown, friction signals, client errors feed); `customerEventsAnonymous`, `cartSnapshots`, `clientErrors`, `funnelSummary` Convex tables.
- `8235386` v9.0 Studio Media: `media` table added to Convex schema.
- `8e08fbf` `STUDIO_SLOTS` registry + media dependency graph.
- `eadb6b4` Studio Media CRUD module (`convex/media.ts`).
- `ee9746c` v9.0 phase-01-01 plan summary docs.
- `23837e7` Drop invalid `by_creation` index; regenerate Convex TypeScript bindings.
- `c0efd27` Media leaf components: `BlurhashImage`, `LottiePlayer`, `GLBViewer`.
- `fa7817d` `StudioMedia` root renderer — resolves slot + key against `media` table, renders correct leaf.
- `7ef7f9b` v9.0 phase-01-02 plan docs.
- `0371642` Admin **Studio Media CMS tab** — upload, publish/unpublish, delete media for any slot.
- `138e87b` Convex schema comments normalised from mojibake box-drawing chars to ASCII.
- `176a781` **`ANALYTICS-TRACKING.md`** — 354-line reference doc covering every tracked event, all DB tables, sampling policy, UTM attribution, and all 10 dashboard sections.
- `de9cbd9` `StudioMedia` wired into `BrewingStudio` brew-step renderer — each step renders its CMS media after the detail text; component returns `null` when no media published so unset steps are unaffected.

---

## 17 · Security audit & critical vulnerability fixes (May 25)

> Commit: `dc648e4` — 7 files changed, 133 insertions(+), 67 deletions(−). Convex redeployed.

### Vulnerabilities patched

| ID | Severity | File(s) | Description |
|---|---|---|---|
| API-AUTH-01 | 🔴 Critical | `convex/products.ts` | `add`, `remove`, `update`, `updateStock` had **zero auth guards** — any anonymous caller on the internet could delete the catalog, set prices to ₹0, or inject fake products. Added `await requireAdmin(ctx)` as the first line of all four handlers. |
| PRICE-BOUND-01 | 🔴 Critical | `convex/products.ts` | Product price accepted `0` and negative values. Added `price > 0` validation in `add` and `update`. |
| API-ORDER-01 | 🔴 Critical | `convex/orders.ts` + `src/components/CheckoutPage.tsx` | `shipping` and `total` were fully client-supplied and trusted. A shopper could send `shipping: -99999` for a free order. Also, stored order receipts used client-supplied item prices instead of DB prices. **Fix:** removed `shipping` and `total` from mutation args entirely; server now computes `shipping = subtotal > 499 ? 0 : 49`; item prices in the stored receipt are overwritten from DB. Added per-item `qty` validation (1–100). |
| DISC-BOUNDS-01 | 🔴 Critical | `convex/discounts.ts` | Discount `amount` had no bounds — `amount: 150` on a percent discount gave 150% off (negative bill); `amount: -500` on a flat discount *added* ₹500. `maxUses: 0` created a permanently broken code. Added: `amount > 0`, `amount ≤ 100` for percent type, `maxUses ≥ 1` if set. |
| OTP-SESSION-01 | 🔴 Critical | `convex/schema.ts` + `convex/otp.ts` | OTP verification state was stored only in browser `sessionStorage` — no server-side record existed. Added new `adminOtpSessions` Convex table. `verifyOTP` now creates a 30-minute server session row and returns a random `sessionToken`. |
| OTP-BYPASS-01 | 🔴 Critical | `src/components/admin/AdminAuthGate.tsx` | The admin 2FA gate read `sessionStorage.getItem("otp_verified")` and trusted whatever was there. Anyone with browser devtools could run one command and gain full admin access. **Fix:** `AdminAuthGate` now calls `useQuery(api.otp.validateOtpSession, {email, token})` on every mount — the token is validated against the `adminOtpSessions` Convex table server-side. A fake or missing token returns `{valid: false}` and the OTP screen appears. |

### Files changed
- `convex/products.ts` — `ConvexError` import added; `requireAdmin` + price guard on all 4 write mutations.
- `convex/discounts.ts` — Bounds validation block in `createDiscount` handler.
- `convex/orders.ts` — `shipping` / `total` removed from args; server-computed shipping; `serverItems` array built from DB prices; qty 1–100 guard.
- `convex/schema.ts` — `adminOtpSessions` table (`email`, `token`, `expiresAt`) with `by_token` + `by_email` indexes.
- `convex/otp.ts` — `verifyOTP` creates server session + returns `sessionToken`; new `validateOtpSession` query.
- `src/components/admin/AdminAuthGate.tsx` — Removed client-side `otp_verified` sessionStorage check; added server-validated `useQuery(validateOtpSession)`; `otp_session_token` key replaces `otp_verified`.
- `src/components/CheckoutPage.tsx` — Removed `shipping` and `total` from `submitOrder` call.

---

## Architecture snapshot (as of May 25 2026)

### Stack
- **Frontend:** React 18 + Vite + TypeScript; Tailwind v4 `@theme`; Framer Motion (`motion/react`); Lenis smooth scroll.
- **Backend:** Convex (`watchful-cormorant-351.convex.cloud`).
- **AI:** Mistral `mistral-small-latest` for all surfaces (TI shortlist, Brewing Recipe, Sip Forecast, Signature Drink, support chat). Responses cached SHA-256 keyed in Convex.
- **Deploy:** GitHub Actions → GitHub Pages at `thirdwavecoffee.prismintelligence.in` (custom domain).

### URL-driven routes
- `/` — Landing: `CinematicHero` → `CurtainTransition` → `ChapterDeck` (5 cards) → `CurtainTransition` → `CatalogBanner` → bento → 8 subcategory `HScrollRow` sections → Our Story → footer.
- `?ti=1` — Third Intelligence widget (full page).
- `?product=<slug>` — Product detail with parallax, Coffee Personality, Brewing Studio / Sip Forecast.
- `?checkout=1` — Checkout (cart → Convex `orders`).
- `?order=<id>` — Order confirmation.
- `?order-portal=1` — Customer order portal + AI support chat.
- `?shop=1` — Full shop with two-tier taxonomy filter chips.
- `?admin=1` — Admin dashboard (Products / Categories / Orders / Analytics).

### Convex tables
| Table | Purpose |
| --- | --- |
| `products` | Two-tier taxonomy: `mainCategory ∈ {coffee, merch}` · `subCategory ∈ {beans, ecb, drinkware, bags, keychains, chocolates-nuts, brewing-tools}`. Legacy `type` retained; `resolveTaxonomy()` reads either. |
| `orders` | Order lifecycle, status timeline, cancel support, line items. Shipping + total are **server-computed** (never trusted from client). |
| `categories` | Editable in admin. |
| `pageViews` | Site analytics. |
| `cache` | SHA-256-keyed AI response cache (version-tagged). |
| `customerEventsAnonymous` | Client-side funnel events: page views, add-to-cart, checkout starts, etc. 5 s flush / 20-event batch. |
| `cartSnapshots` | Full cart state snapped on change for abandoned-cart analysis. |
| `clientErrors` | JS runtime error reports from the client analytics tracker. |
| `funnelSummary` | Pre-aggregated hourly/daily funnel counters for fast dashboard queries. |
| `media` | Studio Media CMS: slot-keyed media assets (image/Lottie/GLB) with blurhash + publish state. |
| `adminLoginAttempts` | Tracks failed admin login attempts for rate-limiting. |
| `adminOtpSessions` | 30-min server-side OTP session tokens (`email`, `token`, `expiresAt`). Validated by `AdminAuthGate` on every mount — forgery grants no access. |

### Key feature components
- **`GalaxySweep`** — softened radial-burst transition overlay (translucent wash + morphing bloom + 2 thin ripples + 28 sparse glitters + grain).
- **`ChapterDeck`** — 5 stacked chapter cards: per-card parallax (big background wordmark, product image scale+rotate, copy fade-in) then **cross-fade morph** (opacity + 1.0→1.04 scale + 0→6 px blur) into the next card.
- **`BannerSlideshow`** — auto-rotating banners with **dots + prev/next arrows + drag-swipe** (Schweppes / Third Rush).
- **`BentoTile`** — adaptive: tall (`row-span-2`) tiles get a full-bleed hero image with gradient scrim + thumbnail peeks; short tiles stay compact.
- **`HScrollRow`** — inertia momentum + drag-to-scroll + wheel normalization.
- **`ProductHero3D`** — 3D rotating product (Signature South Indian Filter Blend, El Diablo Blend) with seamless image → 3D crossfade.

### Latest build sizes
- `dist/assets/index-*.js` ≈ 832 kB · gzip ≈ 238 kB
- `dist/assets/ProductHero3D-*.js` ≈ 1.04 MB · gzip ≈ 288 kB
- `dist/assets/index-*.css` ≈ 107 kB · gzip ≈ 16 kB

---

## Notable design / behaviour decisions

1. **Everything is a URL route** — TI, Checkout, Order Portal, Shop, Product Detail, Admin. Back/forward works; scroll position restores from `history.state`.
2. **AI responses are cached in Convex** keyed by SHA-256 of `{prompt, version}` — repeat inputs skip Mistral entirely.
3. **Product list is read once per session** from `sessionStorage`; **product images are served from GitHub Pages CDN**, not Convex file storage — zero Convex bandwidth on product browse.
4. **Two-tier taxonomy** with a legacy fallback (`resolveTaxonomy`) — old rows still render in sensible buckets while new admin entries use explicit fields. A one-shot migration (`migrations.ts → backfillTaxonomy`) retro-classified the 29 existing products.
5. **GalaxySweep palette is teal-grey / off-white only** — no pure black, opacity ≤ 0.55 at peak, single shared cubic `[0.32, 0.72, 0.28, 1]` easing across every layer.
6. **ChapterDeck morphs, doesn't flip** — opacity cross-fade with subtle scale + blur, no `rotateX` / `translateZ` / `perspective`. Spring-smoothed scroll progress drives the morph for weighty pacing.
7. **`BannerSlideshow` interaction** — dots, arrows, and drag-swipe coexist. Drag commits to next/prev only past 18 % of width or with flick velocity; auto-rotation pauses during drag/hover; arrows `stopPropagation` so a click never triggers a drag.

---

_Generated May 25 2026 from `git log` `8ee9b01..dc648e4`._
