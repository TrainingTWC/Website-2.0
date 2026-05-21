---
milestone: v6.0
name: Performance & Fluidity Pass
status: planned
progress:
  phases_total: 1
  phases_done: 0
  plans_total: 6
  plans_done: 0
---

# STATE.md

## Current Position

Milestone: v6.0 — Performance & Fluidity Pass — **PLANNED**
Phase: 1 of 1 — Adaptive Performance & Fluidity (6 plans, 3 waves)
Status: Plans 01–06 written. Ready for `/gsd-execute-phase v6.0-phase-01-performance-fluidity`.
Last activity: 2026-05-22 — v6.0 planned (PERF-01..PERF-12)

## v6.0 Planning Decisions (see CONTEXT.md)

| Decision | Rationale |
|----------|-----------|
| Three perf tiers `low/mid/high`, default `mid` on SSR (D-01) | Avoids hydration flicker, keeps brand alive on mid-spec |
| Tier inputs: deviceMemory + hardwareConcurrency + reduced-motion + rAF refresh sample (D-02) | Cheap, well-supported, no fingerprinting concern |
| reduced-motion forces low tier (D-03) | Accessibility precedence |
| Drop synthetic `dispatchEvent(scroll)` in SmoothScroll.tsx (D-05) | Biggest single perf bug — re-fires every motion listener every frame |
| Consolidate Cinematic's per-chapter useScroll into ONE shared MotionValue (D-06) | Cuts N scroll listeners to 1 |
| BestsellerCarousel low-tier fallback is a flat scroll-snap strip (D-07) | Preserves shopping value without 3D |
| MagneticCursor only on high+fine-pointer (D-08) | Useless on touch, expensive on weak CPUs |
| LazyMotion + domAnimation at provider root (D-09) | Standard motion/react split, ships less initial JS |
| Web vitals via `web-vitals` library into Convex `webVitals` table (D-10) | RUM beats synthetic Lighthouse |
| All hero imagery through next/image (D-11) | LCP + CLS wins |
| Final gate is manual UAT on user's 8 GB laptop (D-12) | Spec IS the lived experience |

## Wave Structure (v6.0 Phase 1)

| Wave | Plans | Notes |
|------|-------|-------|
| 1 | 01 (perf-tier infra + vitals), 02 (Lenis fix), 05 (images + LazyMotion) | All three touch disjoint files; safe parallel |
| 2 | 03 (Cinematic consolidation), 04 (3D/effects tier gating) | Depend on perf-tier hook from 01 |
| 3 | 06 (manual UAT checkpoint) | Depends on everything |

## Completed Phases (v5.0)

- Phase 1 (Next.js Bootstrap + Build Pipeline) — ✅ shipped
- Phase 2 (Global State Providers + SSR Safety) — ✅ shipped
- Phase 3 (Route Migration + Cleanup) — ✅ shipped — `next build` exits 0, 11 static pages

## Completed Phases (v4.0)

- Phase 1 (Data Layer + Admin CMS) — ✅ shipped — commits `636fee7`, `2da7044`
- Phase 2 (Magazine Editorial Hub) — ✅ shipped — commit `7156db4`
- Phase 3 (Discount Cart Integration) — ✅ shipped — commit `621f1f3`

## v4.0 Audit Result: `tech_debt` (30/31 reqs, non-blocking)

- OFF-05 partial: firstOrderOnly validation exists but not invoked end-to-end
- `(api as any)` casts in EditorialCMS.tsx, EditorialHub.tsx, OrderConfirmation.tsx
- Cart not cleared immediately in onOrderCreated (cleared on "Continue Shopping")
- Archive: [.planning/milestones/v4.0-ROADMAP.md](.planning/milestones/v4.0-ROADMAP.md)

## Decisions This Milestone (v4.0)

| Decision | Rationale |
|----------|-----------|
| "Claim Offer" glassmorphism button (not silent auto-apply) | User intent is clear; confirmation toast prevents accidental claims |
| One active discount per cart session | Simplest UX; prevents stacking abuse |
| Discount validation server-side in Convex mutation | Security — never trust client-side discount math |
| Cover images stored in Convex Storage | Consistent with existing product image pattern |
| Magazine grid CSS (no new layout library) | Tailwind grid covers all needs; no extra bundle weight |
| Discount state in App.tsx (D-01), modify CartPanel.tsx (D-02) | Deferred useCart.ts refactor to Next.js migration |
| Server rejection → toast + auto-strip + re-submit (D-03) | "Order must go through" — discount is non-blocking |

## Previous Milestone (v3.0) — COMPLETE

- Phase 1 (Admin Sales Analytics) — ✅ shipped — commit `896e8d4`
- Phase 2 (GPS Address Autofill) — ✅ shipped — commit `32438bc`
- Phase 3 (Customer Order Portal + AI Chat) — ✅ shipped — commit `e27caf2`

## Previous Milestone (v1.1) — Complete

All 3 phases of v1.1 (Third Intelligence Context & Personality) were shipped 2026-05-13.

## Previous Milestone (v4.0) — COMPLETE 2026-05-20

30/31 requirements satisfied. Status: `tech_debt` (non-blocking). See [.planning/milestones/v4.0-ROADMAP.md](.planning/milestones/v4.0-ROADMAP.md)

## Blockers

(none)
