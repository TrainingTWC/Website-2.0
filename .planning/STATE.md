---
milestone: v4.0
name: The Editorial Hub — Offers, News & Promotions
status: in-progress
progress:
  phases_total: 3
  phases_done: 0
---

# STATE.md

## Current Position

Milestone: v4.0 — The Editorial Hub — Offers, News & Promotions — **IN PROGRESS**
Phase: 0 of 3 phases started
Status: Planning complete — ready for Phase 1 execution
Last activity: 2026-05-15 — v4.0 milestone initialized

## Completed Phases

(none yet)

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
