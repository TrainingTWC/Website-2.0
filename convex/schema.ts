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
    // â”€â”€ Two-tier taxonomy â”€â”€
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

  // â”€â”€ Editorial posts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Discount codes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  discounts: defineTable({
    code: v.string(),
    discountType: v.union(v.literal("percent"), v.literal("flat")),
    amount: v.number(),
    firstOrderOnly: v.boolean(),
    expiresAt: v.optional(v.number()),  // epoch ms
    maxUses: v.optional(v.number()),
    usageCount: v.number(),             // starts at 0
  }).index("by_code", ["code"]),

  // â”€â”€ Site content: editable copy + media for homepage sections â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Admin RBAC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Maps Convex Auth users to admin roles + per-section permissions.
  admins: defineTable({
    userId: v.optional(v.id("users")),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(
      v.literal("superadmin"),
      v.literal("admin"),
      v.literal("editor"),
      v.literal("viewer"),
      v.literal("hr"),
      v.literal("marketing"),
      v.literal("pr")
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

  // â”€â”€ Web vitals (RUM telemetry) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Audit log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Pre-aggregated daily page-view counters (Fix #1) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Materialized order counters for O(1) analytics (Fix #3) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Admin OTP codes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Stores hashed one-time codes for login 2FA and CMS action re-verification.
  adminOtp: defineTable({
    email: v.string(),
    codeHash: v.string(),    // SHA-256 hex of the 6-digit code
    expiresAt: v.number(),   // Unix ms
    used: v.boolean(),
    attempts: v.number(),    // failed verify attempts (max 5 before invalidation)
    purpose: v.string(),     // "login" | "cms_action"
  }).index("by_email_purpose", ["email", "purpose"]),

  // â”€â”€ Admin brute-force / rate-limit tracking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  adminLoginAttempts: defineTable({
    email: v.string(),
    failedPassAt: v.array(v.number()),  // timestamps of failed password attempts
    otpSentAt: v.array(v.number()),     // timestamps of OTP send requests
    lockedUntil: v.optional(v.number()), // lock expiry (Unix ms)
  }).index("by_email", ["email"]),

  // ── Admin OTP sessions (server-side 2FA state) ────────────────────────────
  // Created on successful OTP verification; validated by AdminAuthGate on every
  // page load so the gate cannot be bypassed by writing to sessionStorage.
  adminOtpSessions: defineTable({
    email: v.string(),
    token: v.string(),      // random UUID — stored in browser sessionStorage
    expiresAt: v.number(),  // Unix ms (30 minutes from verification)
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"]),

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  v8.0 — CRM & Order Fulfillment funnel telemetry (lightweight MVP)
  //  Companion docs: .planning/milestones/v8.0-{ANALYTICS-CATALOG,DATA-CAPTURE}.md
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  // Anonymous event stream — every cart/checkout/PDP/friction event.
  // Identity tuple (phone/email) is captured server-side only after an order
  // is placed; this table itself stores NO PII.
  customerEventsAnonymous: defineTable({
    anonId: v.string(),           // long-lived localStorage uuid
    sessionId: v.string(),        // per-tab session
    ts: v.number(),               // client timestamp (ms)
    name: v.string(),             // event name, e.g. "cart_item_added"
    stage: v.optional(v.number()),// 1..12 funnel stage (see catalog)
    route: v.optional(v.string()),
    propsJson: v.string(),        // JSON blob of event-specific props
    // Lightweight session context (denormalized for cheap segmentation)
    device: v.optional(v.union(v.literal("mobile"), v.literal("tablet"), v.literal("desktop"))),
    connection: v.optional(v.string()),  // e.g. "4g", "3g", "wifi", "unknown"
    referrer: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
  })
    .index("by_session", ["sessionId"])
    .index("by_anon", ["anonId"])
    .index("by_name_ts", ["name", "ts"])
    .index("by_ts", ["ts"]),

  // Rolling snapshot of the current cart per anon session.
  // Updated on every cart mutation; used for "abandoned cart" detection
  // and to populate the recovery email payload.
  cartSnapshots: defineTable({
    anonId: v.string(),
    sessionId: v.string(),
    updatedAt: v.number(),
    itemsJson: v.string(),        // JSON: [{ productId, qty, price, name }]
    itemCount: v.number(),
    subtotal: v.number(),
    lastEventName: v.optional(v.string()),
    lastRoute: v.optional(v.string()),
    // Set true by submitOrder finaliser â†’ excludes from abandonment cron
    converted: v.boolean(),
    // Set by abandonment cron once classified
    abandonedAt: v.optional(v.number()),
    // Contact captured during checkout (NULL until provided)
    contactPhone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
  })
    .index("by_anon", ["anonId"])
    .index("by_session", ["sessionId"])
    .index("by_updatedAt", ["updatedAt"])
    .index("by_converted", ["converted"]),

  // JS errors + API failures from the browser.
  clientErrors: defineTable({
    anonId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    ts: v.number(),
    route: v.optional(v.string()),
    type: v.string(),             // "js" | "api" | "offline" | "unhandled_rejection"
    message: v.string(),
    stack: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    extraJson: v.optional(v.string()),
  })
    .index("by_ts", ["ts"])
    .index("by_type", ["type"]),

  // Pre-aggregated daily funnel summary (rolled up by cron in Phase 3).
  // For now we keep a "global" singleton that's recomputed on demand by the
  // dashboard, so the MVP works without a cron.
  funnelSummary: defineTable({
    key: v.string(),              // always "global" for the singleton
    windowDays: v.number(),       // 1 | 7 | 30
    sessions: v.number(),
    sessionsWithPdpView: v.number(),
    sessionsWithCart: v.number(),
    sessionsWithCheckoutInit: v.number(),
    sessionsWithPaymentInit: v.number(),
    sessionsWithOrder: v.number(),
    abandonedCarts: v.number(),
    abandonedCartValue: v.number(),
    updatedAt: v.number(),
  }).index("by_key_window", ["key", "windowDays"]),
  // ── Brewing Studio Media (v9.0) ──────────────────────────────────────────
  // Slot-bound media assets (image/video/gif/lottie/glb). One row per upload;
  // only one row per (slot, slotKey) is `published` at a time. See convex/media.ts.
  media: defineTable({
    kind: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("gif"),
      v.literal("lottie"),
      v.literal("glb")
    ),
    slot: v.union(
      v.literal("brew_method"),
      v.literal("brew_step"),
      v.literal("signature"),
      v.literal("product"),
      v.literal("ambience")
    ),
    slotKey: v.string(),
    storageId: v.id("_storage"),
    posterStorageId: v.optional(v.id("_storage")),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    blurhash: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
    publishedAt: v.optional(v.number()),
    provenance: v.union(v.literal("upload"), v.literal("ai")),
    aiMeta: v.optional(v.object({
      provider: v.string(),
      model: v.string(),
      prompt: v.string(),
      seed: v.optional(v.number()),
      costUsd: v.optional(v.number()),
      predictionId: v.optional(v.string()),
    })),
  })
    .index("by_slot_key", ["slot", "slotKey"])
    .index("by_status_slot", ["status", "slot"]),
});