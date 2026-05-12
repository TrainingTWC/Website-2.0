import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const seedFromScript = mutation({
  args: {
    products: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        type: v.union(v.literal("beans"), v.literal("bags"), v.literal("merch")),
        category: v.string(),
        price: v.number(),
        storageId: v.optional(v.string()),
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
    ),
  },
  handler: async (ctx, args) => {
    // Delete existing products to re-seed cleanly
    const existing = await ctx.db.query("products").collect();
    for (const doc of existing) {
      await ctx.db.delete(doc._id);
    }

    // Insert new products
    for (const product of args.products) {
      let finalImageUrl = product.imageUrl;
      // If a storageId was provided (from the script), convert it to a URL
      if (product.storageId) {
        const url = await ctx.storage.getUrl(product.storageId as any);
        if (url) {
          finalImageUrl = url;
        }
      }

      const { storageId, ...productData } = product;
      
      await ctx.db.insert("products", {
        ...productData,
        imageUrl: finalImageUrl,
      });
    }

    return { seeded: true, message: `Seeded ${args.products.length} products.` };
  },
});
