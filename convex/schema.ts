import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
    name: v.string(),
    description: v.string(),
    type: v.union(v.literal("beans"), v.literal("bags"), v.literal("merch")),
    category: v.string(),
    // ── Two-tier taxonomy ──
    mainCategory: v.optional(
      v.union(v.literal("coffee"), v.literal("merch"))
    ),
    subCategory: v.optional(
      v.union(
        v.literal("beans"),
        v.literal("ecb"),
        v.literal("drinkware"),
        v.literal("bags"),
        v.literal("keychains"),
        v.literal("chocolates-nuts"),
        v.literal("brewing-tools")
      )
    ),
    price: v.number(),
    imageUrl: v.string(),
    modelUrl: v.optional(v.string()),
    imageBlur: v.optional(v.string()),
    tags: v.array(v.string()),
    roastLevel: v.optional(
      v.union(
        v.literal("light"),
        v.literal("medium"),
        v.literal("medium-dark"),
        v.literal("dark")
      )
    ),
    origin: v.optional(v.string()),
    weight: v.optional(v.string()),
    flavorNotes: v.array(v.string()),
    stockStatus: v.union(
      v.literal("in-stock"),
      v.literal("out-of-stock"),
      v.literal("low-stock")
    ),
    stockQty: v.optional(v.number()),
    lowStockThreshold: v.optional(v.number()),
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
  })
    .index("by_type", ["type"])
    .index("by_stockStatus", ["stockStatus"]),

  sessions: defineTable({
    answers: v.any(),
    recommendations: v.array(v.string()),
    completed: v.boolean(),
    converted: v.boolean(),
  }),

  rules: defineTable({
    condition: v.any(),
    resultProductIds: v.array(v.string()),
  }),

  // AI response cache — keyed by stable SHA-256 hash of action name + args.
  // Eliminates repeat Mistral calls for identical inputs.
  aiCache: defineTable({
    key: v.string(),     // SHA-256 hex of (version + actionName + sorted args)
    value: v.string(),   // JSON-stringified { ok: true, ... } result
    createdAt: v.number(),
  }).index("by_key", ["key"]),

  // Page view tracking for site analytics
  pageViews: defineTable({
    path: v.string(),
    sessionId: v.string(),
    referrer: v.optional(v.string()),
    timestamp: v.number(),
    duration: v.optional(v.number()), // seconds on page
  }).index("by_timestamp", ["timestamp"]),

  // Custom product categories
  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    productType: v.union(
      v.literal("beans"),
      v.literal("bags"),
      v.literal("merch"),
      v.literal("all")
    ),
  }),

  // Customer orders
  orders: defineTable({
    orderId: v.string(), // "TWC-XXXXXXXX"
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
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    paymentMethod: v.optional(v.string()),
    razorpayOrderId: v.optional(v.string()),
    razorpayPaymentId: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    notes: v.optional(v.array(v.object({
      role: v.union(v.literal("customer"), v.literal("system")),
      message: v.string(),
      ts: v.number(),
    }))),
  })
    .index("by_status", ["status"])
    .index("by_orderId", ["orderId"]),
});
