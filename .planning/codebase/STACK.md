# Tech Stack

**Analysis Date:** 2026-05-20

## Runtime & Build

- **Runtime:** Node.js (Convex actions via `"use node";`), V8 (default Convex runtime for queries/mutations)
- **Package Manager:** npm (lockfile: `package-lock.json`)
- **Build Tool:** Vite 6.2 (`vite.config.ts`)
- **Module System:** ESM (`"type": "module"` in `package.json`)
- **Base URL:** `/brewmatch-ai/` — configured in `vite.config.ts` for GitHub Pages deployment
- **Scripts runner:** `tsx 4.21` — used for utility scripts in `scripts/`

## Frontend Framework

- **React 19.0.1** with **TypeScript 5.8** — SPA, entry at `src/main.tsx`
- **JSX transform:** `react-jsx` (no explicit React import needed)
- **TypeScript target:** ES2022 (`tsconfig.json`)

## State Management

- No dedicated state library (no Redux, Zustand, Jotai)
- **Convex reactive queries** (`useQuery`, `useMutation` from `convex/react`) drive all server state
- Local UI state via React `useState`
- Product list cached in `sessionStorage` — see `src/lib/useProducts.ts`
- Geo address cached in `localStorage` — see `src/lib/useGeoAddress.ts`
- Routing: **custom SPA router** using `window.history.pushState` + `URLSearchParams` — NO React Router or similar library

## Styling

- **Tailwind CSS v4.1** — via the new Vite-native plugin (`@tailwindcss/vite`), **not** PostCSS config
- **Autoprefixer** in devDependencies (likely transitional — Tailwind v4 handles most prefixing)
- No CSS Modules, no styled-components, no Sass
- Global styles: `src/index.css`

## Animation & 3D

- **Motion (Framer Motion) 12.23** (`motion/react`) — scroll-driven animations, page transitions, spring physics
- **Three.js 0.184** + **@react-three/fiber 9.6** + **@react-three/drei 10.7** — 3D product viewer (`src/components/ProductHero3D.tsx`, `src/components/BrewingStudio.tsx`)
- **Lenis 1.3** — inertia/smooth scroll, exposed as `window.__lenis` for imperative access (`src/components/SmoothScroll.tsx`)

## Maps

- **Leaflet 1.9** + **react-leaflet 5.0** — visitor analytics map in admin (`src/components/admin/VisitorMap.tsx`)
- Tile source: OpenStreetMap `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`

## Other Frontend Libraries

- **Lucide React 0.546** — icon system
- **react-markdown 10.1** — renders markdown editorial content

## Backend

- **Convex 1.38** — full-stack BaaS: database (document), server functions (queries, mutations, actions), file storage, HTTP router
- **Convex project:** `twc-website` (team: `amritanshu`, prod URL: `https://different-bulldog-772.convex.cloud`) — see `convex.json`
- Backend TypeScript target: ESNext (`convex/tsconfig.json`)
- HTTP router: `convex/http.ts` (only used to mount auth routes)
- AI response cache: `convex/cache.ts` (SHA-256 keyed, stored in `aiCache` Convex table)

## Auth

- **@convex-dev/auth 0.0.92** + **@auth/core 0.37.4**
- Provider: **Password only** (`convex/auth.ts` — `Password` from `@convex-dev/auth/providers/Password`)
- JWT domain: `CONVEX_SITE_URL` env var (`convex/auth.config.ts`)
- Client: `ConvexAuthProvider` wraps app root in `src/main.tsx`
- Admin role system: superadmin / admin / editor / viewer — managed in `convex/admins.ts`

## Dev Tooling

- `typescript ~5.8.2` — type checker (`npm run lint` = `tsc --noEmit`)
- `sharp 0.34.5` — image optimization scripts (`scripts/optimizeImages.ts`)
- `tsx 4.21` — run `.ts` scripts directly (e.g. `scripts/seedToConvex.ts`)
- `@types/node 22.14`, `@types/three 0.184.1`, `@types/leaflet 1.9.21`
- **No test framework** — no Jest, Vitest, or Playwright in dependencies
- `get-shit-done-cc 1.41.2` — GSD project management CLI (dev tooling, not app code)

## Key Config Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite build config, base URL, path alias `@/` → project root |
| `tsconfig.json` | Frontend TypeScript config (ES2022, bundler resolution) |
| `convex/tsconfig.json` | Convex backend TypeScript config (ESNext, strict) |
| `convex.json` | Convex project identity (team, project name, prod URL) |
| `.env.example` | Documents required env vars |
| `package.json` | All dependencies and scripts |

## Environment Variables

| Variable | Where Set | Purpose |
|----------|-----------|---------|
| `VITE_CONVEX_URL` | `.env.local` | Convex deployment URL for frontend client |
| `MISTRAL_API_KEY` | Convex dashboard env vars | Mistral AI API key (server-side only) |
| `CONVEX_SITE_URL` | Convex dashboard env vars | JWT issuer domain for auth |

---

## Next.js Migration Notes

| Current (Vite/SPA) | Next.js Equivalent | Notes |
|-------------------|--------------------|-------|
| `vite.config.ts` with `base: "/brewmatch-ai/"` | `next.config.ts` with `basePath: '/brewmatch-ai'` | Also remove `@tailwindcss/vite` plugin |
| `@tailwindcss/vite` plugin | Standard PostCSS setup (`tailwind.config.ts` + `postcss.config.mjs`) | Tailwind v4 PostCSS works the same |
| `import.meta.env.VITE_CONVEX_URL` | `process.env.NEXT_PUBLIC_CONVEX_URL` | Rename all `VITE_*` vars to `NEXT_PUBLIC_*` |
| `import.meta.env.BASE_URL` | `process.env.NEXT_PUBLIC_BASE_PATH` or Next.js asset prefix | Used for banner image URLs |
| `src/main.tsx` root render + `ConvexReactClient` instantiation | Root layout (`app/layout.tsx`) with a `'use client'` provider component | ConvexAuthProvider must be in a client component |
| Custom `pushState` SPA router | `useRouter`, `useSearchParams`, `usePathname` from `next/navigation` | All route logic in `src/App.tsx` must be rewritten |
| Three.js / R3F components | Add `'use client'` directive — works unchanged | `ProductHero3D.tsx`, `BrewingStudio.tsx`, `BestsellerCarousel3D.tsx` |
| `Lenis` smooth scroll (`SmoothScroll.tsx`) | Add `'use client'` + move to layout — works unchanged | |
| Motion (Framer Motion) | Add `'use client'` to any component using `motion.*` — works unchanged | |
| `sessionStorage`/`localStorage` in hooks | Must be inside `useEffect` or guarded with `typeof window !== 'undefined'` (already partially done) | `useProducts.ts`, `useGeoAddress.ts` |
| Leaflet (`VisitorMap.tsx`) | Requires `'use client'` + dynamic import with `ssr: false` | Leaflet uses `window` at import time |
| Convex backend | **No change** — Convex is framework-agnostic | Only the client setup changes |
| `@convex-dev/auth` | Works with Next.js — follow `@convex-dev/auth` Next.js guide | Need to add Next.js middleware for server-side auth |
| No SSR currently | Next.js enables SSR/SSG — Convex queries can only run client-side | All Convex `useQuery` hooks stay client-side (`'use client'`) |

*Stack analysis: 2026-05-20*
