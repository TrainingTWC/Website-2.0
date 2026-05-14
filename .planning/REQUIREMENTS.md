# Requirements: BrewMatch AI — Third Wave Coffee

**Defined:** 2026-05-13
**Core Value:** Every customer leaves with a recommendation that feels personally curated, not a filter result.

## v1.1 Requirements

Requirements for Milestone v1.1 — Third Intelligence Context & Personality.

### AI Connectivity

- [ ] **AI-01**: Mistral API key is read from the correct Convex env variable (`MISTRAL_API_KEY`) so recommendations no longer error on every request
- [ ] **AI-02**: AI response parsing handles malformed or empty Mistral responses without surfacing a raw error to the user

### Brand Context

- [ ] **CTX-01**: A context document exists in the codebase that encodes TWC's brand story, mission, and specialty coffee philosophy
- [ ] **CTX-02**: The context document defines a consistent "Third Intelligence voice" — crisp, confident, knowledgeable, no generic chatbot phrasing
- [ ] **CTX-03**: The AI prompt injects this brand context so every explanation reads as if written by an expert TWC barista

### Product Personalities

- [ ] **PROD-01**: Every coffee bean product (9 SKUs) has a full character profile: archetype, voice tone, ideal customer, mood, brewing ritual, and a one-line personality tagline
- [ ] **PROD-02**: Every cold brew bag product (2 SKUs) has a full character profile
- [ ] **PROD-03**: Every easy coffee bag product (4 SKUs) has a full character profile
- [ ] **PROD-04**: Merch products (3 SKUs) have a brief personality note linking them to their gifting/lifestyle context
- [ ] **PROD-05**: Personality profiles are co-located with product data in a single `convex/productContext.ts` file — one source of truth

### AI Prompt Enhancement

- [ ] **PROMPT-01**: The AI prompt includes the brand voice directive so Mistral writes in TWC's voice, not a generic assistant voice
- [ ] **PROMPT-02**: The AI prompt includes personality profiles for all products so Mistral can reference them when writing match explanations
- [ ] **PROMPT-03**: Match explanations are specific (flavor notes, brewing suggestion, archetype connection) — not generic ("this is a great coffee for you")
- [ ] **PROMPT-04**: Cross-sell logic is informed by personality compatibility (e.g., El Diablo + Tiger Mug make sense together)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Personality data stored in Convex DB | Personalities don't change often; in-code is simpler and faster |
| Per-user personality learning | No authentication in kiosk mode |
| Multi-language personality profiles | English-only for current deployment |
| AI image generation for products | Out of budget/scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AI-01 | Phase 1 | Pending |
| AI-02 | Phase 1 | Pending |
| CTX-01 | Phase 2 | Pending |
| CTX-02 | Phase 2 | Pending |
| CTX-03 | Phase 3 | Pending |
| PROD-01 | Phase 2 | Pending |
| PROD-02 | Phase 2 | Pending |
| PROD-03 | Phase 2 | Pending |
| PROD-04 | Phase 2 | Pending |
| PROD-05 | Phase 2 | Pending |
| PROMPT-01 | Phase 3 | Pending |
| PROMPT-02 | Phase 3 | Pending |
| PROMPT-03 | Phase 3 | Pending |
| PROMPT-04 | Phase 3 | Pending |

**Coverage:**
- v1.1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---

## v2.0 Requirements

Requirements for Milestone v2.0 — Own eShop (No Shopify).

**Constraints carried in from v1.1:**
- No new infrastructure — everything runs inside the existing Convex backend
- No customer authentication — guest / anonymous checkout only
- Cart persisted to localStorage (client-side, no server state until order submitted)
- Indian market: standard address form + Razorpay as payment gateway

### Cart

- [ ] **CART-01**: A `useCart` React hook manages cart state (items, quantities, add, remove, clear) and persists to `localStorage` so the cart survives page refresh
- [ ] **CART-02**: Every product card has an "Add to Cart" button that adds the item with quantity 1 (subsequent taps increment quantity)
- [ ] **CART-03**: The product detail page has a prominent "Add to Cart" button
- [ ] **CART-04**: A cart drawer (slide-in panel from the right) shows all cart items, allows quantity change and item removal, and displays the running subtotal
- [ ] **CART-05**: The site header shows a cart icon with a live item-count badge; tapping it opens the cart drawer

### Checkout

- [ ] **CHK-01**: A checkout page (or bottom-sheet on mobile) collects: Full Name, Phone (WhatsApp-friendly), Email, Delivery Address (line 1, line 2 optional), City, State, Pincode
- [ ] **CHK-02**: All required fields are validated client-side before submit — empty or malformed inputs show inline error messages
- [ ] **CHK-03**: Order summary is visible during checkout (items, quantities, per-item price, total)
- [ ] **CHK-04**: A "Place Order" button submits the order to Convex; the button is disabled and shows a spinner while the mutation is in flight

### Orders (Convex Backend)

- [ ] **ORD-01**: A `orders` table exists in the Convex schema with fields: `orderId` (auto-generated), `customer` (name, phone, email, address object), `items` (array of `{productId, name, qty, price}`), `subtotal`, `status` (`"pending"` | `"confirmed"` | `"shipped"` | `"delivered"` | `"cancelled"`), `createdAt`
- [ ] **ORD-02**: A `submitOrder` Convex mutation validates the payload and inserts a new order document; returns the new `orderId`
- [ ] **ORD-03**: After successful submit, the user is shown an order-confirmation screen with their order number and a summary; cart is cleared

### Admin — Order Queue

- [ ] **ADM-01**: The existing AdminDashboard gains an "Orders" tab alongside the existing Products tab
- [ ] **ADM-02**: The Orders tab shows a table of all orders sorted by date descending: order number, customer name, item count, subtotal, status, date
- [ ] **ADM-03**: Clicking a row expands or navigates to full order detail (customer info, all items, address)

### Payment (Phase 3 — Razorpay)

- [ ] **PAY-01**: Razorpay Standard Checkout is integrated — clicking "Pay Now" on the order confirmation screen opens the Razorpay modal
- [ ] **PAY-02**: A Convex HTTP action receives the Razorpay `payment.captured` webhook and updates the order status to `"confirmed"`
- [ ] **PAY-03**: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are read from Convex env vars (set via `npx convex env set`)
- [ ] **PAY-04**: Payment signature verification is done server-side in the Convex HTTP action before marking the order confirmed

### Out of Scope (v2.0)

| Feature | Reason |
|---------|--------|
| Customer accounts / login | Guest-only by design; no auth needed |
| Shipping rate calculator | Flat rate or "contact us" in v2.0 |
| Coupon / promo codes | Phase 3+ |
| Email / SMS notifications | Phase 3+ |
| Multi-currency | INR only |
| Inventory auto-depletion | Manual stock management for now |

## v2.0 Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CART-01 | Phase 1 | Pending |
| CART-02 | Phase 1 | Pending |
| CART-03 | Phase 1 | Pending |
| CART-04 | Phase 1 | Pending |
| CART-05 | Phase 1 | Pending |
| CHK-01 | Phase 1 | Pending |
| CHK-02 | Phase 1 | Pending |
| CHK-03 | Phase 1 | Pending |
| CHK-04 | Phase 1 | Pending |
| ORD-01 | Phase 2 | Pending |
| ORD-02 | Phase 2 | Pending |
| ORD-03 | Phase 2 | Pending |
| ADM-01 | Phase 2 | Pending |
| ADM-02 | Phase 2 | Pending |
| ADM-03 | Phase 2 | Pending |
| PAY-01 | Phase 3 | Pending |
| PAY-02 | Phase 3 | Pending |
| PAY-03 | Phase 3 | Pending |
| PAY-04 | Phase 3 | Pending |

**Coverage:**
- v2.0 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-14*
*Last updated: 2026-05-13 — initial definition*
