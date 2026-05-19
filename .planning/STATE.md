---
milestone: v4.0
name: The Editorial Hub — Offers, News & Promotions
status: complete
progress:
  phases_total: 3
  phases_done: 3
---

# STATE.md

## Current Position

Milestone: v4.0 — The Editorial Hub — Offers, News & Promotions — **COMPLETE**
Phase: 3 of 3 phases complete
Status: Phase 3 (Discount Cart Integration) shipped — milestone complete
Last activity: 2026-05-20 — Phase 3 execution complete (commit 621f1f3)

## Completed Phases

- Phase 1 (Data Layer + Admin CMS) — ✅ shipped — commits `636fee7`, `2da7044`
- Phase 2 (Magazine Editorial Hub) — ✅ shipped — commit `7156db4`
- Phase 3 (Discount Cart Integration) — ✅ shipped — commit `621f1f3`

## Decisions This Milestone

| Decision | Rationale |
|----------|-----------|
| "Claim Offer" glassmorphism button (not silent auto-apply) | User intent is clear; confirmation toast prevents accidental claims |
| One active discount per cart session | Simplest UX; prevents stacking abuse |
| Discount validation server-side in Convex mutation | Security — never trust client-side discount math |
| Cover images stored in Convex Storage | Consistent with existing product image pattern |
| Magazine grid CSS (no new layout library) | Tailwind grid covers all needs; no extra bundle weight |

## Previous Milestone (v3.0) — COMPLETE

- Phase 1 (Admin Sales Analytics) — ✅ shipped — commit `896e8d4`
- Phase 2 (GPS Address Autofill) — ✅ shipped — commit `32438bc`
- Phase 3 (Customer Order Portal + AI Chat) — ✅ shipped — commit `e27caf2`

## Previous Milestone (v1.1) — Complete

All 3 phases of v1.1 (Third Intelligence Context & Personality) were shipped 2026-05-13.

## Blockers

(none)
