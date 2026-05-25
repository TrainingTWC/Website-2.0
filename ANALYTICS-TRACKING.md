# Analytics Tracking Reference — Third Wave Coffee v8.0

> Complete inventory of every data point we capture: what it is, why we capture it, exactly how it is collected, where it is stored, and how it surfaces on the admin Funnel dashboard.

---

## How the System Works (Architecture)

```
Browser → src/lib/analytics.ts → convex/funnel.ts → Convex DB
                                                          ↕
                              src/components/admin/FunnelDashboard.tsx
```

1. **Client tracker** (`src/lib/analytics.ts`) runs in the browser. It buffers events and flushes them to Convex every 5 seconds (or when 20 events accumulate).
2. **Convex mutations** (`convex/funnel.ts`) receive batches and write to the database. They are unauthenticated so anonymous shoppers never need an account.
3. **Convex queries** (`convex/funnel.ts`) are admin-gated. The dashboard calls them with a time-range (24H / 7D / 30D) and renders the results live via Convex's reactive `useQuery`.
4. **Dashboard** (`src/components/admin/FunnelDashboard.tsx`) shows 10 sections under the "Funnel" tab in the Admin panel.

---

## Identity & Session Model

| Concept | Storage | Lifespan | Purpose |
|---|---|---|---|
| `anonId` | `localStorage` key `twc_anon_id` | Permanent (until clear) | Links all events + cart snapshots from one browser across sessions |
| `sessionId` | In-memory only (generated on page load) | Single page-load | Groups events into a funnel "visit"; a new tab or reload = new session |

Neither ID stores PII. They are random UUIDs.

---

## Database Tables

### `customerEventsAnonymous`
Every behavioural event from every shopper.

| Column | Type | What it holds |
|---|---|---|
| `anonId` | string | Browser fingerprint (localStorage UUID) |
| `sessionId` | string | Per-visit UUID (in-memory) |
| `ts` | number | Unix timestamp (ms) |
| `name` | string | Event name (see full list below) |
| `stage` | number? | Funnel stage number 1–10 |
| `route` | string? | `window.location.pathname` when event fired |
| `propsJson` | string | JSON payload (max 4 KB), event-specific fields |
| `device` | "mobile"\|"tablet"\|"desktop"? | Screen-width heuristic |
| `connection` | string? | `navigator.connection.effectiveType` (e.g. "4g") |
| `referrer` | string? | `document.referrer` from first event this session |
| `utmSource` | string? | `?utm_source=` first-touch for session |
| `utmMedium` | string? | `?utm_medium=` first-touch |
| `utmCampaign` | string? | `?utm_campaign=` first-touch |

**Indexes:** `by_session`, `by_anon`, `by_name_ts`, `by_ts`

---

### `cartSnapshots`
One row per anonymous shopper. Upserted on every cart change.

| Column | Type | What it holds |
|---|---|---|
| `anonId` | string | Links to the shopper's browser fingerprint |
| `sessionId` | string | Session ID at time of last update |
| `updatedAt` | number | Timestamp of last update (used to detect abandonment: idle > 30 min) |
| `itemsJson` | string | Full JSON array of `{productId, qty, price, name}` |
| `itemCount` | number | Total units in cart (for quick queries) |
| `subtotal` | number | ₹ value without discounts |
| `lastEventName` | string? | Last event name at time of snapshot (e.g. `cart_item_added`) |
| `lastRoute` | string? | Page the shopper was on when snapshot was written |
| `converted` | boolean | `true` after `markCartConverted()` is called on order success |
| `abandonedAt` | number? | Timestamp set when we detect abandonment (reserved for future recovery flow) |
| `contactPhone` | string? | Phone from checkout form — written only at checkout submit |
| `contactEmail` | string? | Email from checkout form — written only at checkout submit |

**Indexes:** `by_anon`, `by_session`, `by_updatedAt`, `by_converted`

**Important:** contact fields are **never written from event tracking** — only from the explicit checkout form submission path, so all event rows stay truly anonymous.

---

### `clientErrors`
Every uncaught JS error, unhandled promise rejection, and API failure.

| Column | Type | What it holds |
|---|---|---|
| `anonId` | string? | Shopper ID (may be absent if error happens before bootstrap) |
| `sessionId` | string? | Session ID |
| `ts` | number | Timestamp |
| `route` | string? | Page where error occurred |
| `type` | string | `"js"` / `"unhandled_rejection"` / `"api"` / `"offline"` |
| `message` | string | Error message (capped at 500 chars) |
| `stack` | string? | Stack trace (capped at 2 000 chars) |
| `userAgent` | string? | Full `navigator.userAgent` |
| `extraJson` | string? | Structured context (e.g. `{mutation: "submitOrder", method: "upi"}`) |

**Indexes:** `by_ts`, `by_type`

---

### `funnelSummary`
Reserved for future pre-aggregated cron summaries (currently unused by live queries — all aggregation happens in-query over raw events).

| Column | Type | What it holds |
|---|---|---|
| `key` | string | Aggregation key |
| `windowDays` | number | Time window (1 / 7 / 30 / 90) |
| `sessions` | number | Session count |
| `updatedAt` | number | When row was last written |

**Index:** `by_key_window`

---

## Every Event We Track

### Auto-tracked by `bootstrapAnalytics()` (fires on every page load)

| Event name | Stage | Props | Why | Source |
|---|---|---|---|---|
| `page_view` | 1 | `{path}` | Entry point for every funnel — without this we can't count sessions | `bootstrapAnalytics()` in `AnalyticsBootstrap.tsx` |
| `tab_hidden` | — | — | Detects comparison shopping (shopper switches to another tab mid-browse) | `visibilitychange` listener |
| `tab_visible` | — | — | Pairs with `tab_hidden` to measure return rate | `visibilitychange` listener |
| `rage_click` | — | `{tag, id, cls}` | 3+ clicks on same element within 1 s = frustrated user, broken UI element | Click counter heuristic |
| `dead_click` | — | `{tag, txt}` | Click on non-interactive element (no `a`, `button`, `input`, etc.) = confusing UI | Click target heuristic |

### Auto-tracked: errors & network

| Event | How stored | Props | Why |
|---|---|---|---|
| Uncaught JS error | `clientErrors` (via `logError`) | `{type:"js", message, stack, userAgent}` | Surfaces broken functionality before shoppers report it |
| Unhandled Promise rejection | `clientErrors` | `{type:"unhandled_rejection", message, stack}` | Async bugs in cart/checkout that look silent to the user |
| Network offline | `clientErrors` | `{type:"offline", message:"offline"}` | Tells us if shoppers drop off because of connectivity vs. UX problems |

### Product discovery (wired in `ProductPage.tsx`)

| Event | Stage | Props | Why | Dashboard |
|---|---|---|---|---|
| `product_viewed` | 2 | `{productId, name, price, type, category}` | Second stage of funnel — measures browse-to-cart gap; shows which products get views but not adds-to-cart | Funnel bar "Viewed product" |

> **Sampling:** `product_viewed` is tracked at **100%** (not sampled).

### Cart events (wired in `CartContext.tsx`)

| Event | Stage | Props | Why | Dashboard |
|---|---|---|---|---|
| `cart_item_added` | 3 | `{productId, qty}` | Core funnel stage — the single most important engagement signal | Funnel bar "Added to cart"; Daily trend "carts" count |
| `cart_item_removed` | 3 | `{productId}` | Measures regret / friction — high removal rate on a product = pricing or content problem | Dropout hotspots if it's the last event |
| `cart_item_quantity_changed` | 3 | `{productId, delta}` | Measures upsell effectiveness — are shoppers increasing or decreasing qty? | Dropout hotspots |
| `cart_emptied_manually` | 3 | — | Hard abandonment signal — shopper actively cleared the cart | Dropout hotspots |

### Cart snapshot (wired in `CartPanel.tsx`)

Not an event — a **upsert** to `cartSnapshots` on every cart change. Written by `snapshotCart()`.

| What's captured | Why |
|---|---|
| Full `itemsJson` array with productId, qty, price, name | Needed to show "₹X lost in abandoned carts" and for future recovery emails |
| `subtotal` | Enables sorting abandoned carts by value so recovery effort goes to highest-value carts first |
| `lastEventName` | Shows what the shopper was doing when they abandoned |
| `lastRoute` | Shows which page they were on |
| `contactPhone` / `contactEmail` | Written **only at checkout submit** — enables recovery SMS/email flow for carts that reached checkout |
| `converted` flag | Set to `true` by `markConverted()` after successful order — prevents converting carts from showing in abandonment list |

The `CartPanel` also emits:

| Event | Stage | Props | Why | Dashboard |
|---|---|---|---|---|
| `cart_viewed` | 3 | `{itemCount, subtotal}` | Measures how often shoppers open the cart panel vs. proceeding — high view-without-checkout rate = friction in cart-to-checkout step | Dropout hotspots |

### Checkout events (wired in `CheckoutPage.tsx`)

| Event | Stage | Props | Why | Dashboard |
|---|---|---|---|---|
| `checkout_initiated` | 5 | `{itemCount, subtotal}` | Measures the cart→checkout conversion step | Funnel bar "Started checkout" |
| `checkout_validation_failed` | 7 | `{fields: string[]}` | Counts how many people fail the form validation — high rate means confusing form fields | Friction tally / Dropout hotspots |
| `payment_method_selected` | 8 | `{method}` | Fired on every change of payment method — maps method popularity + detects switching (indecision) | Payment method mix chart |
| `payment_initiated` | 8 | `{method, total}` | Shopper pressed "Place Order" — the payment funnel stage | Funnel bar "Initiated payment"; Payment funnel |
| `order_confirmed` | 10 | `{orderId, method, total}` | Terminal success event — the goal of the entire funnel | Funnel bar "Ordered"; Daily trend "orders"; Conversion rate KPI |
| `payment_failed` | 9 | `{method, reason}` | Captures why orders fail (network, UPI timeout, etc.) | Payment funnel "Failed" stage + Failure reasons table |

After `order_confirmed`, `markConverted()` is called — this patches `cartSnapshots.converted = true` so the cart no longer appears in the abandonment list.

If the order API throws, `logError()` is also called, writing to `clientErrors` with `{type:"api", extra:{mutation:"submitOrder", method}}` so the error shows in the client errors feed.

---

## Sampling Policy

| Event type | Sample rate | Reason |
|---|---|---|
| `impression`, `pdp_dwell`, `scroll_depth` | 10% | High-volume passive events that would flood the DB — statistical sample is sufficient |
| All other events | 100% | Every cart, checkout, order, error, and friction event is too important to sample away |

---

## UTM Attribution (first-touch)

On the very first `track()` call of a session, `readUtm()` reads `?utm_source`, `?utm_medium`, `?utm_campaign` from the URL and `document.referrer`, then persists them to `sessionStorage` as `twc_session_utm`. Every subsequent event in that session inherits these values — even if the shopper navigates away from the landing page.

This gives us first-touch campaign attribution on every event including `order_confirmed`, letting us answer "which campaign drove the most orders?".

---

## Dashboard Sections

### 1. Range Picker
**What:** 24H / 7D / 30D toggle at the top-right of the Funnel tab.
**How:** Controls the `days` argument passed to all 8 Convex queries. All sections update reactively when the range changes.

---

### 2. KPI Tiles (4 cards)

| Tile | Metric | How calculated |
|---|---|---|
| **Sessions** | Count of unique `sessionId` values in `customerEventsAnonymous` within the window | `getFunnelOverview → sessions` |
| **Conversion %** | `order_confirmed` sessions ÷ total sessions | `getFunnelOverview → rates.conversionRate` |
| **Cart abandonment %** | Sessions that added to cart but never ordered ÷ sessions that added to cart | `getFunnelOverview → rates.cartAbandonRate` |
| **Lost cart value** | Sum of `cartSnapshots.subtotal` where `converted=false`, idle > 30 min, `itemCount > 0` | `getFunnelOverview → abandoned.value` |

---

### 3. Conversion Funnel Bar Chart

Six horizontal bars, each narrower than the last, with drop-% annotations:

| Bar | Event counted | Drop label |
|---|---|---|
| Sessions | Any session in window | — |
| Viewed product | Sessions with ≥1 `product_viewed` | % lost since Sessions |
| Added to cart | Sessions with ≥1 `cart_item_added` | % lost since Viewed |
| Started checkout | Sessions with ≥1 `checkout_initiated` | % lost since Cart |
| Initiated payment | Sessions with ≥1 `payment_initiated` | % lost since Checkout |
| Ordered | Sessions with ≥1 `order_confirmed` | % lost since Payment |

Source: `getFunnelOverview → funnel[]`

---

### 4. Daily Trend (3-line SVG chart)

Three lines plotted over the selected window (minimum 14 days):

| Line | Colour | Counts |
|---|---|---|
| Sessions | Olive | Unique `sessionId` per calendar day |
| Carts | Amber | `cart_item_added` events per day |
| Orders | Green | `order_confirmed` events per day |

Zero-filled for days with no data. Source: `getDailyTrend`

---

### 5. Dropout Hotspots Table

**What:** The most common *last event before abandonment* — i.e. what was the shopper doing right before they left?

**How:** For each session, find the latest event by `ts`. If that session never fired `order_confirmed`, count the event name as a dropout. Events are bucketed by name and sorted descending. Top 12 shown with the page route.

**Why:** If `cart_viewed` appears at the top, there's friction between the cart panel and checkout. If `payment_method_selected` appears, the payment form is causing drop-off.

Source: `getDropoutHotspots`

---

### 6. Abandoned Carts List

**What:** Top 10 cart snapshots (sorted by subtotal descending) that are not converted and have been idle > 30 minutes.

**Columns:** Lost value (₹), item count, time since last activity, last event name, last route, "recoverable" badge.

**"Recoverable" badge** = `hasContact: true` — means `contactEmail` or `contactPhone` was captured at checkout, so a recovery SMS/email is possible.

Source: `getAbandonedCarts`

---

### 7. Payment Funnel + Method Mix + Failure Reasons

**Three sub-sections:**

**Funnel bars:**
| Stage | Event |
|---|---|
| Payment initiated | `payment_initiated` |
| Attempt sent | `payment_attempted` (reserved for future gateway webhook) |
| Failed | `payment_failed` |
| Order confirmed | `order_confirmed` |

**Method mix table:** Counts of each `method` value from `payment_initiated.propsJson`.

**Failure reasons table:** Top 5 `reason` strings from `payment_failed.propsJson`, sorted by frequency. Shows you whether failures are "UPI timeout", "insufficient funds", network errors, etc.

Source: `getPaymentFunnel`

---

### 8. Conversion by Device

**What:** Sessions, orders, and conversion rate broken down by `mobile` / `tablet` / `desktop`.

**How:** Device is detected from `window.innerWidth` at event-fire time: <640 px = mobile, <1024 px = tablet, ≥1024 px = desktop. Stored on every event row.

**Gap insight:** Below the table, if mobile and desktop both have data, the dashboard shows the mobile−desktop conversion gap (red if mobile converts worse, green if better).

Source: `getDeviceBreakdown`

---

### 9. Friction Signals Tally

**What:** Count of each friction event name across all sessions in the window.

| Signal | Meaning |
|---|---|
| `rage_click` | 3+ clicks same element <1 s — user is frustrated / element not responding |
| `dead_click` | Click on non-interactive element — user thinks something is clickable that isn't |
| `slow_action` | Reserved — will be wired to slow mutation responses |
| `field_invalid` | Reserved — checkout form validation failures per field |
| `modal_dismissed` | Reserved — upsell / discount modal closed without action |
| `browser_back_in_checkout` | Reserved — browser back button used during checkout flow |

Source: `getFrictionEvents`

---

### 10. Recent Client Errors Feed

**What:** Last 10 JS errors, unhandled rejections, and API failures from the selected window.

**Columns:** Error message (truncated, monospaced), error type badge, route where it happened, time ago.

**Why:** Surfaces silent JS crashes that break the checkout without triggering customer support tickets. Stack trace (first 400 chars) is available in the raw data for debugging.

Source: `getRecentClientErrors`

---

## What Is NOT Tracked

- **Server-side order data** — revenue, product breakdown, fulfilment status — those come from `convex/orders.ts` and are shown on the existing Analytics/Orders tabs, not the Funnel tab.
- **Authenticated user identity** — the Funnel system never reads Convex auth. Everything is anonymous.
- **Scroll depth / dwell time** — these event names exist in the sampler (`pdp_dwell`, `scroll_depth`) but are not yet wired to any UI component. When wired, they will be sampled at 10%.
- **Impression tracking** — the event name `impression` is defined and sampled at 10% but not yet wired.

---

## Adding a New Tracked Event

1. Call `track("my_event_name", { ...props }, { stage: N })` from the relevant component.
2. If you want it to appear in the dropout hotspots, do nothing extra — it will be counted automatically as a potential last-event before abandonment.
3. If you want a dedicated chart/section, add a query in `convex/funnel.ts` and a section in `FunnelDashboard.tsx`.
4. Run `npx convex deploy --yes` to deploy the function, then rebuild.
