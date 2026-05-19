# Codebase Structure

<!-- refreshed: 2026-05-20 -->
**Analysis Date:** 2026-05-20

---

## Root

```
brewmatch-ai/
├── index.html              # SPA shell; single <div id="root">; preconnect to Convex
├── vite.config.ts          # Vite build config; base="/brewmatch-ai/"; path alias @→root
├── tsconfig.json           # TypeScript project config (references convex/tsconfig.json)
├── package.json            # Dependencies: React 19, Convex, Framer Motion, Three.js
├── convex.json             # Convex project config (project name, team)
├── metadata.json           # App metadata (name, description)
├── AGENTS.md               # Convex AI guidelines pointer
├── CLAUDE.md               # Claude-specific project notes
├── CHANGELOG.md            # Version history
├── skills-lock.json        # GSD agent skills lockfile
├── src/                    # Frontend application source
├── convex/                 # Convex backend (functions, schema, auth)
├── public/                 # Static assets served under base path
├── scripts/                # Build-time utility scripts (not bundled)
└── .planning/              # GSD planning artifacts (not shipped)
```

---

## src/

```
src/
├── main.tsx                # Entry point: mounts React root, wraps with ConvexAuthProvider
├── App.tsx                 # Root component: query-param router + Storefront + admin gates
├── types.ts                # Shared TypeScript types: Product, Session, Rule, RecommendationResult
├── index.css               # Global Tailwind CSS + custom properties (colors, fonts)
├── vite-env.d.ts           # Vite env type declarations (VITE_CONVEX_URL etc.)
│
├── components/             # UI components
│   ├── BannerSlideshow.tsx         # Auto-playing partner/promo banner carousel
│   ├── BestsellerCarousel3D.tsx    # 3D rotating product carousel (Three.js or CSS 3D)
│   ├── BrewingStudio.tsx           # Interactive brew method selector section
│   ├── CartPanel.tsx               # Slide-over cart drawer (open/close state in App.tsx)
│   ├── CheckoutPage.tsx            # Full checkout form (customer details, address, payment)
│   ├── Cinematic.tsx               # CinematicHero, CurtainTransition, ChapterDeck exports
│   ├── CountdownTimer.tsx          # Flash sale / event countdown display
│   ├── DataBanner.tsx              # Animated stats/data display banner
│   ├── EditorialHub.tsx            # "Third Circle" journal listing page
│   ├── GalaxySweep.tsx             # Full-screen animation overlay (TI widget opener)
│   ├── LoadingScreen.tsx           # Full-screen loading gate (hides until criticalReady)
│   ├── MagneticCursor.tsx          # Custom cursor with magnetic attraction to elements
│   ├── OrderConfirmation.tsx       # Post-checkout order success page
│   ├── OrderPortal.tsx             # Customer order lookup / tracking portal
│   ├── PersonalitySection.tsx      # Homepage personality/brand story section
│   ├── PostDetail.tsx              # Single editorial post view
│   ├── ProductHero3D.tsx           # Product page hero with optional 3D model viewer
│   ├── ProductPage.tsx             # Full product detail page (?product=<slug>)
│   ├── ShopPage.tsx                # Filterable product catalog (?page=shop)
│   ├── SipForecast.tsx             # "Coffee mood forecast" interactive section
│   ├── SiteFooter.tsx              # Global footer with nav links
│   ├── SmartImage.tsx              # Image component with blur placeholder + lazy load
│   ├── SmoothScroll.tsx            # Lenis smooth scroll provider (wraps children)
│   ├── TIIcon.tsx                  # Third Intelligence logo/icon SVG component
│   │
│   ├── admin/                      # Admin panel (auth-gated, ?panel=merchant/superadmin)
│   │   ├── AdminAuthGate.tsx       # Auth wrapper: renders login or admin shell
│   │   ├── AdminDashboard.tsx      # Merchant-level dashboard shell + tab router
│   │   ├── AdminLogin.tsx          # Email+password login form (uses Convex auth)
│   │   ├── AdminShell.tsx          # Admin layout wrapper (sidebar, header)
│   │   ├── DashboardOverview.tsx   # Overview metrics for admin home tab
│   │   ├── EditorialCMS.tsx        # Post editor and publish controls
│   │   ├── HomeContentCMS.tsx      # Hero/banner/chapter CMS editor
│   │   ├── ImagePicker.tsx         # Convex storage image upload + picker
│   │   ├── SalesAnalytics.tsx      # Orders and revenue analytics charts
│   │   ├── SuperAdminDashboard.tsx # Superadmin shell (includes admin management)
│   │   └── VisitorMap.tsx          # Geo heatmap of pageView data
│   │
│   └── widget/                     # Third Intelligence AI discovery widget
│       ├── DiscoveryWidget.tsx     # Full-screen quiz + results UI (?page=ti)
│       └── KioskPipeline.tsx       # Animated AI decision visualization (INGEST→REVEAL)
│
└── lib/                    # Shared hooks and utilities
    ├── asset.ts            # asset(path): resolves paths against Vite BASE_URL
    ├── slug.ts             # slugify(name): product name → URL-safe slug
    ├── useGeoAddress.ts    # Hook: resolves GPS or IP geo to address string
    ├── useProducts.ts      # useProducts(): sessionStorage-cached product list hook
    ├── useSiteContent.ts   # useBannerSlides/useHeroContent/useSectionsContent/useChapters hooks
    └── useStoryContent.ts  # useStoryContent(): brand story CMS hook
```

---

## convex/

All files in this directory run on **Convex cloud** (not in the browser).

```
convex/
├── schema.ts               # Database schema: all table definitions and indexes
├── auth.ts                 # Convex Auth setup: Password provider; exports signIn/signOut
├── auth.config.ts          # Auth provider config: domain = CONVEX_SITE_URL
├── http.ts                 # HTTP router: mounts auth.addHttpRoutes (handles /api/auth/*)
│
├── products.ts             # CRUD: list, listByType, getById, add, update, remove, generateUploadUrl
├── orders.ts               # submitOrder mutation, order status queries, admin order management
├── posts.ts                # Editorial post CRUD: list, get, publish, schedule, expire
├── sessions.ts             # Recommendation sessions: create, update, mark converted
├── recommendations.ts      # AI action (Node.js): Mistral API call, caching, ID resolution
├── productContext.ts       # AI prompt data: BRAND_CONTEXT string, buildPersonalitiesBlock()
├── cache.ts                # Internal query+mutation for aiCache table (get/set by SHA-256 key)
│
├── siteContent.ts          # CMS key-value store: get/set by string key (hero, banners, chapters)
├── categories.ts           # Custom product category management
├── discounts.ts            # Discount code validation and redemption
├── admins.ts               # Admin user management: roles (superadmin/admin/editor/viewer), permissions
├── authAdmin.ts            # Admin-specific auth helpers (bootstrap user on first login)
├── analytics.ts            # Analytics queries for admin dashboard (orders, revenue, trends)
├── pageViews.ts            # pageViews.record mutation + pageViews.updateDuration
├── support.ts              # Customer support / notes on orders
├── migrations.ts           # Data migration scripts (run manually or via admin)
├── dangerZone.ts           # Destructive admin operations (bulk delete, reset, etc.)
├── seed.ts                 # Development seed data loader
│
└── _generated/             # AUTO-GENERATED — never edit manually
    ├── api.d.ts            # Typed API surface (all query/mutation/action names)
    ├── api.js              # Runtime API object
    ├── dataModel.d.ts      # TypeScript types derived from schema.ts
    ├── server.d.ts         # Server-side type helpers
    ├── server.js           # Server-side runtime helpers
    └── ai/
        ├── guidelines.md   # Convex AI coding guidelines (always read before editing convex/)
        └── ai-files.state.json  # Convex AI files version state
```

---

## public/

Static files served under the `/brewmatch-ai/` base path. Referenced via `asset()` helper.

```
public/
├── favicon.png             # Browser tab icon
├── banner-schweppes.png    # Partner banner image (Schweppes collab)
├── banner-third-rush.jpg   # Partner banner image (Third Rush Desserts)
├── [product images]        # Product photos (various PNG/JPEG)
│
├── assets/                 # General static assets
│   └── [fonts, icons, misc]
│
├── models/                 # 3D model files for ProductHero3D
│   └── *.glb / *.gltf      # Three.js-compatible 3D models
│
└── optimized/              # Pre-optimized image variants (generated by scripts/optimizeImages.ts)
    └── manifest.json       # Map of original filename → optimized paths + blur placeholder
```

---

## scripts/

Build-time utility scripts. Run via `npx tsx scripts/<name>.ts`. NOT bundled into the app.

```
scripts/
├── buildFavicon.ts         # Generates favicon.png from source SVG
├── optimizeImages.ts       # Resizes and compresses public/ images; writes optimized/manifest.json
├── seedToConvex.ts         # Pushes seed data from local JSON to Convex dev deployment
└── stripIconBackground.ts  # Removes white background from icon images
```

---

## .planning/

GSD planning artifacts. Not shipped or committed to production branches.

```
.planning/
├── codebase/               # THIS directory — codebase map documents
│   ├── ARCHITECTURE.md     # System design and data flow
│   └── STRUCTURE.md        # This file
└── [phases/, milestones/]  # Phase plans, roadmap, session notes
```

---

## Key Entry Points

### `index.html`
The SPA shell. Contains a single `<div id="root">`. Includes:
- `<link rel="preconnect">` to the Convex cloud domain (performance)
- `<script type="module" src="/src/main.tsx">` — Vite entry point
- Meta tags: description, viewport, favicon

### `src/main.tsx`
React application bootstrap:
1. Creates `ConvexReactClient` from `VITE_CONVEX_URL`
2. Wraps app in `<ConvexAuthProvider client={convex}>` (provides auth state to all components)
3. Renders `<App />` into `#root` with `StrictMode`

### `src/App.tsx`
The entire routing layer. Key responsibilities:
- Reads URL query params via `useUrlQuery()` hook
- Renders admin gates for `?panel=*`
- Wraps storefront in `<SmoothScroll>` (Lenis)
- `Storefront` component: owns all cart state, page view tracking, route switching via `if/return` guards
- `navigateTo(params)`: the single navigation function used everywhere (wraps `history.pushState`)

### `src/types.ts`
Shared TypeScript interfaces:
- `Product` — matches `convex/schema.ts` products table exactly
- `Session`, `Rule` — for recommendation system
- `RecommendationResult` — return type of `getRecommendation` action
- `ProductType`, `RoastLevel`, `StockStatus`, `MainCategory`, `SubCategory` enums
- `resolveTaxonomy(p)` — derives `(mainCategory, subCategory)` from legacy `type` field

---

## Naming Conventions

**Files:**
- React components: PascalCase (`ProductPage.tsx`, `CartPanel.tsx`)
- Hooks and utilities: camelCase (`useProducts.ts`, `asset.ts`, `slug.ts`)
- Convex backend files: camelCase (`products.ts`, `recommendations.ts`)

**Directories:**
- `src/components/admin/` — admin-only components
- `src/components/widget/` — TI (Third Intelligence) widget components
- `src/lib/` — hooks and pure utility functions only (no JSX)
- `convex/` — all backend code (flat, no subdirectories except `_generated/`)

---

## Where to Add New Code

### New customer-facing page/route
1. Create component in `src/components/<PageName>.tsx`
2. Add a new `if (page === "<key>") return <PageName />` guard in `App.tsx` inside `Storefront`
3. Add `?page=<key>` navigation calls via `navigateTo({ page: "<key>" })`
4. **Next.js:** create `app/<key>/page.tsx` instead

### New Convex backend query or mutation
1. Add to the relevant existing file in `convex/` (e.g., new product query → `convex/products.ts`)
2. If truly new domain, create `convex/<domain>.ts`
3. Run `npx convex dev` to regenerate `convex/_generated/`
4. Import via `import { api } from "../convex/_generated/api"` in frontend

### New admin panel section
1. Create `src/components/admin/<SectionName>.tsx`
2. Add tab entry in `src/components/admin/AdminDashboard.tsx` or `SuperAdminDashboard.tsx`
3. Add permission check via `me.admin.permissions.<key>` pattern (see `convex/admins.ts`)

### New CMS-editable content section
1. Add hook in `src/lib/useSiteContent.ts` (follow `useBannerSlides` pattern)
2. Add editor UI in `src/components/admin/HomeContentCMS.tsx`
3. Use `siteContent.set` mutation with a new string key

### New shared utility or hook
1. Add to `src/lib/<name>.ts`
2. No JSX — pure logic only; import from React/Convex as needed

### New static asset
1. Place in `public/` (or `public/assets/` for non-image assets)
2. Reference via `asset("filename.ext")` from `src/lib/asset.ts`
3. For product images: run `npx tsx scripts/optimizeImages.ts` to generate optimized variants

---

## Special Directories

**`convex/_generated/`:**
- Purpose: TypeScript types and runtime objects auto-generated from schema + function signatures
- Generated: Yes (by `npx convex dev` or `npx convex codegen`)
- Committed: Yes (required for TypeScript to resolve `api.*` types)
- **Never edit manually**

**`public/optimized/`:**
- Purpose: Pre-processed image variants generated by `scripts/optimizeImages.ts`
- Generated: Yes (run manually)
- Committed: Yes
- `manifest.json` maps original filenames to optimized paths + base64 blur placeholders

**`.planning/`:**
- Purpose: GSD planning system artifacts (roadmaps, phase plans, codebase maps)
- Generated: No (human + AI authored)
- Committed: Yes (to main branch, alongside code)

---

*Structure analysis: 2026-05-20*
