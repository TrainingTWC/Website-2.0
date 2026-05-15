import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";

// ── Helpers ────────────────────────────────────────────────────────────────
function randomAlphaNum(len: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

// ── submitOrder ────────────────────────────────────────────────────────────
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
        price: v.number(),
      })
    ),
    subtotal: v.number(),
    shipping: v.number(),
    total: v.number(),
    paymentMethod: v.optional(v.string()),
    discountCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orderId = `TWC-${randomAlphaNum(8)}`;
    await ctx.db.insert("orders", {
      orderId,
      customer: args.customer,
      items: args.items,
      subtotal: args.subtotal,
      shipping: args.shipping,
      total: args.total,
      status: "pending",
      paymentMethod: args.paymentMethod,
      discountCode: args.discountCode,
      customerPhone: args.customer.phone,
      customerEmail: args.customer.email,
    });
    return { orderId };
  },
});

// ── getOrder ───────────────────────────────────────────────────────────────
export const getOrder = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();
    return results ?? null;
  },
});

// ── listOrders ─────────────────────────────────────────────────────────────
export const listOrders = query({
  args: {},
  handler: async (ctx) => {
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
    await ctx.db.patch(args.id, { status: args.status });
  },
});

// ── cancelOrder ────────────────────────────────────────────────────────────
export const cancelOrder = mutation({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();
    if (!order) throw new ConvexError("Order not found.");
    if (order.status !== "pending") {
      throw new ConvexError(`Cannot cancel — order is already ${order.status}.`);
    }
    await ctx.db.patch(order._id, { status: "cancelled" });
  },
});

// ── getOrdersByContact ─────────────────────────────────────────────────────
export const getOrdersByContact = query({
  args: { contact: v.string() },
  handler: async (ctx, args) => {
    if (!args.contact.trim()) return [];
    const normalized = args.contact.toLowerCase().trim();
    const all = await ctx.db.query("orders").order("desc").collect();
    return all.filter(
      (o) =>
        o.customer.email?.toLowerCase() === normalized ||
        o.customer.phone === normalized
    );
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
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();
    if (!order) throw new ConvexError("Order not found.");
    const notes = order.notes ?? [];
    await ctx.db.patch(order._id, {
      notes: [...notes, { role: args.role, message: args.message, ts: Date.now() }],
    });
  },
});
