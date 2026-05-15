# Phase 02 — Magazine Editorial Hub: Summary

**Commit:** 7156db4
**Status:** COMPLETE

## What Was Built

### CountdownTimer.tsx
- Reusable countdown component for flash-sale expiry
- Displays `HH:MM:SS` or `Xd Xh Xm` format, updates every second
- Shows "Sale ended" when expired, cleans up interval on unmount

### EditorialHub.tsx
- Public-facing magazine page at `?page=editorial`
- Category filter pills: All, Offers, News, Stories, Champions
- Magazine grid with 12-column layout (every 3rd card spans 8 cols)
- `ClaimOfferButton`: validates → calls `claimDiscount` → stores `twc_active_discount` in localStorage
- `HeroSection`: first published post as full-bleed 55-65vh hero
- Champions band: horizontal scroll row below the grid
- Uses `api as any` cast for forward-compatibility with Convex type gen

### PostDetail.tsx
- Full post view at `?page=editorial&post=<id>`
- Full-bleed 50-60vh cover header with back button overlay
- Renders body with `split("\n")` to preserve line breaks
- Champion fields: person card in rose-tinted box
- Flash-sale: CountdownTimer + conditional "Sale ended" guard
- Product-launch: "Shop Now →" button → `onProductClick`

### App.tsx wiring
- Added `EditorialHub` + `PostDetail` imports
- `?page=editorial` route: renders PostDetail if `?post=<id>` param present, else EditorialHub
- `handleNavTo` updated: "editorial" target routes to `?page=editorial` instead of scrolling
- `NAV_ITEMS` extended with Journal entry (key: "editorial", Icon: BookOpen)

### SiteFooter.tsx
- Added "Journal" link under Company section → `onNavigate("editorial")`

## Key Decisions
- Used `api as any` (not dynamic import) for Convex module access
- `navigateTo({ page: "editorial", post: id })` for post deep-links
- `twc_active_discount` localStorage key for cross-component discount state
- No CartPanel shown on editorial route (keeps it clean, cart accessible from main nav)
