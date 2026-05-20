---
milestone: v5.0
name: Next.js Migration
status: planning
progress:
  phases_total: 3
  phases_done: 0
---

# STATE.md

## Current Position

Milestone: v5.0 — Next.js Migration — **IN PROGRESS**
Phase: 1 of 3 (plans created, ready to execute)
Status: Phase 1 plans created — execute with `/gsd-execute-phase 1`
Last activity: 2026-05-20 — Phase 1 plans written (01-01, 01-02)

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
