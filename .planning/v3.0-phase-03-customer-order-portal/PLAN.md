---
phase: "03-customer-order-portal"
plan: "03-01"
milestone: "v3.0"
type: "feature"
wave: 1
depends_on:
  - "v2.0 Phase 2 — orders table in Convex (shipped)"
  - "v1.1 Phase 1 — MISTRAL_API_KEY configured (shipped)"
files_modified:
  - convex/schema.ts (MODIFY — add notes field to orders)
  - convex/orders.ts (MODIFY — add cancelOrder, addOrderNote mutations)
  - convex/support.ts (CREATE — answerSupportQuery action)
  - src/components/OrderPortal.tsx (CREATE)
  - src/components/OrderConfirmation.tsx (MODIFY — add "Track order" link)
  - src/App.tsx (MODIFY — add order-portal route + footer link)
autonomous: true
must_haves:
  truths:
    - No user accounts or login — order ID is the only token
    - Cancel is only available when status === "pending"
    - AI chat uses existing MISTRAL_API_KEY — no new env vars
    - Chat history lives in component state only (not persisted to Convex)
    - Deep link ?page=order-portal&id=TWC-XXXXXXXX must work without manual entry
  artifacts:
    - convex/support.ts with answerSupportQuery action
    - convex/orders.ts with cancelOrder and addOrderNote mutations
    - src/components/OrderPortal.tsx — full self-service portal
    - "Track your order" link on OrderConfirmation page
    - ?page=order-portal route in App.tsx
---

# Plan: Customer Order Portal

## Goal

A zero-login self-service screen where customers look up their order by ID, track real-time status, cancel if still pending, and get instant AI support chat — all without needing an account.

---

## Task 1 — Update `convex/schema.ts`

**Files:** `convex/schema.ts` (MODIFY)

**Steps:**

Add optional `notes` field to the `orders` table:

```ts
notes: v.optional(v.array(v.object({
  role: v.union(v.literal("customer"), v.literal("system")),
  message: v.string(),
  ts: v.number(),
}))),
```

Place this field at the end of the orders table object, after existing fields.

---

## Task 2 — Update `convex/orders.ts`

**Files:** `convex/orders.ts` (MODIFY)

**Steps:**

1. Add `cancelOrder` mutation:
   ```ts
   export const cancelOrder = mutation({
     args: { orderId: v.string() },
     handler: async (ctx, { orderId }) => {
       const order = await ctx.db
         .query("orders")
         .withIndex("by_orderId", q => q.eq("orderId", orderId))
         .unique();
       if (!order) throw new ConvexError("Order not found.");
       if (order.status !== "pending") {
         throw new ConvexError(`Cannot cancel — order is already ${order.status}.`);
       }
       await ctx.db.patch(order._id, { status: "cancelled" });
     },
   });
   ```

2. Add `addOrderNote` mutation:
   ```ts
   export const addOrderNote = mutation({
     args: {
       orderId: v.string(),
       message: v.string(),
       role: v.union(v.literal("customer"), v.literal("system")),
     },
     handler: async (ctx, { orderId, message, role }) => {
       const order = await ctx.db
         .query("orders")
         .withIndex("by_orderId", q => q.eq("orderId", orderId))
         .unique();
       if (!order) throw new ConvexError("Order not found.");
       const existing = order.notes ?? [];
       await ctx.db.patch(order._id, {
         notes: [...existing, { role, message, ts: Date.now() }],
       });
     },
   });
   ```

3. Add `import { ConvexError } from "convex/values"` if not already imported.

---

## Task 3 — Create `convex/support.ts`

**Files:** `convex/support.ts` (CREATE)

**Steps:**

1. Header:
   ```ts
   "use node";
   import { action } from "./_generated/server";
   import { v } from "convex/values";
   ```

2. TWC support persona system prompt constant:
   ```ts
   const SUPPORT_SYSTEM_PROMPT = `You are a friendly and knowledgeable support agent for Third Wave Coffee (TWC), an Indian specialty coffee brand. 
   You help customers with their orders. Be warm, concise, and helpful. Answer in 1-3 sentences max.
   
   Policies:
   - Estimated delivery: 3–7 business days after order confirmation
   - Returns/refunds: prepaid returns accepted within 7 days of delivery for damaged/wrong items
   - Order modifications: not possible after confirmation; cancellation only available while status is "pending"
   - Contact: support@thirdwavecoffee.in or WhatsApp +91-XXXXXXXXXX
   
   Always reference the customer's specific order context when answering. If asked about something outside your knowledge, politely redirect to the contact email.`;
   ```

3. Export `answerSupportQuery` action:
   ```ts
   export const answerSupportQuery = action({
     args: {
       question: v.string(),
       orderContext: v.object({
         orderId: v.string(),
         status: v.string(),
         itemCount: v.number(),
         total: v.number(),
         customerName: v.string(),
         city: v.string(),
       }),
     },
     handler: async (ctx, { question, orderContext }) => {
       const apiKey = process.env.MISTRAL_API_KEY;
       if (!apiKey) return { answer: "Support is temporarily unavailable. Please email support@thirdwavecoffee.in." };

       const orderSummary = `Order ${orderContext.orderId} | Status: ${orderContext.status} | ${orderContext.itemCount} item(s) | Total: ₹${orderContext.total} | Customer: ${orderContext.customerName} | City: ${orderContext.city}`;

       const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
         method: "POST",
         headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
         body: JSON.stringify({
           model: "mistral-small-latest",
           messages: [
             { role: "system", content: SUPPORT_SYSTEM_PROMPT },
             { role: "user", content: `Order context: ${orderSummary}\n\nCustomer question: ${question}` },
           ],
           max_tokens: 200,
           temperature: 0.4,
         }),
       });

       if (!res.ok) return { answer: "I'm having trouble connecting right now. Please try again or email support@thirdwavecoffee.in." };
       const data = await res.json();
       const answer = data?.choices?.[0]?.message?.content?.trim() ?? "I couldn't find an answer. Please contact support@thirdwavecoffee.in.";
       return { answer };
     },
   });
   ```

---

## Task 4 — Create `src/components/OrderPortal.tsx`

**Files:** `src/components/OrderPortal.tsx` (CREATE)

**Steps:**

### 4a — Lookup Screen

Render when no `orderId` is known:

```tsx
// State: inputId (string), lookupError (string | null)
// On submit: navigate to ?page=order-portal&id={inputId.toUpperCase().trim()}
// Validate format: /^TWC-[A-Z0-9]{8}$/i before navigating

<div className="min-h-screen bg-natural-bg flex items-center justify-center px-4">
  <div className="w-full max-w-md bg-natural-paper rounded-3xl shadow-lg p-8 space-y-6">
    {/* TWC logo icon */}
    <div className="text-center space-y-2">
      <h1 className="font-serif text-2xl font-bold text-natural-text">Track Your Order</h1>
      <p className="text-sm text-natural-muted">Enter your Order ID to see live status and get support</p>
    </div>
    <form onSubmit={handleLookup} className="space-y-4">
      <input
        value={inputId}
        onChange={e => setInputId(e.target.value.toUpperCase())}
        placeholder="TWC-XXXXXXXX"
        className="w-full border border-natural-border rounded-xl px-4 py-3 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-natural-accent"
      />
      {lookupError && <p className="text-red-500 text-xs">{lookupError}</p>}
      <button type="submit" className="w-full bg-natural-accent text-white rounded-xl py-3 font-bold text-sm hover:opacity-90 transition">
        Track Order
      </button>
    </form>
    <p className="text-center text-xs text-natural-muted">
      Order ID was sent to your email after placing the order
    </p>
  </div>
</div>
```

### 4b — Order Detail Screen

Fetch: `const order = useQuery(api.orders.getOrder, { orderId })` — shows loading skeleton while undefined.

**Header bar:**
- Back arrow → navigates to `?page=order-portal` (clears id param)
- Order ID in mono font
- Status badge: amber/blue/violet/green/red per status

**Order Summary section:**
- Grid of items (image + name + qty × price)
- Subtotal, Shipping, Total row at bottom

**Delivery Address section:**
- Formatted address block from `order.customer.address`
- Customer name + phone

**Order Timeline:**
- 5 steps: Placed → Confirmed → Shipped → Delivered (+ Cancelled branch)
- Steps before/at current status: filled circle + colored line
- Steps after: empty circle + gray line
- Cancelled: all steps gray except "Placed" and "Cancelled" (red)
- Implementation: array of status labels, map to `<div>` with conditional classes

**Payment Status section:**
- If `order.razorpayPaymentId`: green "Paid ✓" badge + last 6 chars of payment ID
- Else: amber "Payment Pending" badge

**Cancel Order section:**
- Shown ONLY if `order.status === "pending"`
- Red outline "Cancel Order" button
- Clicking opens a modal: "Are you sure you want to cancel TWC-XXXXXXXX? This cannot be undone."
- Modal: "Yes, cancel" (red) + "Keep order" (outline) buttons
- "Yes, cancel" → calls `useMutation(api.orders.cancelOrder)` → closes modal → status badge updates live via Convex subscription

**AI Support Chat section:**
- "Need help? Chat with support" toggle button (MessageCircle icon)
- Animates open/close with `AnimatePresence` from `motion/react`
- When open:
  - Message list: `[{ role: "user" | "assistant", text: string }]` in component state
  - Initial message on open: assistant says "Hi [customer.name]! I'm here to help with your order TWC-XXXXXXXX. What would you like to know?"
  - Suggested prompts (chips): "Where is my order?", "How do I return an item?", "When will it arrive?", "Contact support"
  - Clicking a chip: sends it as user message
  - Input + send button at bottom
  - On send: append user message → call `useMutation(api.support.answerSupportQuery)` with question + orderContext → append assistant reply
  - Typing indicator (three dots animation) while awaiting reply
  - `orderContext` = `{ orderId, status, itemCount: items.length, total, customerName: customer.name, city: customer.address.city }`

---

## Task 5 — Update `src/components/OrderConfirmation.tsx`

**Files:** `src/components/OrderConfirmation.tsx` (MODIFY)

**Steps:**

After the "Continue Shopping" button, add:
```tsx
<button
  onClick={() => navigateTo({ page: "order-portal", id: orderId })}
  className="text-sm text-natural-accent underline underline-offset-2 hover:opacity-80"
>
  Track your order →
</button>
```

The `navigateTo` prop / function is already available in this component.

---

## Task 6 — Update `src/App.tsx`

**Files:** `src/App.tsx` (MODIFY)

**Steps:**

1. Import `OrderPortal` from `"./components/OrderPortal"`.

2. In the route resolution block (alongside `checkout` / `order-confirmation` checks):
   ```ts
   const orderPortalId = params.get("id") ?? undefined;
   if (page === "order-portal") {
     return (
       <div className="min-h-screen bg-natural-bg text-natural-text font-sans">
         <OrderPortal initialOrderId={orderPortalId} />
         <ToastContainer toasts={toasts} />
       </div>
     );
   }
   ```

3. In the main site footer (near the bottom of the return JSX), add a small link:
   ```tsx
   <button
     onClick={() => navigateTo({ page: "order-portal" })}
     className="text-xs text-natural-muted hover:text-natural-text transition-colors underline underline-offset-2"
   >
     Track your order
   </button>
   ```

4. `OrderPortal` props interface: `{ initialOrderId?: string }` — if provided, skip lookup screen and go straight to detail.

---

## Verification

- [ ] `?page=order-portal` renders lookup screen
- [ ] Entering valid TWC-XXXXXXXX shows order detail
- [ ] Entering invalid ID shows inline "Order not found" error
- [ ] Status badge and timeline reflect live Convex data
- [ ] Cancel button only visible for status === "pending"
- [ ] Cancel flow: confirm modal → mutation → status updates to "cancelled" immediately
- [ ] Payment status shows "Paid" with partial payment ID when razorpayPaymentId exists
- [ ] Support chat opens, sends first greeting automatically
- [ ] Suggested prompt chips send as user messages
- [ ] AI replies are contextual (reference the order's status/items)
- [ ] Deep link `?page=order-portal&id=TWC-XXXXXXXX` skips lookup, shows order directly
- [ ] "Track your order" link appears on OrderConfirmation page
- [ ] "Track your order" appears in main site footer
- [ ] Mobile layout: single column, chat panel full width
