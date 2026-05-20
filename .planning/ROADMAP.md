# Roadmap: v1.1 Third Intelligence Context & Personality

**Milestone:** v1.1 — COMPLETE (all 3 phases shipped 2026-05-13)
**Continuing from:** v1.0 (last phase was 0 — no phases executed)
**Phase numbering:** 1–3

---

## Phase 1 — Fix AI Connectivity

**Goal:** Third Intelligence produces real recommendations instead of errors.

**Requirements covered:** AI-01, AI-02

### Tasks

1. In `convex/recommendations.ts`, use `process.env.MISTRAL_API_KEY`
2. Add graceful error handling for empty/malformed Mistral responses (null-safe path through `json.choices`)
3. Verify the fix by confirming the error message is gone when the key is present

### Success Criteria

- User completes the 6-question flow and sees a product recommendation (not an error) when `MISTRAL_API_KEY` is set in Convex env
- Missing API key shows a clear "not configured" message (not a crash)
- Malformed Mistral response returns a fallback explanation, not a thrown exception

### Depends On

Nothing — can start immediately.

---

## Phase 2 — Product Context Document

**Goal:** A single source-of-truth file exists that encodes the Third Wave Coffee brand and gives every product a full personality profile.

**Requirements covered:** CTX-01, CTX-02, PROD-01, PROD-02, PROD-03, PROD-04, PROD-05

### Tasks

1. Create `convex/productContext.ts`
2. Write `BRAND_CONTEXT` — shop story, mission, specialty coffee philosophy, Third Intelligence voice directive (crisp, confident, knowledgeable)
3. Write `PRODUCT_PERSONALITIES` — for each of the 18 SKUs:
   - **Archetype** — one-word character type (e.g., The Rebel, The Wanderer, The Sage)
   - **Tagline** — one punchy sentence that captures the product's essence
   - **Voice** — how the AI should *talk about* this product (3–5 descriptors)
   - **Ideal customer** — one sentence profile of who this is for
   - **Mood** — when/where to drink this; the atmosphere it evokes
   - **Brewing ritual** — recommended brew method and why it unlocks the best of this product
4. Export both as named constants ready to be imported by `recommendations.ts`

### Success Criteria

- File is self-documenting — a developer reading it understands every product's character without looking elsewhere
- All 18 SKUs have a personality entry keyed by product name (exact match to seed data)
- Brand context covers: what TWC stands for, what "specialty coffee" means in this context, how Third Intelligence should position itself
- Merch entries have enough personality to enable sensible cross-sells (e.g., "this mug belongs with ritual brewers")

### Depends On

Phase 1 (none technically, but personality work is wasted without a working AI)

---

## Phase 3 — Enhanced AI Prompt

**Goal:** The AI prompt uses the context document so every recommendation reads as if written by an expert TWC barista, not a generic chatbot.

**Requirements covered:** CTX-03, PROMPT-01, PROMPT-02, PROMPT-03, PROMPT-04

### Tasks

1. Import `BRAND_CONTEXT` and `PRODUCT_PERSONALITIES` from `convex/productContext.ts` into `recommendations.ts`
2. Rewrite the AI prompt to:
   - Open with the brand voice directive (from `BRAND_CONTEXT`)
   - Inject personality profiles for all products in the catalog
   - Instruct Mistral to reference the matched product's archetype, mood, and brewing ritual in the explanation
   - Prohibit generic phrasing ("perfect for you", "great choice") — require flavor-specific, ritual-specific language
   - For cross-sells, require personality-compatibility reasoning
3. Ensure prompt stays within Mistral token limits (soft cap: 8000 input tokens)
4. Update the `explanation` field prompt so output is 2–3 sentences max, crisp and confident

### Success Criteria

- Explanation for a dark-roast match references roast character, not just "you'll love it"
- Explanation for a single-origin match mentions origin story or flavor notes specific to that product
- Cross-sell suggestion has a brief rationale (not just a product name)
- Response is ≤3 sentences — focused, not verbose
- Prompt compiles and calls Mistral without token errors

### Depends On

Phase 2 (needs `productContext.ts` to exist)

---

## Milestone Completion Criteria

- [ ] AI-01 through AI-02 verified (Phase 1)
- [ ] CTX-01 through CTX-02 verified (Phase 2)
- [ ] PROD-01 through PROD-05 verified (Phase 2)
- [ ] PROMPT-01 through PROMPT-04 verified (Phase 3)
- [ ] End-to-end test: a user completes the flow and receives a personality-informed recommendation

---
*Roadmap created: 2026-05-13*
*v1.1 shipped: 2026-05-13*

---

# Roadmap: v2.0 — Own eShop (No Shopify)

**Milestone:** v2.0
**Continuing from:** v1.1 (complete)
**Phase numbering:** 1–3
**Mode:** YOLO — auto-approve, execute directly
**Granularity:** Coarse — 3 phases

---

## Phase 1 — Cart + Checkout UI

**Goal:** Customers can add products to a persistent cart and fill in a complete checkout form — entirely in the browser, no backend needed yet.

**Requirements covered:** CART-01, CART-02, CART-03, CART-04, CART-05, CHK-01, CHK-02, CHK-03, CHK-04

### Tasks

1. **`src/lib/useCart.ts`** — React hook + localStorage persistence
   - `CartItem` type: `{ productId: string; name: string; imageUrl: string; price: number; qty: number }`
   - `useCart()` returns: `{ items, addItem, removeItem, updateQty, clearCart, itemCount, subtotal }`
   - Reads from `localStorage` on mount, writes on every change
   - `subtotal` computed from `items.reduce()`

2. **`src/components/CartDrawer.tsx`** — Slide-in panel from right
   - Lists cart items with image, name, price, qty stepper (+/−), remove button
   - Shows subtotal and a "Checkout" CTA at the bottom
   - Empty state with "Your cart is empty" + "Browse products" link
   - Animated open/close with `motion/react` (same as existing modal patterns)

3. **Wire "Add to Cart" into `src/App.tsx`**
   - Add cart icon + badge to header (existing col 3)
   - Badge shows `itemCount`; zero count hides the badge
   - Cart icon click opens `CartDrawer`
   - Pass `addItem` down to `ProductCard` — add "Add to Cart" button on each card
   - `e.stopPropagation()` on "Add to Cart" so it doesn't navigate to product page

4. **Wire "Add to Cart" into `src/components/ProductPage.tsx`**
   - Replace the existing placeholder with the real `addItem` call
   - Button shows "Added!" briefly (local state, 1.5 s) then reverts to "Add to Cart"

5. **`src/components/CheckoutPage.tsx`** — Full-page checkout
   - Route: `?view=checkout`; navigated to from CartDrawer "Checkout" CTA
   - Order summary (right on desktop, top on mobile): items, qty, subtotal
   - Form fields: Full Name*, Phone* (10 digits), Email*, Address Line 1*, Address Line 2, City*, State*, Pincode* (6 digits)
   - Validation on blur + on submit; inline error messages under each field
   - "Place Order" button — disabled + spinner while in-flight; Phase 1 shows a "coming soon" toast on click

### Success Criteria

- Cart persists across page refresh (verify `localStorage` key `twc_cart`)
- Add to cart from product grid and from product detail page both work
- Cart drawer opens, shows items, allows qty change and removal
- Header badge updates live
- Checkout page renders all fields, validates them, and blocks submit on errors
- Mobile layout is single-column with a sticky "Place Order" bar at the bottom

### Depends On

Nothing — pure frontend, no Convex schema changes.

---

## Phase 2 — Order Backend + Confirmation

**Goal:** Submitting the checkout form creates a real order in Convex; the customer sees a confirmation screen with their order number.

**Requirements covered:** ORD-01, ORD-02, ORD-03, ADM-01, ADM-02, ADM-03

### Tasks

1. **`convex/schema.ts`** — Add `orders` table
   - Fields: `orderId` (string), `customer` (object: name, phone, email, address), `items` (array: productId, name, qty, price), `subtotal` (float64), `status` (union literal: pending / confirmed / shipped / delivered / cancelled)
   - Indexes: `by_status`, `by_creation` (`_creationTime`)

2. **`convex/orders.ts`** — Mutations + queries
   - `submitOrder` mutation: validate, generate `orderId` (`"TWC-" + random 8-char alphanumeric`), insert, return `orderId`
   - `listOrders` query: all orders sorted by `_creationTime` desc
   - `getOrder` query: single order by `orderId`

3. **Wire `CheckoutPage` submit → `submitOrder`**
   - Replace Phase 1 toast with `useMutation(api.orders.submitOrder)`
   - On success: `clearCart()`, navigate to `?view=order-confirmation&id=<orderId>`

4. **`src/components/OrderConfirmation.tsx`**
   - Fetches order via `useQuery(api.orders.getOrder, { orderId })`
   - Shows: checkmark animation, "Order Received!", order number, item summary, "Continue Shopping" button
   - Disabled "Complete Payment" placeholder CTA with tooltip "Razorpay coming in Phase 3"

5. **Extend `src/components/admin/AdminDashboard.tsx`** — Orders tab
   - Tab alongside existing Products tab
   - Table: Order #, Customer Name, Items (count), Subtotal (₹), Status badge, Date
   - Clicking row expands inline detail: full customer info, address, all line items

### Success Criteria

- Valid checkout → order appears in Convex dashboard `orders` table
- Order confirmation page shows correct order number and items
- Cart is cleared after order
- Admin → Orders tab shows all orders; row expand shows full detail
- `orderId` format is `TWC-XXXXXXXX`

### Depends On

Phase 1 (cart state + checkout form must exist)

---

## Phase 3 — Razorpay Payment Integration

**Goal:** Customers can pay online. Razorpay modal collects payment; a Convex HTTP action verifies the webhook and confirms the order.

**Requirements covered:** PAY-01, PAY-02, PAY-03, PAY-04

### Tasks

1. **Env vars** (run once before Phase 3 begins)
   ```bash
   npx convex env set RAZORPAY_KEY_ID rzp_test_xxxx
   npx convex env set RAZORPAY_KEY_SECRET xxxx
   ```

2. **`convex/orders.ts`** — Add `createRazorpayOrder` action (`"use node"`)
   - Calls `POST https://api.razorpay.com/v1/orders` with Basic Auth
   - Payload: `{ amount: subtotal * 100, currency: "INR", receipt: orderId }`
   - Returns `{ razorpayOrderId, keyId }`

3. **Load Razorpay JS** in `index.html` (or dynamic script tag in the component)
   ```html
   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
   ```

4. **`src/components/OrderConfirmation.tsx`** — Wire "Complete Payment"
   - Calls `createRazorpayOrder` to get `razorpayOrderId` + `keyId`
   - Opens Razorpay modal with `key`, `order_id`, `amount`, `currency: "INR"`, prefill contact + email
   - On success: show "Payment Successful! ✓"
   - On failure: show error toast, allow retry

5. **`convex/http.ts`** — Razorpay webhook
   - Route: `POST /webhooks/razorpay`
   - Verify `X-Razorpay-Signature` HMAC-SHA256 against `RAZORPAY_KEY_SECRET`
   - On `payment.captured`: update `order.status` to `"confirmed"`
   - Return 200 to Razorpay

6. **Admin Dashboard** — Enable status editing
   - Status dropdown per order row
   - Calls `updateOrderStatus` mutation

### Success Criteria

- "Complete Payment" opens Razorpay modal with correct INR amount and prefilled details
- Test payment (Razorpay test key) marks order `"confirmed"` in Convex
- Webhook signature verification passes (visible in Convex function logs)
- Payment failure surfaces an error message, not a crash
- Admin can change order status manually

### Depends On

Phase 2 (orders must exist in Convex)

---

## Milestone Completion Criteria (v2.0)

- [ ] CART-01 through CART-05 verified (Phase 1)
- [ ] CHK-01 through CHK-04 verified (Phase 1)
- [ ] ORD-01 through ORD-03 verified (Phase 2)
- [ ] ADM-01 through ADM-03 verified (Phase 2)
- [ ] PAY-01 through PAY-04 verified (Phase 3)
- [ ] End-to-end test: add item → checkout → pay via Razorpay → order confirmed in admin

---
*Roadmap created: 2026-05-14*
*Next step: `/gsd-plan-phase 1`*

---

# Roadmap: v3.0 — Operations & Customer Experience

**Milestone:** v3.0
**Continuing from:** v2.0 (Phases 1+2 shipped; Phase 3 Razorpay pending independently)
**Phase numbering:** 1–3
**Mode:** Planned
**Granularity:** Coarse — 3 phases

---

## Phase 1 — Admin Sales Analytics Dashboard

**Goal:** The admin dashboard shows live revenue metrics, order volume, best-selling products, and daily trends — giving the merchant a real business pulse without leaving the app.

**Requirements covered:** ANALYTICS-01, ANALYTICS-02, ANALYTICS-03, ANALYTICS-04

### Tasks

1. **`convex/analytics.ts`** — New query module
   - `getSalesOverview` query: returns `totalRevenue` (sum of `confirmed+shipped+delivered` order totals), `totalOrders`, `avgOrderValue`, `pendingOrders` count
   - `getDailyRevenue` query: accepts `days: number` param (default 30); groups confirmed orders by `_creationTime` date bucket; returns `[{ date: string; revenue: number; orderCount: number }]`
   - `getTopProducts` query: flattens all order `items` arrays, groups by `productId + name`, sums `qty`; returns top 10 `[{ name: string; qty: number; revenue: number }]`
   - `getOrderStatusBreakdown` query: counts orders per status; returns `{ pending, confirmed, shipped, delivered, cancelled }`
   - All queries operate on the existing `orders` table — no schema change

2. **`src/components/admin/SalesAnalytics.tsx`** — New admin sub-component
   - KPI cards row: Total Revenue (₹), Orders This Month, Avg Order Value (₹), Pending Orders
   - Each card has an icon (TrendingUp, ShoppingBag, BarChart2, Clock from lucide-react), the value in large bold type, and a subtle color accent
   - Revenue trend chart: 30-day sparkline using a lightweight SVG path (no chart library dependency) — plot daily `revenue` values as a `polyline`, x-axis dates, y-axis ₹ labels
   - Top Products table: rank, product name, units sold, revenue — sortable by either column
   - Order Status doughnut: 5 segments rendered as an SVG arc ring using `stroke-dasharray` / `stroke-dashoffset` trick — legend beneath

3. **Wire into `src/components/admin/AdminDashboard.tsx`**
   - Add "Analytics" tab alongside existing Products + Orders tabs
   - Tab icon: `BarChart2` (lucide)
   - Renders `<SalesAnalytics />` when active
   - Tab defaults to Analytics when admin first opens (most useful default)

4. **Date range selector** (in SalesAnalytics)
   - Pill buttons: "7D" | "30D" | "90D" — controls `days` param passed to `getDailyRevenue`
   - Defaults to 30D; persists selection in component state

### Success Criteria

- KPI cards show correct figures drawn live from Convex (no stale mock data)
- Switching 7D / 30D / 90D re-queries and updates the chart
- Top products reflect actual item quantities from real orders
- Status doughnut percentages add up to 100% (or shows "No orders yet" empty state)
- Zero new npm dependencies — chart uses inline SVG

### Depends On

Phase 2 of v2.0 (orders must exist in Convex — already shipped)

---

## Phase 2 — GPS Address Autofill at Checkout

**Goal:** When the customer opens checkout, they can tap "Use my location" to instantly fill their address from GPS — no typing required. The address is cached so returning customers never need to grant permission twice.

**Requirements covered:** GEO-01, GEO-02, GEO-03

### Tasks

1. **`src/lib/useGeoAddress.ts`** — Geolocation + reverse geocode hook
   - `useGeoAddress()` returns `{ loading, error, address, requestLocation }`
   - `requestLocation()`: calls `navigator.geolocation.getCurrentPosition()`
   - On success: calls Nominatim reverse geocode endpoint `https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=18&addressdetails=1` (free, no API key)
   - Maps Nominatim response to checkout fields: `address1` (road + house_number), `address2` (neighbourhood / suburb), `city` (city / town / village), `state` (state), `pincode` (postcode)
   - Caches result to `localStorage` under key `twc_geo_address` with a `cachedAt` timestamp; TTL = 7 days
   - On mount: loads cache; if cache exists and TTL not expired, returns it directly without triggering GPS
   - Permission denied / GPS unavailable → sets `error` string; caller shows graceful message

2. **Update `src/components/CheckoutPage.tsx`**
   - Add `useGeoAddress()` hook
   - Show "📍 Use my location" button above the Address section (only on browsers that support `navigator.geolocation`)
   - Button states: idle → spinner (loading) → success (address filled) → error (permission denied, show inline message)
   - On success: populate all 5 address fields from the hook result; user can still edit any field after autofill
   - If cached address exists: show "📍 Use saved location" button with a small "clear" ×
   - `clearCache()`: removes `twc_geo_address` from localStorage; resets to manual entry
   - No changes to form validation logic — GPS just pre-fills values, validation runs the same

3. **Security & privacy**
   - Only request GPS on explicit button tap — never on page load
   - No GPS coords stored in Convex or sent to any server — Nominatim call is client-side only
   - Nominatim User-Agent header: `brewmatch-ai/3.0 (contact: admin@thirdwavecoffee.in)` as required by OSM usage policy

### Success Criteria

- "Use my location" button appears on checkout page on compatible browsers
- Tapping it prompts browser permission request
- On allow: all address fields auto-populate within 2 s
- Second visit: cached address fills silently, no permission prompt
- On deny: friendly inline error, manual entry still works perfectly
- Cache expires after 7 days (verify by mocking `Date.now`)
- No GPS call on page load — only explicit user action

### Depends On

Phase 1 of v2.0 (CheckoutPage must exist — already shipped)

---

## Phase 3 — Customer Order Portal

**Goal:** Customers can look up their order by ID, track status in real time, cancel if still pending, get AI-powered support chat, and understand next steps — all in one self-service screen. Zero login required.

**Requirements covered:** CUST-01, CUST-02, CUST-03, CUST-04, CUST-05, CUST-06

### Tasks

1. **`convex/orders.ts`** — New mutations + queries
   - `cancelOrder` mutation: accepts `orderId`; validates status is `"pending"`; sets status to `"cancelled"`; throws `ConvexError` if order not cancellable
   - `addOrderNote` mutation: accepts `orderId`, `message` (string), `role` ("customer" | "system"); appends to `notes` array on order
   - Update `convex/schema.ts`: add `notes` optional array field to `orders` table (`v.optional(v.array(v.object({ role: v.union(v.literal("customer"), v.literal("system")), message: v.string(), ts: v.number() })))`)

2. **`convex/support.ts`** — AI support chat action (`"use node"`)
   - `answerSupportQuery` action: accepts `{ orderId: string; question: string; orderContext: object }`
   - Builds a Mistral prompt with: current order status, items, customer name, delivery address, and the user's question
   - System prompt: TWC support agent persona — helpful, concise, warm; knows order details; can explain statuses, estimated delivery (3–7 business days standard), return/refund policy (prepaid returns within 7 days), contact (support@thirdwavecoffee.in)
   - Returns `{ answer: string }` (max 3 sentences)
   - Uses existing `MISTRAL_API_KEY` env var — no new keys needed

3. **`src/components/OrderPortal.tsx`** — New full-page component
   - **Lookup screen** (default): 
     - Full-page card centered on `natural-bg`
     - TWC logo / "Track Your Order" headline
     - Single text input: "Enter your Order ID (e.g. TWC-XXXXXXXX)"
     - "Track" button — calls `getOrder` query; shows inline error if not found
     - Route: `?page=order-portal`; with ID: `?page=order-portal&id=TWC-XXXXXXXX`
   - **Order detail screen** (after successful lookup):
     - Header: back arrow, order ID badge, status badge (color-coded: pending=amber, confirmed=blue, shipped=violet, delivered=green, cancelled=red)
     - Section: **Order Summary** — product image grid, name, qty, price, subtotal, shipping, total
     - Section: **Delivery Address** — formatted customer address
     - Section: **Order Timeline** — vertical step tracker: Placed → Confirmed → Shipped → Delivered; current step highlighted; cancelled state shown in red
     - Section: **Payment Status** — badge: Unpaid / Paid (shows `razorpayPaymentId` last 6 chars if paid)
     - **Cancel Order** CTA — shown only if status is `"pending"`; opens confirmation modal ("Are you sure? This can't be undone."); calls `cancelOrder` mutation; live-updates UI
     - **AI Support Chat** — collapsible panel at bottom
       - "Chat with Support" toggle button
       - When open: scrollable message list + input + send button
       - First message auto-sent: "Hi! I'm here to help with your order TWC-XXXXXXXX. What would you like to know?"
       - User messages → `answerSupportQuery` action → AI reply rendered with typing indicator
       - Chat history persisted in component state (not Convex)
       - Suggested prompts: "Where is my order?", "How do I return?", "Change delivery address"

4. **Wire route into `src/App.tsx`**
   - Add `?page=order-portal` route check alongside existing `checkout` / `order-confirmation` routes
   - If `?page=order-portal&id=TWC-XXXXXXXX`, pre-populate and immediately look up the order
   - Add "Track Order" link in the main site footer (small text link, not prominent)
   - In `OrderConfirmation.tsx`: add "Track your order →" link that navigates to `?page=order-portal&id=<orderId>`

### Success Criteria

- Entering a valid Order ID shows the full order detail screen
- Entering an invalid ID shows "Order not found" inline error
- Status badge + timeline reflect live Convex data (real-time subscription)
- Cancel button visible only for pending orders; confirmed orders show "Cannot cancel — already confirmed"
- Cancellation flows through to Convex and badge updates immediately
- Support chat answers questions about the specific order (references status, items, address in replies)
- Suggested prompts auto-send on click
- Deep link `?page=order-portal&id=TWC-XXXXXXXX` works — no manual ID entry needed
- Mobile: single-column layout, chat panel full-width

### Depends On

Phase 2 of v2.0 (orders must exist in Convex — already shipped); `support.ts` requires `MISTRAL_API_KEY` (already set)

---

## Milestone Completion Criteria (v3.0)

- [ ] ANALYTICS-01 through ANALYTICS-04 verified (Phase 1)
- [ ] GEO-01 through GEO-03 verified (Phase 2)
- [ ] CUST-01 through CUST-06 verified (Phase 3)
- [ ] End-to-end: place order → track on portal → cancel (if pending) → chat with support AI

---
*Roadmap created: 2026-05-14*
*v3.0 shipped: 2026-05-15*
*v4.0 shipped: 2026-05-20*

---

# Roadmap: v5.0 — Next.js Migration

**Milestone:** v5.0
**Continuing from:** v4.0 (complete)
**Phase numbering:** 1–3 (reset)
**Mode:** Planned
**Granularity:** Standard — 3 phases
**Deployment target:** GitHub Pages (`output: 'export'`) + Cloudflare CDN — no SSR

---

## Phase 1 — Next.js Bootstrap + Build Pipeline

**Goal:** The project builds with Next.js 15 App Router and deploys to GitHub Pages via `output: 'export'`. The existing Vite build is removed. Convex + Auth providers are wired in root layout. GitHub Actions uploads `./out` instead of `./dist`.

**Requirements covered:** MIG-01, MIG-02, MIG-03, MIG-04, MIG-05, MIG-06, MIG-07

**Plans:** 2 plans

Plans:
- [ ] 01-01-PLAN.md — Next.js 15 init: package.json, next.config.ts, tsconfig, postcss (Tailwind v4), remove Vite
- [ ] 01-02-PLAN.md — Providers root layout + GitHub Actions deploy update + smoke-test build

### Depends On

Nothing — can start immediately.

---

## Phase 2 — Global State Providers + SSR Safety

**Goal:** All shared state currently living in App.tsx (cart, discounts, toasts, cart panel) is extracted into React context providers mounted at the root layout. Every SSR-incompatible component (Three.js, Leaflet, Lenis, MagneticCursor) is wrapped in `dynamic()` or `"use client"` guards. `next build` produces zero hydration warnings.

**Requirements covered:** STATE-01, STATE-02, STATE-03, STATE-04, SSR-01, SSR-02, SSR-03, SSR-04, SSR-05

**Plans:** 2 plans

Plans:
- [ ] 02-01-PLAN.md — CartProvider + DiscountProvider + ToastProvider + CartPanelProvider
- [ ] 02-02-PLAN.md — SSR-unsafe dynamic() wraps + localStorage guards

### Depends On

Phase 1 (Next.js build must work before providers can be tested)

---

## Phase 3 — Route Migration + Cleanup

**Goal:** All 8 pages are migrated from `?page=` query-param routing to Next.js App Router file routes. App.tsx is retired. All `navigateTo()` calls are replaced with `useRouter().push()` / `<Link>`. `generateStaticParams()` is implemented for product and post dynamic routes.

**Requirements covered:** ROUTE-01, ROUTE-02, ROUTE-03, ROUTE-04, ROUTE-05, ROUTE-06, ROUTE-07, ROUTE-08, ROUTE-09, ROUTE-10, ROUTE-11, ROUTE-12

**Plans:** 3 plans

Plans:
- [ ] 03-01-PLAN.md — Static routes: `/`, `/shop`, `/checkout`, `/orders`, `/admin`
- [ ] 03-02-PLAN.md — Dynamic routes: `/products/[slug]`, `/journal`, `/journal/[id]`, `/orders/[id]`
- [ ] 03-03-PLAN.md — Navigation wiring, App.tsx retirement, `not-found.tsx`, final build verification

### Depends On

Phase 2 (providers must exist before pages consume them)

---

## Milestone Completion Criteria (v5.0)

- [ ] `next build` exits 0, `./out` directory generated
- [ ] GitHub Actions deploys successfully to `thirdwavecoffee.prismintelligence.in`
- [ ] All 8 routes load without blank screens or console errors
- [ ] Cart persists across route changes (add in `/shop`, checkout on `/checkout`)
- [ ] Discount flow works end-to-end: journal → claim → cart shows discount
- [ ] Admin dashboard accessible at `/admin`
- [ ] No hydration mismatch warnings in browser console
- [ ] `vite.config.ts` deleted — no Vite artifacts remain


## ~~v4.0 — The Editorial Hub~~ SHIPPED 2026-05-20 * 30/31 reqs * 58 commits | [Archive](.planning/milestones/v4.0-ROADMAP.md)
