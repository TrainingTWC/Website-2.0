# Phase 01-02 Summary — app/ Skeleton + Deploy Pipeline + Build Verified

**Commit:** 156c849  
**Date:** 2026-05-20  
**Status:** ✅ Complete — `next build` exits 0, `out/index.html` exists

## What Was Done

### Task 1: app/providers.tsx
- `"use client"` component
- `ConvexReactClient` initialized from `process.env.NEXT_PUBLIC_CONVEX_URL`
- `ConvexAuthProvider` wraps children

### Task 2: app/layout.tsx + app/page.tsx
- **`app/layout.tsx`**: Root server layout. Exports `metadata` (title, description, favicon) and `viewport` (maximumScale=1, userScalable=false). Imports `../src/index.css`. Wraps in `<Providers>`. Preconnects to `https://different-bulldog-772.convex.cloud`.
- **`app/page.tsx`**: Bridge — `dynamic(() => import('../src/App'), { ssr: false })`. Entire SPA rendered client-side.

### Task 3: deploy.yml + Build Verify
- `VITE_CONVEX_URL` env var → `NEXT_PUBLIC_CONVEX_URL` (GitHub secret name unchanged)
- `path: './dist'` → `path: './out'`
- Node version 20 → 22
- `npm run build` exits 0 with 4 static pages generated

### Incidental Fixes (src/ compat for Next.js)
- `src/lib/asset.ts`: Removed `import.meta.env.BASE_URL` — replaced with literal `/` (custom domain, no sub-path)
- `src/App.tsx`: Replaced two `import.meta.env.BASE_URL` inline uses + removed invalid `locality` property ref + fixed `AnimatePresence mode="crossfade"` → `"wait"`

## Build Output
```
Route (app)            Size     First Load JS
/ (static)             1.28 kB  105 kB
/_not-found            993 B    104 kB
out/index.html ✅
public/CNAME preserved ✅
```

## Requirements Addressed
- MIG-04: ConvexReactClient + ConvexAuthProvider in app/ ✅
- MIG-05: Root layout with metadata ✅
- MIG-06: App bridge via dynamic(ssr: false) ✅
- MIG-07: Deploy pipeline updated, build verified ✅
