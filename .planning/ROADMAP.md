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
