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

- [ ] Next milestone to be planned (v5.0)

### Completed (v4.0 — The Editorial Hub)

- [x] `posts` Convex table + 5 content types (flash-sale, product-launch, café-news, brand-story, champion)
- [x] `discounts` Convex table with validateDiscount + claimDiscount
- [x] Admin "Editorial" tab: create/edit/publish posts, manage discounts, champions
- [x] EditorialHub magazine page: asymmetric grid, category filters, countdown timers
- [x] Glassmorphism "Claim Offer" → applies single discount to cart
- [x] CartPanel: discount pill, strike-through subtotal, savings line
- [x] CheckoutPage: discount line in summary, server re-validation, D-03 toast+retry
- [x] OrderConfirmation: green savings card
- [x] Server-side discount validation in submitOrder (discountApplied stored on orders)

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

## Current Milestone: v5.0 — Next.js Migration

**Goal:** Migrate the React/Vite SPA to Next.js 15 App Router with `output: 'export'` for static GitHub Pages + Cloudflare deployment. Replace `?page=` query-param routing with file-based routes, extract App.tsx mega-state into providers, wrap SSR-incompatible components.

**Target features:**
- Next.js 15 App Router + TypeScript + Tailwind v4 via postcss
- `output: 'export'` static build → GitHub Pages (`./out` dir)
- CartProvider, DiscountProvider, ToastProvider, CartPanelProvider at root
- SSR-safe dynamic() wraps for Three.js, Leaflet, Lenis, MagneticCursor
- 8 file-based routes replacing `?page=` switch in App.tsx
- App.tsx retired

**Locked decisions:**
- GitHub Pages + Cloudflare (no Vercel, no SSR)
- Razorpay deferred to v6.0

**Shipped milestones:**
- v1.1 — Third Intelligence Context & Personality (2026-05-13)
- v2.0 — Cart + Checkout + Orders (2026-05-15)
- v3.0 — Admin Analytics + GPS + Order Portal (2026-05-15)
- v4.0 — The Editorial Hub (2026-05-20) — [archive](.planning/milestones/v4.0-ROADMAP.md)

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
