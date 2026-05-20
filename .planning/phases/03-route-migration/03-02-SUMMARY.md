# Phase 03-02 Summary: Dynamic Routes + MorphingHeader Extraction

## Status: COMPLETE

## What Was Built

### MorphingHeader Extraction
- `src/components/MorphingHeader.tsx` — Extracted from App.tsx lines 842-1086
  - Exports: `MorphingHeader` (default-ish), `useActiveSection`, `NAV_ITEMS` (named)
  - Props: `headerBg, headerBorder, headerShadow, onOpenTI, onOpenCart, onNavTo, cartCount, activeOverride`

### Dynamic Routes
- `app/products/[slug]/page.tsx` — Server component; `generateStaticParams` fetches product IDs from Convex HTTP API (`products:list`); fallback `[{ slug: "_" }]` for build-time safety
- `app/products/[slug]/ProductClient.tsx` — Client component; renders ProductPage + SiteFooter; `onAddToCart → addToCart + openCart`
- `app/journal/page.tsx` — Journal/editorial hub; MorphingHeader with `activeOverride="editorial"`; post click → `/journal/[id]`; product click → `/products/[id]`
- `app/journal/[id]/page.tsx` — Server component; `generateStaticParams` fetches post IDs from Convex (`posts:listPublished`); fallback `[{ id: "_" }]`
- `app/journal/[id]/PostDetailClient.tsx` — Client component; renders MorphingHeader + PostDetail + SiteFooter; `onBack → /journal`

## Key Decisions

- `NAV_ITEMS` exported as named export (MobileBottomNav in HomeContent needs it)
- `generateStaticParams` fallback changed from `[]` to `[{ slug: "_" }]` / `[{ id: "_" }]` — empty array causes `output: export` build failure in Next.js 15
- `app/providers.tsx` updated: `NEXT_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.cloud"` to survive build-time prerender without env var

## Verification
- All routes appear in `npm run build` output
- `✓ Generating static pages (11/11)` passes
