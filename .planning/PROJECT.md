# BrewMatch AI — Third Wave Coffee

## What This Is

A kiosk and embedded widget experience branded as **Third Intelligence** — an AI-powered coffee recommendation engine for Third Wave Coffee (TWC). Customers answer 6 questions about their time, style, nature, work, flavor preference, and brew method; the AI matches them to the right product from the TWC catalog and explains why in a warm, knowledgeable voice.

## Core Value

Every customer leaves with a coffee recommendation that feels personally curated — not a filter result, but a thoughtful match delivered by something that seems to know them.

## Requirements

### Validated

- [x] Discovery Widget with 6-step question flow
- [x] Convex backend with product catalog (beans, bags, merch)
- [x] Mistral AI integration for recommendation generation (`MISTRAL_API_KEY`)
- [x] Session tracking (answers → recommendations → conversion)
- [x] Admin dashboard for product management
- [x] Product image optimization pipeline (WebP + LQIP)
- [x] Kiosk pipeline view (`KioskPipeline.tsx`)
- [x] 3D bestseller carousel and cinematic product pages
- [x] AI connectivity fixed (MISTRAL_API_KEY wired correctly) — v1.1
- [x] Brand context + 18 product personality profiles (`convex/productContext.ts`) — v1.1
- [x] Enhanced AI prompt with personality-aware recommendations — v1.1

### Active

- [ ] **CART-01 – CART-05**: Cart hook + Add to Cart + cart drawer + header badge
- [ ] **CHK-01 – CHK-04**: Guest checkout form (Name, Phone, Email, Address, Pincode)
- [ ] **ORD-01 – ORD-03**: Convex orders table, submitOrder mutation, confirmation screen
- [ ] **ADM-01 – ADM-03**: Admin dashboard Orders tab with order queue + detail view
- [ ] **PAY-01 – PAY-04**: Razorpay integration + webhook verification

### Out of Scope

- Multi-language support — not needed for current deployment
- Customer accounts / login — kiosk is anonymous by design
- Real-time inventory sync — stock status is manually managed

## Context

- **Brand:** Third Wave Coffee — Indian specialty coffee chain with deep roots in South Indian coffee culture
- **AI engine:** Mistral (`mistral-small-latest`), called via Convex `"use node"` action
- **Frontend:** React + Vite + Tailwind, deployed as a Convex app
- **Products:** 18 SKUs across coffee beans (9), cold brew bags (2), easy drip bags (4), merch (3)
- **Known issue:** ~~`GOOGLE_AI_API_KEY` env var name in code doesn't match `GEMINI_API_KEY` set in Convex~~ — resolved: provider switched to Mistral, env is `MISTRAL_API_KEY`

## Constraints

- **Runtime:** Convex Node.js actions — no filesystem, HTTP-only external calls
- **API:** Mistral chat completions via REST (`api.mistral.ai/v1/chat/completions`)
- **Env vars:** Must be set in Convex dashboard via `npx convex env set`, not `.env.local`
- **Response format:** Mistral must return JSON with `primaryProductIds`, `crossSellProductIds`, `explanation`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mistral over OpenAI | Indian market pricing, no VPN friction | ✓ Good |
| Convex for backend | Real-time product sync, built-in storage | ✓ Good |
| Widget-first architecture | Embeddable in any TWC POS / website | — Pending validation |
| Personalities as in-code constants | No DB round-trip, always consistent | — Pending |

## Current Milestone: v2.0 — Own eShop (No Shopify)

**Goal:** Build a fully self-hosted eShop within the existing React + Convex stack — cart, guest checkout, order capture, Razorpay payment, and admin order queue. Zero dependency on Shopify or any external eCommerce platform.

**Target features:**
- `useCart` hook with localStorage persistence
- "Add to Cart" on product cards and product detail pages
- Cart drawer (slide-in panel) with quantity controls
- Guest checkout form: Name, Phone, Email, Address, Pincode
- Convex `orders` table + `submitOrder` mutation
- Order confirmation screen with order number
- Admin dashboard Orders tab (order queue, detail view)
- Razorpay payment integration with server-side webhook verification

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-13 — Milestone v1.1 started*
