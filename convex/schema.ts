import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

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
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    locality: v.optional(v.string()),
    postcode: v.optional(v.string()),
    lat: v.optional(v.number()),
    lon: v.optional(v.number()),
    geoSource: v.optional(v.string()), // "gps" | "ip"
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
    discountCode: v.optional(v.string()),
    discountApplied: v.optional(v.number()),
    customerPhone: v.optional(v.string()),  // denormalized for index queries
    customerEmail: v.optional(v.string()),  // denormalized for index queries
  })
    .index("by_status", ["status"])
    .index("by_orderId", ["orderId"])
    .index("by_customerPhone", ["customerPhone"])
    .index("by_customerEmail", ["customerEmail"]),

  // ── Editorial posts ──────────────────────────────────────────────────────
  posts: defineTable({
    type: v.union(
      v.literal("flash-sale"),
      v.literal("product-launch"),
      v.literal("cafe-news"),
      v.literal("brand-story"),
      v.literal("champion")
    ),
    headline: v.string(),
    subhead: v.optional(v.string()),
    body: v.string(),
    coverImageStorageId: v.optional(v.id("_storage")),
    coverImageUrl: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("scheduled")
    ),
    publishAt: v.optional(v.number()),   // epoch ms
    expiresAt: v.optional(v.number()),   // epoch ms
    linkedProductId: v.optional(v.id("products")),
    discountId: v.optional(v.id("discounts")),  // flash-sale only
    // champion-only fields
    personName: v.optional(v.string()),
    personRole: v.optional(v.string()),
    personStory: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_status_and_type", ["status", "type"]),

  // ── Discount codes ────────────────────────────────────────────────────────
  discounts: defineTable({
    code: v.string(),
    discountType: v.union(v.literal("percent"), v.literal("flat")),
    amount: v.number(),
    firstOrderOnly: v.boolean(),
    expiresAt: v.optional(v.number()),  // epoch ms
    maxUses: v.optional(v.number()),
    usageCount: v.number(),             // starts at 0
  }).index("by_code", ["code"]),

  // ── Site content: editable copy + media for homepage sections ────────────
  // Generic key/value store so we can add fields without schema migrations.
  // Examples:
  //   key="story.headline"     value={ text: "From bean to cup..." }
  //   key="story.body"         value={ paragraphs: ["...", "..."] }
  //   key="story.stats"        value={ stats: [{value:"12+",label:"Origins"}, ...] }
  //   key="story.slides"       value={ slides: [{ storageId, url }, ...] }
  siteContent: defineTable({
    key: v.string(),
    // We allow arbitrary JSON. Convex doesn't expose v.any() for nested unknown
    // shapes cleanly, so we use a stringified JSON blob + parse on read.
    json: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // ── Admin RBAC ──────────────────────────────────────────────────────────
  // Maps Convex Auth users to admin roles + per-section permissions.
  admins: defineTable({
    userId: v.optional(v.id("users")),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(
      v.literal("superadmin"),
      v.literal("admin"),
      v.literal("editor"),
      v.literal("viewer")
    ),
    permissions: v.object({
      overview: v.boolean(),
      inventory: v.boolean(),
      orders: v.boolean(),
      analytics: v.boolean(),
      editorial: v.boolean(),
      home: v.boolean(),
      rules: v.boolean(),
      customers: v.boolean(),
      settings: v.boolean(),
    }),
    active: v.boolean(),
    invitedBy: v.optional(v.id("users")),
    invitedAt: v.number(),
    lastSeenAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

  // ── Web vitals (RUM telemetry) ───────────────────────────────────────────
  // Real-user FCP/LCP/INP/CLS/TTFB samples, tagged with the device perf tier.
  // Written by src/lib/webVitals.ts on every page load. Used to verify the
  // v6.0 performance phase actually moved the needle on real hardware.
  webVitals: defineTable({
    name: v.union(
      v.literal("FCP"),
      v.literal("LCP"),
      v.literal("INP"),
      v.literal("CLS"),
      v.literal("TTFB")
    ),
    value: v.number(),
    rating: v.union(
      v.literal("good"),
      v.literal("needs-improvement"),
      v.literal("poor")
    ),
    page: v.string(),
    userAgent: v.string(),
    tier: v.union(v.literal("low"), v.literal("mid"), v.literal("high")),
  })
    .index("by_name", ["name"])
    .index("by_page", ["page"]),

  // ── Audit log ───────────────────────────────────────────────────────────
  auditLog: defineTable({
    adminUserId: v.id("users"),
    adminEmail: v.string(),
    action: v.string(),         // "admin.invite", "product.update", etc.
    target: v.optional(v.string()), // entity affected
    metadata: v.optional(v.string()), // JSON blob
    timestamp: v.number(),
  })
    .index("by_admin", ["adminUserId"])
    .index("by_timestamp", ["timestamp"]),

  // ── Pre-aggregated daily page-view counters (Fix #1) ────────────────────
  pageViewDailySummary: defineTable({
    date: v.string(),            // ISO "YYYY-MM-DD" in UTC
    totalViews: v.number(),
    uniqueSessions: v.number(),
    pathCountsJson: v.string(),  // JSON: { "/shop": 42, ... }
    geoJson: v.string(),         // JSON: { countries, cities, regions }
    avgDurationSec: v.number(),
    durationSamples: v.number(),
    gpsCount: v.number(),
    ipCount: v.number(),
    sessionIdsJson: v.optional(v.string()), // capped at 10k session IDs
  }).index("by_date", ["date"]),

  // ── Materialized order counters for O(1) analytics (Fix #3) ────────────
  orderSummary: defineTable({
    key: v.string(),              // always "global"
    totalRevenue: v.number(),
    totalOrders: v.number(),
    completedOrders: v.number(),
    pendingOrders: v.number(),
    cancelledOrders: v.number(),
    avgOrderValue: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
