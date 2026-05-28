import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin, getCallerAdmin } from "./authHelpers";
import { computeEffectiveMOQ, applyCustomerMultiplier } from "./inventory";

// Revenue-counting statuses
const REVENUE_STATUSES = new Set(["confirmed", "shipped", "delivered"]);

// Atomically maintain the orderSummary singleton (Fix #3)
async function upsertOrderSummary(
  ctx: any,
  oldStatus: string | null,
  newStatus: string,
  orderTotal: number
) {
  const existing = await ctx.db
    .query("orderSummary")
    .withIndex("by_key", (q: any) => q.eq("key", "global"))
    .first();

  const base = existing
    ? { ...existing }
    : {
        key: "global" as const,
        totalRevenue: 0,
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        avgOrderValue: 0,
        updatedAt: 0,
      };

  if (oldStatus && REVENUE_STATUSES.has(oldStatus)) {
    base.totalRevenue -= orderTotal;
    base.completedOrders = Math.max(0, base.completedOrders - 1);
  } else if (oldStatus === "pending") {
    base.pendingOrders = Math.max(0, base.pendingOrders - 1);
  } else if (oldStatus === "cancelled") {
    base.cancelledOrders = Math.max(0, base.cancelledOrders - 1);
  }

  if (REVENUE_STATUSES.has(newStatus)) {
    base.totalRevenue += orderTotal;
    base.completedOrders += 1;
  } else if (newStatus === "pending") {
    base.pendingOrders += 1;
  } else if (newStatus === "cancelled") {
    base.cancelledOrders += 1;
  }

  if (oldStatus === null) base.totalOrders += 1;

  base.avgOrderValue =
    base.completedOrders > 0 ? base.totalRevenue / base.completedOrders : 0;
  base.updatedAt = Date.now();

  if (existing) {
    await ctx.db.patch(existing._id, base);
  } else {
    await ctx.db.insert("orderSummary", base);
  }
}

function randomAlphaNum(len: number): string {
  // SECURITY (H-02): Use CSPRNG instead of Math.random() for order IDs.
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  const buf = new Uint32Array(len);
  crypto.getRandomValues(buf);
  for (let i = 0; i < len; i++) {
    out += chars[buf[i] % chars.length];
  }
  return out;
}

// ─── submitOrder ─────────────────────────────────────────────────────────────
export const submitOrder = mutation({
  args: {
    customer: v.object({
      name: v.string(),
      phone: v.string(),
      email: v.string(),
      address: v.object({
        line1: v.string(),
        line2: v.optional(v.string()),
        city: v.string(),
        state: v.string(),
        pincode: v.string(),
      }),
    }),
    items: v.array(
      v.object({
        productId: v.string(),
        name: v.string(),
        imageUrl: v.string(),
        qty: v.number(),
        price: v.number(), // client value accepted for receipt display; overwritten by server below
      })
    ),
    subtotal: v.number(),
    paymentMethod: v.optional(v.string()),
    discountCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // SECURITY (H-05): Rate-limit order submissions per phone number to
    // prevent bulk order spam. Max 5 orders per phone per hour.
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentByPhone = await ctx.db
      .query("orders")
      .withIndex("by_customerPhone", (q) => q.eq("customerPhone", args.customer.phone))
      .order("desc")
      .take(10);
    const recentCount = recentByPhone.filter((o) => o._creationTime > oneHourAgo).length;
    if (recentCount >= 5) {
      throw new ConvexError("Too many orders placed recently. Please wait before placing another order.");
    }

    const orderId = `TWC-${randomAlphaNum(8)}`;

    // ── Server-side price + inventory + MOQ verification ─────────────────
    // Re-fetches every product from DB: validates stock, enforces dynamic MOQ,
    // and builds serverItems with authoritative prices.
    let serverSubtotal = 0;
    const serverItems = [] as typeof args.items;
    for (const item of args.items) {
      if (item.qty < 1) {
        throw new ConvexError("Invalid item quantity.");
      }

      const product = await ctx.db.get(item.productId as Id<"products">);
      if (!product) throw new ConvexError(`Product not found: ${item.productId}`);

      // ── Inventory & MOQ checks (only when stockQty is tracked) ──────────
      if (product.stockQty != null) {
        if (product.stockStatus === "out-of-stock" || product.stockQty <= 0) {
          throw new ConvexError(`${product.name} is out of stock.`);
        }
        if (item.qty > product.stockQty) {
          const u = product.stockQty === 1 ? "unit" : "units";
          throw new ConvexError(
            `Only ${product.stockQty} ${u} available for ${product.name}.`
          );
        }

        // Velocity cache lookup (avgDailyDemand over the last 7 days)
        const velocityRow = await ctx.db
          .query("productVelocityCache")
          .withIndex("by_productId", (q) => q.eq("productId", product._id))
          .first();
        const dailyAvg = velocityRow?.avgDailyDemand ?? 0;

        // Customer-specific recent qty for this product (last 30 days)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const recentOrders = await ctx.db
          .query("orders")
          .withIndex("by_customerPhone", (q) =>
            q.eq("customerPhone", args.customer.phone)
          )
          .order("desc")
          .take(50);
        let recentCustomerQty = 0;
        for (const ord of recentOrders) {
          if (ord._creationTime < thirtyDaysAgo) break;
          const match = ord.items.find((i) => i.productId === item.productId);
          if (match) recentCustomerQty += match.qty;
        }

        const baseMax = computeEffectiveMOQ(
          product.stockQty,
          product.stockStatus,
          product.maxOrderQtyOverride,
          dailyAvg
        );
        const effectiveMax = applyCustomerMultiplier(
          baseMax,
          product.stockQty,
          recentCustomerQty
        );

        if (item.qty > effectiveMax) {
          const u = effectiveMax === 1 ? "unit" : "units";
          throw new ConvexError(
            `Maximum order quantity for ${product.name} is ${effectiveMax} ${u}.`
          );
        }
      }

      serverSubtotal += product.price * item.qty;
      serverItems.push({ ...item, price: product.price }); // override client price
    }

    if (Math.abs(serverSubtotal - args.subtotal) > 1) {
      throw new ConvexError("Order total mismatch. Please refresh and try again.");
    }

    // ── Server-side shipping (same rule as client: free above ₹499) ──────
    const serverShipping = serverSubtotal > 499 ? 0 : 49;

    let discountApplied: number | undefined;
    let validatedDiscountCode: string | undefined;
    let serverTotal = serverSubtotal + serverShipping;

    if (args.discountCode) {
      const discount = await ctx.db
        .query("discounts")
        .withIndex("by_code", (q) => q.eq("code", args.discountCode!))
        .unique();

      const isValid =
        discount &&
        (!discount.expiresAt || discount.expiresAt > Date.now()) &&
        (discount.maxUses === undefined || discount.usageCount < discount.maxUses);

      // Enforce firstOrderOnly server-side (DISC-FIRST-ORDER-01).
      let firstOrderOk = true;
      if (isValid && discount.firstOrderOnly) {
        const priorOrder = await ctx.db
          .query("orders")
          .withIndex("by_customerPhone", (q) =>
            q.eq("customerPhone", args.customer.phone)
          )
          .first();
        if (priorOrder) firstOrderOk = false;
      }

      if (isValid && firstOrderOk && discount) {
        const savings =
          discount.discountType === "percent"
            ? Math.round(serverSubtotal * (discount.amount / 100))
            : Math.min(discount.amount, serverSubtotal);

        const discountedSubtotal = serverSubtotal - savings;
        serverTotal = discountedSubtotal + serverShipping;
        discountApplied = savings;
        validatedDiscountCode = discount.code;

        await ctx.db.patch(discount._id, {
          usageCount: discount.usageCount + 1,
        });
      }
    }

    await ctx.db.insert("orders", {
      orderId,
      customer: args.customer,
      items: serverItems,       // server-authoritative prices
      subtotal: serverSubtotal,
      shipping: serverShipping, // server-computed, not client-supplied
      total: serverTotal,
      status: "pending",
      paymentMethod: args.paymentMethod,
      discountCode: validatedDiscountCode,
      discountApplied,
      customerPhone: args.customer.phone,
      customerEmail: args.customer.email,
    });
    await upsertOrderSummary(ctx, null, "pending", serverTotal);

    // ── Decrement stockQty for each item (only when tracking is enabled) ──
    // Re-fetch products here to get the latest committed values after the
    // order insert. Math.max(0, ...) guards against negative stock from edge
    // cases where admin manually decremented stock between our check and now.
    for (const item of serverItems) {
      const product = await ctx.db.get(item.productId as Id<"products">);
      if (product?.stockQty != null) {
        const newQty = Math.max(0, product.stockQty - item.qty);
        const threshold = product.lowStockThreshold ?? 10;
        const newStatus: "in-stock" | "low-stock" | "out-of-stock" =
          newQty === 0
            ? "out-of-stock"
            : newQty <= threshold
              ? "low-stock"
              : "in-stock";
        await ctx.db.patch(product._id, { stockQty: newQty, stockStatus: newStatus });
      }
    }

    return { orderId };
  },
});

// ── getOrder ───────────────────────────────────────────────────────────────
// Authenticated admins receive the full record.
// Unauthenticated callers (customer order-tracking) receive a PII-stripped
// view: status, items, and totals only — no name, phone, email, or address.
export const getOrder = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();
    if (!order) return null;

    const admin = await getCallerAdmin(ctx);
    if (admin) return order;

    // Public order-tracking view — PII stripped
    return {
      orderId: order.orderId,
      status: order.status,
      items: order.items,
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      discountApplied: order.discountApplied,
    };
  },
});

// ── listOrders ─────────────────────────────────────────────────────────────
export const listOrders = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("orders").order("desc").collect();
  },
});

// ── updateStatus ───────────────────────────────────────────────────────────
export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(args.id);
    if (!order) throw new ConvexError("Order not found.");
    await ctx.db.patch(args.id, { status: args.status });
    await upsertOrderSummary(ctx, order.status, args.status, order.total ?? order.subtotal);
  },
});

// ── cancelOrder ────────────────────────────────────────────────────────────
export const cancelOrder = mutation({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();
    if (!order) throw new ConvexError("Order not found.");
    if (order.status !== "pending") {
      throw new ConvexError(`Cannot cancel — order is already ${order.status}.`);
    }
    await ctx.db.patch(order._id, { status: "cancelled" });
    await upsertOrderSummary(ctx, order.status, "cancelled", order.total ?? order.subtotal);
  },
});

// ── getOrdersByContact ─────────────────────────────────────────────────────
export const getOrdersByContact = query({
  args: { contact: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!args.contact.trim()) return [];
    const normalized = args.contact.toLowerCase().trim();
    const byPhone = await ctx.db
      .query("orders")
      .withIndex("by_customerPhone", (q) => q.eq("customerPhone", normalized))
      .take(50);
    if (byPhone.length > 0) return byPhone;
    return await ctx.db
      .query("orders")
      .withIndex("by_customerEmail", (q) => q.eq("customerEmail", normalized))
      .take(50);
  },
});

// ── addOrderNote ───────────────────────────────────────────────────────────
export const addOrderNote = mutation({
  args: {
    orderId: v.string(),
    message: v.string(),
    role: v.union(v.literal("customer"), v.literal("system")),
  },
  handler: async (ctx, args) => {
    // SECURITY (H-01): ALL note submissions require authentication to prevent
    // anonymous callers from appending notes to any order by orderId.
    const noteUserId = await getAuthUserId(ctx);
    if (!noteUserId) throw new ConvexError("Unauthorized: must be signed in to add notes.");
    // System-role notes additionally require admin privileges.
    if (args.role === "system") {
      await requireAdmin(ctx);
    }
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();
    if (!order) throw new ConvexError("Order not found.");
    const notes = order.notes ?? [];
    // Cap notes per order at 50 to prevent unbounded growth (NOTE-SPAM-01).
    if (notes.length >= 50) throw new ConvexError("Note limit reached for this order.");
    // Cap message length.
    const safeMessage = args.message.trim().slice(0, 1000);
    if (!safeMessage) throw new ConvexError("Message cannot be empty.");
    await ctx.db.patch(order._id, {
      notes: [...notes, { role: args.role, message: safeMessage, ts: Date.now() }],
    });
  },
});
