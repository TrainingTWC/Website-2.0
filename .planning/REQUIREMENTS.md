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
| CART-01 | Phase 1 | ✅ shipped |
| CART-02 | Phase 1 | ✅ shipped |
| CART-03 | Phase 1 | ✅ shipped |
| CART-04 | Phase 1 | ✅ shipped |
| CART-05 | Phase 1 | ✅ shipped |
| CHK-01 | Phase 1 | ✅ shipped |
| CHK-02 | Phase 1 | ✅ shipped |
| CHK-03 | Phase 1 | ✅ shipped |
| CHK-04 | Phase 1 | ✅ shipped |
| ORD-01 | Phase 2 | ✅ shipped |
| ORD-02 | Phase 2 | ✅ shipped |
| ORD-03 | Phase 2 | ✅ shipped |
| ADM-01 | Phase 2 | ✅ shipped |
| ADM-02 | Phase 2 | ✅ shipped |
| ADM-03 | Phase 2 | ✅ shipped |
| PAY-01 | Phase 3 | ⏳ pending |
| PAY-02 | Phase 3 | ⏳ pending |
| PAY-03 | Phase 3 | ⏳ pending |
| PAY-04 | Phase 3 | ⏳ pending |

---

## v4.0 Requirements

Requirements for Milestone v4.0 — The Editorial Hub: Offers, News & Promotions.

**Constraints:**
- All content fully dynamic — no static/seeded editorial data
- Discount validation server-side only — client never computes discount math
- Only one active discount per cart session at a time
- Cover images stored in Convex Storage (same pattern as product images)
- No email subscription feature in this milestone
- No new npm dependencies for layout — Tailwind grid covers magazine layout needs

### Editorial Content (Data Layer)

- [ ] **EDI-01**: A `posts` Convex table supports five content types: `flash-sale`, `product-launch`, `cafe-news`, `brand-story`, `champion`
- [ ] **EDI-02**: Each post has: `type`, `headline`, `subhead`, `body`, `coverImageStorageId`, `status` (`draft` | `published` | `scheduled`), `publishAt`, `expiresAt` (optional), `linkedProductId` (optional)
- [ ] **EDI-03**: Flash-sale posts reference a `discountId` linking to the discounts table
- [ ] **EDI-04**: Champion posts have extended fields: `personName`, `personRole`, `personStory`, `favouriteProductId`
- [ ] **EDI-05**: A `convex/posts.ts` module exposes: `listPublished` query, `getPost` query, `createPost` mutation, `updatePost` mutation, `deletePost` mutation

### Discounts

- [ ] **OFF-01**: A `discounts` Convex table holds: `code` (unique string), `type` (`percent` | `flat`), `amount` (number), `firstOrderOnly` (boolean), `expiresAt` (optional), `maxUses` (optional), `usageCount` (number, default 0)
- [ ] **OFF-02**: A `validateDiscount` Convex query checks a code and returns eligibility: valid/invalid, type, amount, reason for rejection (expired, max uses reached, first-order restriction)
- [ ] **OFF-03**: A `claimDiscount` Convex mutation atomically increments `usageCount` and returns the discount details; fails with `ConvexError` if ineligible
- [ ] **OFF-04**: Claimed discount code is stored on the order record at submit time so admin can see which code was used per order
- [ ] **OFF-05**: First-order-only validation checks whether the phone/email has any prior non-cancelled orders before allowing the code

### Claim Offer UX

- [ ] **OFF-06**: Offer and flash-sale post cards display a glassmorphism "Claim Offer" button
- [ ] **OFF-07**: Clicking "Claim Offer" calls `claimDiscount`, shows a "Offer applied ✓" toast, and stores the active discount in `localStorage` under `twc_active_discount`
- [ ] **OFF-08**: Only one discount can be active at a time — claiming a new offer replaces any previously active discount (with a confirmation if one is already active)
- [ ] **OFF-09**: Active discount is cleared from `localStorage` when the order is successfully submitted

### Magazine Editorial Hub (Frontend)

- [ ] **HUB-01**: An Editorial Hub page exists at `?page=editorial` with a full-bleed hero pulled from the most recent featured published post
- [ ] **HUB-02**: A magazine-style asymmetric grid displays all published posts — mix of large hero cards and smaller supporting cards (Monocle/Kinfolk aesthetic)
- [ ] **HUB-03**: Category filter pills let users filter by: All | Offers | News | Stories | Champions
- [ ] **HUB-04**: Flash-sale cards display a live countdown timer (client-side, counts down to `expiresAt`); expired cards are hidden from the public grid
- [ ] **HUB-05**: Product-launch cards link to the product's detail page
- [ ] **HUB-06**: Brand-story and café-news cards open a full post detail view (inline expand or `?page=editorial&post=<id>`)
- [ ] **HUB-07**: Champions section is a dedicated band within the hub showing champion cards with photo, name, role, and favourite product
- [ ] **HUB-08**: A "Journal" or "Offers & News" nav link in the site header/footer leads to `?page=editorial`
- [ ] **HUB-09**: Each published post with `expiresAt` in the past is auto-hidden from the public grid (no admin action required)

### Admin CMS

- [ ] **CMS-01**: The Admin Dashboard gains an "Editorial" tab alongside the existing Products, Orders, and Analytics tabs
- [ ] **CMS-02**: The Editorial tab shows a post list with columns: headline, type badge, status badge, publishAt, actions (edit/delete/toggle publish)
- [ ] **CMS-03**: A post creation/edit form supports all fields: type selector, headline, subhead, body, cover image upload (Convex Storage), publishAt datetime, expiresAt datetime (optional), linked product (for launch/champion types), linked discount (for flash-sale type)
- [ ] **CMS-04**: A Discounts sub-tab allows creating, viewing, and deleting discount codes with all fields visible (code, type, amount, firstOrderOnly, expiresAt, maxUses, current usageCount)
- [ ] **CMS-05**: Champions management is handled via the post creation form (type = champion) — no separate UI needed

### Cart Discount Display

- [ ] **DISC-01**: Cart Drawer shows an "Active offer" section if `twc_active_discount` is set in localStorage: discount code badge, savings amount (calculated client-side for display only), strike-through subtotal, and a × to remove the discount
- [ ] **DISC-02**: Checkout page order summary shows the discount applied: original subtotal, discount line (−₹X or −X%), and discounted total
- [ ] **DISC-03**: `submitOrder` mutation accepts an optional `discountCode` field and stores it on the order record; server re-validates the discount before accepting it

### Out of Scope (v4.0)

| Feature | Reason |
|---------|--------|
| Email newsletter subscription | Explicitly out of scope for this milestone |
| Comment / reaction system on posts | Adds auth complexity; defer |
| Scheduled post auto-publishing | Admin manually publishes for now |
| Push notifications for flash sales | Native mobile not in scope |
| Discount stacking | One active at a time by design |
| Affiliate / referral codes | Future milestone |

## v4.0 Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| EDI-01 | Phase 1 | Pending |
| EDI-02 | Phase 1 | Pending |
| EDI-03 | Phase 1 | Pending |
| EDI-04 | Phase 1 | Pending |
| EDI-05 | Phase 1 | Pending |
| OFF-01 | Phase 1 | Pending |
| OFF-02 | Phase 1 | Pending |
| OFF-03 | Phase 1 | Pending |
| CMS-01 | Phase 1 | Pending |
| CMS-02 | Phase 1 | Pending |
| CMS-03 | Phase 1 | Pending |
| CMS-04 | Phase 1 | Pending |
| CMS-05 | Phase 1 | Pending |
| OFF-04 | Phase 1 | Pending |
| OFF-05 | Phase 1 | Pending |
| HUB-01 | Phase 2 | Pending |
| HUB-02 | Phase 2 | Pending |
| HUB-03 | Phase 2 | Pending |
| HUB-04 | Phase 2 | Pending |
| HUB-05 | Phase 2 | Pending |
| HUB-06 | Phase 2 | Pending |
| HUB-07 | Phase 2 | Pending |
| HUB-08 | Phase 2 | Pending |
| HUB-09 | Phase 2 | Pending |
| OFF-06 | Phase 2 | Pending |
| OFF-07 | Phase 2 | Pending |
| OFF-08 | Phase 2 | Pending |
| OFF-09 | Phase 3 | Pending |
| DISC-01 | Phase 3 | Pending |
| DISC-02 | Phase 3 | Pending |
| DISC-03 | Phase 3 | Pending |

**Coverage:**
- v4.0 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0 ✓

---
*Requirements updated: 2026-05-15*
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
*Last updated: 2026-05-20 — v5.0 added*

---

## v5.0 Requirements

Requirements for Milestone v5.0 — Next.js Migration.

**Deployment constraint (locked):** `output: 'export'` static HTML — stays on GitHub Pages + Cloudflare CDN. No SSR. No React Server Components with data fetching.

### Infrastructure

- [ ] **MIG-01**: Next.js 15 App Router initialized with TypeScript — Vite config removed, `package.json` scripts updated to `next dev` / `next build`
- [ ] **MIG-02**: `next.config.ts` sets `output: 'export'`, `trailingSlash: true`, `images: { unoptimized: true }` (Cloudflare handles image CDN)
- [ ] **MIG-03**: Tailwind CSS v4 configured via `@tailwindcss/postcss` in `postcss.config.mjs` (replaces `@tailwindcss/vite` plugin)
- [ ] **MIG-04**: ConvexProvider + ConvexAuthProvider mounted in root `app/layout.tsx` inside a `"use client"` providers wrapper component
- [ ] **MIG-05**: GitHub Actions `deploy.yml` updated — artifact path changed from `./dist` to `./out`
- [ ] **MIG-06**: `public/CNAME` preserved; `basePath` not set (custom domain is at `/`)
- [ ] **MIG-07**: `next build` succeeds with 0 TypeScript errors and 0 console errors

### Global State Providers

- [ ] **STATE-01**: `CartProvider` React context created — provides `cart`, `addToCart`, `removeFromCart`, `updateQty`, `clearCart`; persists to localStorage; replaces cart state in App.tsx
- [ ] **STATE-02**: `DiscountProvider` React context — provides `activeDiscount`, `setActiveDiscount`, `clearDiscount`; syncs with `twc_active_discount` localStorage key; replaces discount state in App.tsx
- [ ] **STATE-03**: `ToastProvider` React context — provides `showToast`; renders `<ToastContainer>` globally at root layout
- [ ] **STATE-04**: `CartPanelProvider` React context — manages `cartOpen` boolean + renders `<CartPanel>` overlay at root layout so it persists across route changes

### SSR Safety

- [ ] **SSR-01**: `BestsellerCarousel3D`, `ProductHero3D`, `GalaxySweep` each wrapped with `dynamic(() => import(...), { ssr: false })`
- [ ] **SSR-02**: `VisitorMap` (Leaflet) wrapped with `dynamic(() => import(...), { ssr: false })`
- [ ] **SSR-03**: `SmoothScroll` (Lenis) converted to `"use client"` with `useEffect` guard — no window access at module level
- [ ] **SSR-04**: `MagneticCursor` wrapped with `dynamic(() => import(...), { ssr: false })`
- [ ] **SSR-05**: All `localStorage` reads (cart init, discount init, page scroll position) guarded with `typeof window !== 'undefined'`

### Routing

- [ ] **ROUTE-01**: `/` — Home page (hero, storefront sections, BannerSlideshow, PersonalitySection, etc.)
- [ ] **ROUTE-02**: `/shop` — ShopPage with cart integration via CartProvider
- [ ] **ROUTE-03**: `/products/[slug]` — ProductPage; slug = product `_id`; `generateStaticParams()` enumerates all product IDs fetched from Convex HTTP API at build time
- [ ] **ROUTE-04**: `/journal` — EditorialHub
- [ ] **ROUTE-05**: `/journal/[id]` — PostDetail; `generateStaticParams()` returns `[]` + client-side load via `useQuery` (posts are dynamic CMS content)
- [ ] **ROUTE-06**: `/checkout` — CheckoutPage with cart + discount via providers
- [ ] **ROUTE-07**: `/orders/[id]` — OrderConfirmation; `generateStaticParams()` returns `[]` + client-side load
- [ ] **ROUTE-08**: `/orders` — OrderPortal (track/manage order)
- [ ] **ROUTE-09**: `/admin` — AdminShell protected by AdminAuthGate
- [ ] **ROUTE-10**: `not-found.tsx` (404 page) redirects to `/` — handles GitHub Pages 404 for any unmatched route
- [ ] **ROUTE-11**: All `navigateTo({ page: X })` calls and `window.location` mutations replaced with `useRouter().push('/x')` or `<Link href="/x">`
- [ ] **ROUTE-12**: App.tsx retired — root `app/page.tsx` replaces the home page branch of App.tsx

## Out of Scope (v5.0)

| Feature | Reason |
|---------|--------|
| React Server Components with Convex | Requires SSR/edge runtime — incompatible with `output: 'export'` |
| Razorpay integration | Deferred to v6.0 |
| `next/image` optimization | Disabled (`unoptimized: true`); Cloudflare handles CDN |
| i18n routing | Not needed for current deployment |
| Incremental Static Regeneration | Not compatible with static export |

## Traceability (v5.0)

| Requirement | Phase | Status |
|-------------|-------|--------|
| MIG-01 | Phase 1 | Pending |
| MIG-02 | Phase 1 | Pending |
| MIG-03 | Phase 1 | Pending |
| MIG-04 | Phase 1 | Pending |
| MIG-05 | Phase 1 | Pending |
| MIG-06 | Phase 1 | Pending |
| MIG-07 | Phase 1 | Pending |
| STATE-01 | Phase 2 | Pending |
| STATE-02 | Phase 2 | Pending |
| STATE-03 | Phase 2 | Pending |
| STATE-04 | Phase 2 | Pending |
| SSR-01 | Phase 2 | Pending |
| SSR-02 | Phase 2 | Pending |
| SSR-03 | Phase 2 | Pending |
| SSR-04 | Phase 2 | Pending |
| SSR-05 | Phase 2 | Pending |
| ROUTE-01 | Phase 3 | Pending |
| ROUTE-02 | Phase 3 | Pending |
| ROUTE-03 | Phase 3 | Pending |
| ROUTE-04 | Phase 3 | Pending |
| ROUTE-05 | Phase 3 | Pending |
| ROUTE-06 | Phase 3 | Pending |
| ROUTE-07 | Phase 3 | Pending |
| ROUTE-08 | Phase 3 | Pending |
| ROUTE-09 | Phase 3 | Pending |
| ROUTE-10 | Phase 3 | Pending |
| ROUTE-11 | Phase 3 | Pending |
| ROUTE-12 | Phase 3 | Pending |

**Coverage:**
- v5.0 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓
