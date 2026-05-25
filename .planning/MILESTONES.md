# Milestones

## v1.0 — Initial Build (shipped)

**Goal:** Build a working AI-powered coffee recommendation kiosk and widget for Third Wave Coffee.

**Shipped:**
- Discovery Widget with 6-question flow
- Convex backend with full product catalog (18 SKUs)
- Mistral AI integration (now wired correctly via `MISTRAL_API_KEY`)
- Session tracking
- Admin dashboard
- Product image optimization pipeline (WebP + LQIP blur placeholders)
- Cinematic product pages and 3D bestseller carousel
- Kiosk pipeline UI

**Status:** Functionally complete except AI recommendations failing due to env var mismatch.

---
*v1.0 completed: 2026-05-13*

## v8.0 — CRM & Order Fulfillment (in planning)

**Goal:** Make every order from add-to-cart to delivered (or refunded) observable, recoverable, and tied to a real customer record we own.

**Scope (3 phases):**
- Phase 1 — CRM Data Foundation (customers, addresses, events, segmentation)
- Phase 2 — Order Lifecycle Hardening (draft→reservation→payment→fulfillment state machine, returns, refunds, Razorpay webhook)
- Phase 3 — Comms & Observability (notifications, abandoned-cart recovery, ops dashboard, metrics)

**Artifacts:**
- `.planning/milestones/v8.0-REQUIREMENTS.md` — 35 requirements across 3 pillars
- `.planning/milestones/v8.0-FAILURE-MODES.md` — exhaustive catalog of every failure mode in the flow with mitigations
- `.planning/milestones/v8.0-DATA-CAPTURE.md` — event schema, derived metrics, retention policy
- `.planning/milestones/v8.0-ANALYTICS-CATALOG.md` — 122 behavioural data points + 20 derived friction metrics (dropouts, abandonment, friction, point-of-dropout)
- `.planning/milestones/v8.0-ROADMAP.md` — phase breakdown with success criteria and threat models

**Status:** Requirements + roadmap drafted 2026-05-25 — awaiting stakeholder review before `/gsd-plan-phase 1`.

**Validation gate:** See "Validation Gate Before Phase 1 Begins" in `v8.0-ROADMAP.md` — pincode data source, notification providers, Razorpay webhook secret, and `submitOrder` deprecation decision must be locked before planning starts.
