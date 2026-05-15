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

---

# Roadmap: v4.0 — The Editorial Hub: Offers, News & Promotions

**Milestone:** v4.0
**Continuing from:** v3.0 (complete)
**Phase numbering:** 1–3
**Mode:** Planned
**Granularity:** Coarse — 3 phases

---

## Phase 1 — Data Layer + Admin CMS

**Goal:** The Convex backend holds all editorial content, discounts, and champion entries. The merchant can create, edit, publish, and delete every piece of content from the Admin Dashboard's new "Editorial" tab — without touching code.

**Requirements covered:** EDI-01, EDI-02, EDI-03, EDI-04, EDI-05, OFF-01, OFF-02, OFF-03, OFF-04, OFF-05, CMS-01, CMS-02, CMS-03, CMS-04, CMS-05

**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md — Convex data layer: schema extension + posts.ts + discounts.ts + orders.ts update
- [x] 01-02-PLAN.md — Admin CMS frontend: Editorial tab + EditorialCMS component (Posts + Discounts)

1. **`convex/schema.ts`** — Add three new tables

   `posts` table:
   - `type`: `v.union(v.literal("flash-sale"), v.literal("product-launch"), v.literal("cafe-news"), v.literal("brand-story"), v.literal("champion"))`
   - `headline`: `v.string()`
   - `subhead`: `v.optional(v.string())`
   - `body`: `v.string()`
   - `coverImageStorageId`: `v.optional(v.id("_storage"))`
   - `coverImageUrl`: `v.optional(v.string())`
   - `status`: `v.union(v.literal("draft"), v.literal("published"), v.literal("scheduled"))`
   - `publishAt`: `v.optional(v.number())` (epoch ms)
   - `expiresAt`: `v.optional(v.number())` (epoch ms)
   - `linkedProductId`: `v.optional(v.id("products"))`
   - `discountId`: `v.optional(v.id("discounts"))` (flash-sale only)
   - `personName`: `v.optional(v.string())` (champion only)
   - `personRole`: `v.optional(v.string())` (champion only)
   - `personStory`: `v.optional(v.string())` (champion only)
   - Indexes: `by_status`, `by_type`, `by_publishAt`

   `discounts` table:
   - `code`: `v.string()` (unique)
   - `discountType`: `v.union(v.literal("percent"), v.literal("flat"))`
   - `amount`: `v.number()`
   - `firstOrderOnly`: `v.boolean()`
   - `expiresAt`: `v.optional(v.number())`
   - `maxUses`: `v.optional(v.number())`
   - `usageCount`: `v.number()` (default 0)
   - Index: `by_code`

   `orders` table — add optional field: `discountCode`: `v.optional(v.string())`

2. **`convex/posts.ts`** — New module
   - `listPublished` query: returns all posts with `status: "published"` and (`expiresAt` undefined OR `expiresAt > Date.now()`), ordered by `publishAt` desc
   - `listAll` query (admin): returns all posts regardless of status, ordered by `_creationTime` desc
   - `getPost` query: by `_id`
   - `createPost` mutation: validates required fields by type, inserts, returns `_id`
   - `updatePost` mutation: accepts `_id` + partial update object, patches
   - `deletePost` mutation: deletes by `_id`
   - `generateUploadUrl` mutation: calls `ctx.storage.generateUploadUrl()` for cover image upload

3. **`convex/discounts.ts`** — New module
   - `listDiscounts` query (admin): returns all discounts
   - `validateDiscount` query: accepts `{ code, customerPhone, customerEmail }` — checks: exists, not expired, usageCount < maxUses, firstOrderOnly check (queries orders table for matching phone/email with non-cancelled status); returns `{ valid: boolean, reason?: string, discountType?, amount? }`
   - `claimDiscount` mutation: atomically patches `usageCount += 1`; throws `ConvexError` if ineligible
   - `createDiscount` mutation: validates uniqueness of `code`, inserts
   - `deleteDiscount` mutation: deletes by `_id`

4. **`src/components/admin/AdminDashboard.tsx`** — Add "Editorial" tab
   - New "Editorial" tab (icon: `Newspaper` from lucide-react) alongside Products, Orders, Analytics
   - Renders `<EditorialCMS />` sub-component when active

5. **`src/components/admin/EditorialCMS.tsx`** — New admin sub-component

   **Posts tab (default):**
   - Post list table: headline, type badge (color-coded), status badge, publishAt date, actions (Edit / Toggle Publish / Delete)
   - "New Post" button opens a creation form modal/panel
   - Post form fields: type selector (dropdown), headline, subhead, body (textarea), cover image upload (file input → `generateUploadUrl` → PUT → store ID), publishAt (datetime-local), expiresAt (datetime-local, optional), linked product (select from products list, optional), linked discount (select from discounts list, only shown when type = flash-sale)
   - Champion type shows extra fields: personName, personRole, personStory
   - Submit calls `createPost` or `updatePost`; delete calls `deletePost` with confirm dialog

   **Discounts sub-tab:**
   - Discount list table: code, type, amount, firstOrderOnly badge, expiresAt, maxUses, usageCount
   - "New Discount" button opens a simple creation form: code (text), type (percent/flat), amount (number), firstOrderOnly (checkbox), expiresAt (optional), maxUses (optional)
   - Delete button with confirm dialog

### Success Criteria

- `posts`, `discounts` tables exist and accept all field types in Convex dashboard
- Admin can create a flash-sale post linked to a discount code, publish it, and see it in the list
- Admin can create a discount code with firstOrderOnly=true and see usageCount tick up
- `validateDiscount` returns `{ valid: false, reason: "expired" }` for a past-expiry code
- `validateDiscount` returns `{ valid: false, reason: "first-order-only" }` for a repeat customer
- Cover image upload: admin selects image → upload completes → post saved with `coverImageStorageId`
- Post delete removes the document from the table immediately

### Depends On

v2.0 Phase 2 (orders table must exist for firstOrderOnly check — already shipped)

---

## Phase 2 — Magazine Editorial Hub (Frontend) ✅ COMPLETE

**Commit:** 7156db4  
**Goal:** Users land on `?page=editorial` and experience a premium magazine-style hub — full-bleed hero, asymmetric grid, category filters, live countdown timers on flash sales, champion spotlights, and a glassmorphism "Claim Offer" button on offer cards that applies the discount to their cart session.

**Requirements covered:** HUB-01, HUB-02, HUB-03, HUB-04, HUB-05, HUB-06, HUB-07, HUB-08, HUB-09, OFF-06, OFF-07, OFF-08

### Tasks

1. **`src/components/EditorialHub.tsx`** — New full-page component

   **Hero section:**
   - Full-bleed hero (100vw, 70vh) using the most recently published post's `coverImageUrl`
   - Overlay with post `headline` and `subhead` in large serif-inspired type
   - If the hero post is a flash-sale, show the countdown timer in the hero overlay
   - Gradient overlay bottom-to-top (dark → transparent) for legibility

   **Category filter pills:**
   - Sticky below hero: `All` | `Offers` | `News` | `Stories` | `Champions`
   - Active pill uses `natural-accent` background; inactive uses `natural-paper` with border
   - Filtering is client-side — no re-fetch

   **Magazine grid:**
   - CSS grid with `grid-cols-12` — large cards span 8 cols, small cards span 4 cols; alternates so every 3rd card is large
   - Mobile: single-column
   - Cards: cover image (aspect 3/2), type badge top-left, headline, subhead (2-line clamp), date
   - Flash-sale cards: `CountdownTimer` component (see below), glassmorphism "Claim Offer" button
   - Product-launch cards: link to `?product=<slug>`
   - Brand-story / café-news cards: open post detail modal or navigate to `?page=editorial&post=<id>`
   - Hidden cards: posts with `expiresAt < Date.now()` (flash sales only)

   **Champions band:**
   - Horizontal scroll row of champion cards below the main grid (or filtered in-grid when Champions filter active)
   - Card: circular photo, personName, personRole, personStory (3-line clamp), favourite product chip

2. **`src/components/CountdownTimer.tsx`** — Reusable component
   - Props: `expiresAt: number` (epoch ms)
   - Displays: `HH:MM:SS` or `Xd Xh Xm` depending on remaining time
   - Updates every second via `setInterval` in `useEffect`; clears on unmount
   - When expired: shows "Sale ended" and stops ticking
   - Styling: monospace digits, `natural-accent` color

3. **Glassmorphism "Claim Offer" button**
   - Appears only on flash-sale post cards and only when `expiresAt > Date.now()`
   - Style: `backdrop-blur-md bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2 font-semibold shadow-lg hover:bg-white/20 transition`
   - Click flow:
     - Calls `validateDiscount` query with the post's linked discount code (uses anonymous phone/email `""` for non-first-order codes; for firstOrderOnly codes shows a "This offer is for first-time orders only" tooltip instead of validating)
     - If valid: calls `claimDiscount` mutation → stores `{ code, discountType, amount, claimedAt }` in `localStorage` key `twc_active_discount` → shows a toast "Offer applied ✓ [code] — save ₹X off your order"
     - If another discount already active: shows a confirmation dialog "Replace your current offer [OLD_CODE] with [NEW_CODE]?" — on confirm, replaces localStorage; on cancel, does nothing
     - If invalid (expired, maxUses): button is disabled and shows tooltip with reason

4. **Wire route into `src/App.tsx`**
   - Add `?page=editorial` route check (alongside existing checkout / order-portal routes)
   - If `?page=editorial&post=<id>`, render `<PostDetail postId={id} />` (inline modal over the hub)
   - Add "Journal" link to the site navigation (header desktop nav + mobile menu)

5. **`src/components/PostDetail.tsx`** — Full post view
   - Full-bleed cover image header (60vh)
   - Type badge, headline in large type, subhead, body (preserving line breaks)
   - For flash-sale: embed `CountdownTimer` and the glassmorphism "Claim Offer" button
   - For product-launch: "Shop now →" CTA linking to `?product=<slug>`
   - Back button navigates to `?page=editorial`

### Success Criteria

- Editorial Hub renders all published posts in the magazine grid; no expired flash-sale cards visible
- Category filter correctly hides/shows posts by type
- Flash-sale card shows live countdown — seconds decrement in real time
- Clicking "Claim Offer" on a valid, non-expired offer stores discount in localStorage and shows toast
- Clicking "Claim Offer" when another offer is active triggers replace confirmation
- Disabled "Claim Offer" on expired offer shows tooltip "This offer has ended"
- Champions band renders all champion-type posts with photo and favourite product chip
- Post detail view renders body text with correct formatting
- `?page=editorial` route works from direct URL

### Depends On

Phase 1 (posts and discounts tables + queries must exist)

---

## Phase 3 — Discount Cart Integration

**Goal:** The active discount claimed from the Editorial Hub is reflected everywhere money is shown — the cart drawer, the checkout summary, and the final order record — creating a complete, seamless discount redemption flow.

**Requirements covered:** OFF-09, DISC-01, DISC-02, DISC-03

### Tasks

1. **`src/lib/useCart.ts`** — Extend with discount awareness
   - Add `activeDiscount: { code: string; discountType: "percent" | "flat"; amount: number } | null` derived by reading `twc_active_discount` from `localStorage`
   - Add `clearDiscount()` function: removes `twc_active_discount` key from localStorage
   - Add `discountedSubtotal` computed value: apply discount to `subtotal` (`percent`: `subtotal * (1 - amount/100)`, `flat`: `max(0, subtotal - amount)`)
   - `clearCart()` now also calls `clearDiscount()` (so discount is removed on order completion)

2. **`src/components/CartDrawer.tsx`** — Show active discount
   - If `activeDiscount` is set, render an "Active offer" section between the item list and the subtotal line:
     - Glassmorphism pill: `[CODE] ✓` with a × remove button (calls `clearDiscount()`)
     - Strike-through original subtotal
     - Discounted subtotal in `natural-accent` color
     - Savings line: "You save ₹X" or "You save X%"
   - "Checkout" CTA still navigates to `?view=checkout` — discount is in localStorage, CheckoutPage reads it

3. **`src/components/CheckoutPage.tsx`** — Show discount in order summary
   - Read `activeDiscount` from `useCart()`
   - Order summary section shows: subtotal, discount line (`−₹X` / `−X% [CODE]` in green), total after discount
   - "Place Order" button passes `discountCode` to `submitOrder` mutation

4. **`convex/orders.ts`** — Accept and re-validate discount at submit time
   - `submitOrder` mutation: if `discountCode` is provided in the payload:
     - Re-calls the same validation logic as `validateDiscount` (server-side re-check)
     - If valid: calls `claimDiscount`-equivalent logic (increments `usageCount`) — note: `claimDiscount` was already called at "Claim Offer" click time in Phase 2, so this is a safety double-check; if `usageCount` would exceed `maxUses`, reject with `ConvexError("Discount no longer valid")`
     - Stores `discountCode` on the order document
     - Applies discount to the stored `subtotal` field (server-computed, not trusting client total)
   - `submitOrder` without `discountCode` behaves as before

5. **`src/components/OrderConfirmation.tsx`** — Show discount applied
   - If order has `discountCode`, show a "Discount applied: [CODE] — saved ₹X" line in the order summary

### Success Criteria

- Cart drawer shows discount pill, savings, and discounted total when `twc_active_discount` is set
- Removing the discount pill via × clears localStorage and hides the section immediately
- Checkout order summary shows original subtotal, discount line, and discounted total
- `submitOrder` stores `discountCode` on the Convex order document
- If `maxUses` was just reached between claim and checkout, server rejects with a clear error message ("Discount no longer valid — it was claimed by another user")
- `clearCart()` also clears `twc_active_discount` from localStorage
- OrderConfirmation shows "saved ₹X" line when discount was used
- Discount is not applied if cart is empty at checkout (UI-level guard)

### Depends On

Phase 1 (discounts table + mutations); Phase 2 (`twc_active_discount` localStorage key must be written by Claim Offer flow)

---

## Milestone Completion Criteria (v4.0)

- [ ] EDI-01 through EDI-05 verified (Phase 1)
- [ ] OFF-01 through OFF-05 verified (Phase 1)
- [ ] CMS-01 through CMS-05 verified (Phase 1)
- [ ] HUB-01 through HUB-09 verified (Phase 2)
- [ ] OFF-06 through OFF-08 verified (Phase 2)
- [ ] OFF-09, DISC-01 through DISC-03 verified (Phase 3)
- [ ] End-to-end: admin creates flash sale + discount → user claims offer → discount shown in cart → order submitted with discount code stored → admin sees discount code on order

---
*Roadmap created: 2026-05-15*
*Next step: `/gsd-plan-phase 1`*
