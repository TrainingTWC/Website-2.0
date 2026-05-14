---
milestone: v2.0
name: Own eShop (No Shopify)
status: ready
progress:
  phases_total: 3
  phases_done: 0
---

# STATE.md

## Current Position

Phase: Not started — ready to begin Phase 1
Plan: Run `/gsd-plan-phase 1` to generate the execution plan
Status: Planning complete, implementation pending
Last activity: 2026-05-14 — v2.0 milestone initialized (eShop)

## Todos

- [ ] Execute Phase 1 — Cart + Checkout UI
- [ ] Execute Phase 2 — Order Backend + Confirmation
- [ ] Execute Phase 3 — Razorpay Payment Integration

## Decisions This Milestone

| Decision | Rationale |
|----------|-----------|
| localStorage cart (not Convex) | No auth needed, no server round-trip for cart state; simpler and faster |
| Guest checkout only | Kiosk/web-shop hybrid audience; friction reduction > account benefits |
| Razorpay over Stripe | Dominant Indian gateway; UPI + cards + net banking + wallets in one modal |
| Convex HTTP action for webhook | Keeps everything in one backend; no separate Node server |
| Orders in Phase 2, payment in Phase 3 | Ship order capture fast; Razorpay needs KEY_ID/KEY_SECRET configured first |

## Previous Milestone (v1.1) — Complete

All 3 phases of v1.1 (Third Intelligence Context & Personality) were shipped 2026-05-13.
AI connectivity, brand context, product personalities, and enhanced prompt are live.

## Blockers

(none)
