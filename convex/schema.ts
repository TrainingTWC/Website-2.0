import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
    name: v.string(),
    description: v.string(),
    type: v.union(v.literal("beans"), v.literal("bags"), v.literal("merch")),
    category: v.string(),
    price: v.number(),
    imageUrl: v.string(),
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
});
