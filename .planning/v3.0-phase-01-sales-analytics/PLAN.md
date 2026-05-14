---
phase: "01-sales-analytics"
plan: "01-01"
milestone: "v3.0"
type: "feature"
wave: 1
depends_on: ["v2.0 Phase 2 — orders table in Convex (shipped)"]
files_modified:
  - convex/analytics.ts (CREATE)
  - src/components/admin/SalesAnalytics.tsx (CREATE)
  - src/components/admin/AdminDashboard.tsx (MODIFY — add Analytics tab)
autonomous: true
must_haves:
  truths:
    - All data comes from the existing `orders` table — no schema changes
    - Zero npm dependencies for charts — inline SVG only
    - Only confirmed/shipped/delivered orders count toward revenue
  artifacts:
    - convex/analytics.ts with 4 named exports: getSalesOverview, getDailyRevenue, getTopProducts, getOrderStatusBreakdown
    - SalesAnalytics.tsx renders all 4 data shapes (KPI cards, sparkline, top products, doughnut)
    - AdminDashboard "Analytics" tab active by default
---

# Plan: Admin Sales Analytics Dashboard

## Goal

Give the merchant a live business pulse inside the admin panel — revenue, order volume, best-selling products, and daily trend — without leaving the app or installing any charting library.

---

## Task 1 — Create `convex/analytics.ts`

**Files:** `convex/analytics.ts` (CREATE)

**Steps:**

1. Add `"use node"` if needed — actually pure query, no node. Just `import { query } from "./_generated/server"`.

2. Export `getSalesOverview`:
   ```ts
   export const getSalesOverview = query({
     handler: async (ctx) => {
       const orders = await ctx.db.query("orders").collect();
       const countable = ["confirmed", "shipped", "delivered"];
       const revenue = orders
         .filter(o => countable.includes(o.status))
         .reduce((sum, o) => sum + (o.total ?? o.subtotal), 0);
       const totalOrders = orders.length;
       const completedOrders = orders.filter(o => countable.includes(o.status)).length;
       const avgOrderValue = completedOrders > 0 ? revenue / completedOrders : 0;
       const pendingOrders = orders.filter(o => o.status === "pending").length;
       return { totalRevenue: revenue, totalOrders, avgOrderValue, pendingOrders };
     },
   });
   ```

3. Export `getDailyRevenue`:
   ```ts
   export const getDailyRevenue = query({
     args: { days: v.optional(v.number()) },
     handler: async (ctx, { days = 30 }) => {
       const since = Date.now() - days * 24 * 60 * 60 * 1000;
       const orders = await ctx.db
         .query("orders")
         .filter(q => q.gte(q.field("_creationTime"), since))
         .collect();
       const countable = ["confirmed", "shipped", "delivered"];
       const buckets: Record<string, { revenue: number; orderCount: number }> = {};
       for (const o of orders) {
         const date = new Date(o._creationTime).toISOString().slice(0, 10);
         if (!buckets[date]) buckets[date] = { revenue: 0, orderCount: 0 };
         if (countable.includes(o.status)) buckets[date].revenue += (o.total ?? o.subtotal);
         buckets[date].orderCount += 1;
       }
       return Object.entries(buckets)
         .map(([date, v]) => ({ date, ...v }))
         .sort((a, b) => a.date.localeCompare(b.date));
     },
   });
   ```

4. Export `getTopProducts`:
   ```ts
   export const getTopProducts = query({
     handler: async (ctx) => {
       const orders = await ctx.db.query("orders").collect();
       const map: Record<string, { name: string; qty: number; revenue: number }> = {};
       for (const o of orders) {
         for (const item of o.items ?? []) {
           if (!map[item.productId]) map[item.productId] = { name: item.name, qty: 0, revenue: 0 };
           map[item.productId].qty += item.qty;
           map[item.productId].revenue += item.qty * item.price;
         }
       }
       return Object.values(map)
         .sort((a, b) => b.qty - a.qty)
         .slice(0, 10);
     },
   });
   ```

5. Export `getOrderStatusBreakdown`:
   ```ts
   export const getOrderStatusBreakdown = query({
     handler: async (ctx) => {
       const orders = await ctx.db.query("orders").collect();
       const result: Record<string, number> = { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
       for (const o of orders) result[o.status] = (result[o.status] ?? 0) + 1;
       return result;
     },
   });
   ```

6. Add `import { v } from "convex/values"` at top.

---

## Task 2 — Create `src/components/admin/SalesAnalytics.tsx`

**Files:** `src/components/admin/SalesAnalytics.tsx` (CREATE)

**Steps:**

1. Import from convex:
   ```ts
   import { useQuery } from "convex/react";
   import { api } from "../../../convex/_generated/api";
   ```

2. Import lucide icons: `TrendingUp`, `ShoppingBag`, `BarChart2`, `Clock`, `Package`.

3. **Date range state**: `const [days, setDays] = useState(30)` — drives `getDailyRevenue` arg.

4. **4 queries** at top of component:
   ```ts
   const overview = useQuery(api.analytics.getSalesOverview);
   const daily = useQuery(api.analytics.getDailyRevenue, { days });
   const topProducts = useQuery(api.analytics.getTopProducts);
   const statusBreakdown = useQuery(api.analytics.getOrderStatusBreakdown);
   ```

5. **KPI cards row** — 4 cards in `grid grid-cols-2 lg:grid-cols-4 gap-4`:
   - Total Revenue: `₹{overview.totalRevenue.toLocaleString("en-IN")}`, icon TrendingUp, green accent
   - Total Orders: `{overview.totalOrders}`, icon ShoppingBag, blue accent
   - Avg Order Value: `₹{overview.avgOrderValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, icon BarChart2, purple accent
   - Pending: `{overview.pendingOrders}`, icon Clock, amber accent

6. **Date range pills** — `["7D", "30D", "90D"].map(...)` → button row above sparkline. Active pill has filled background.

7. **Revenue sparkline** (pure SVG):
   - Normalize daily values to fit in a `viewBox="0 0 600 120"` SVG
   - `max = Math.max(...daily.map(d => d.revenue), 1)`
   - Each point: `x = (i / (daily.length - 1)) * 580 + 10`, `y = 110 - (d.revenue / max) * 100`
   - Render as `<polyline>` with `strokeWidth="2"` and a fill `<polygon>` with `opacity="0.1"` for area effect
   - X-axis: render first + last + middle date labels as `<text>` elements
   - Empty state: "No revenue data for this period"

8. **Top Products table**:
   - Columns: # | Product | Units Sold | Revenue
   - `topProducts.map((p, i) => <tr>...)` — alternating row bg
   - Revenue formatted as `₹X,XXX`

9. **Status doughnut** (SVG arc ring):
   - `viewBox="0 0 120 120"`, center `60 60`, `r=50`, `strokeWidth=16`
   - Total = sum of all statuses; each segment: `circumference = 2 * π * 50 ≈ 314.16`
   - Each segment: `strokeDasharray = (count/total)*314 + " " + 314`, `strokeDashoffset` = cumulative offset
   - Colors: pending=`#F59E0B`, confirmed=`#3B82F6`, shipped=`#8B5CF6`, delivered=`#10B981`, cancelled=`#EF4444`
   - Legend row beneath each segment label + count
   - Empty state: "No orders yet" centered text in ring

10. Layout: stack cards → date range + chart → two-column (top products | doughnut) on lg, single col on mobile.

---

## Task 3 — Wire into AdminDashboard

**Files:** `src/components/admin/AdminDashboard.tsx` (MODIFY)

**Steps:**

1. Import `SalesAnalytics` from `./SalesAnalytics`.
2. Add `"analytics"` to the tab type union / array.
3. Add tab button: `<BarChart2>` icon + "Analytics" label.
4. Change default active tab from `"products"` (or `"orders"`) to `"analytics"`.
5. Add `{activeTab === "analytics" && <SalesAnalytics />}` in the tab body.

---

## Verification

- [ ] Open admin panel → Analytics tab is default and renders without errors
- [ ] KPI cards show real numbers from Convex orders (not hardcoded)
- [ ] 7D / 30D / 90D pills switch chart data
- [ ] Top products table shows products from real order items
- [ ] Status doughnut segments sum to 100% (or empty state when no orders)
- [ ] No console errors; no new npm packages in package.json
