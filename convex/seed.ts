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
        rating: v.optional(v.number()),
        reviewCount: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Guard: only seed if the table is empty.
    // This makes the script safe to re-run — it won't wipe products that
    // were added or deleted via the admin dashboard.
    const existing = await ctx.db.query("products").take(1);
    if (existing.length > 0) {
      return {
        seeded: false,
        message: `Skipped — ${existing.length > 0 ? "products already exist" : ""}. Delete all products from the admin dashboard first if you want to force a full re-seed.`,
      };
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

// ── Seed sample editorial content (posts + a discount) ───────────────────
// Safe to re-run — skips if posts already exist.
export const seedEditorial = mutation({
  args: {},
  handler: async (ctx) => {
    const existingPosts = await ctx.db.query("posts").take(1);
    if (existingPosts.length > 0) {
      return { seeded: false, message: "Editorial content already exists. Clear posts from the admin CMS first." };
    }

    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const threeDays = 3 * 24 * 60 * 60 * 1000;

    // Create a flash-sale discount code first so we can link it
    let discountId: any = null;
    const existingDiscount = await ctx.db
      .query("discounts")
      .withIndex("by_code", (q) => q.eq("code", "CIRCLE15"))
      .unique();
    if (!existingDiscount) {
      discountId = await ctx.db.insert("discounts", {
        code: "CIRCLE15",
        discountType: "percent",
        amount: 15,
        firstOrderOnly: false,
        expiresAt: now + threeDays,
        maxUses: 100,
        usageCount: 0,
      });
    } else {
      discountId = existingDiscount._id;
    }

    // Flash sale
    await ctx.db.insert("posts", {
      type: "flash-sale",
      headline: "72-Hour Flash: 15% Off All Single-Origin Beans",
      subhead: "Our rarest lots. Your best window.",
      body: "We've unlocked our reserve stock for three days only.\n\nFrom the misty hills of Araku to the volcanic soils of Coorg — these are the beans we age, sort, and cup obsessively before putting a single bag in the store.\n\nUse code CIRCLE15 at checkout. No minimum order. Works on everything.",
      status: "published",
      coverImageUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=1200",
      publishAt: now,
      expiresAt: now + threeDays,
      discountId,
    });

    // Café news
    await ctx.db.insert("posts", {
      type: "cafe-news",
      headline: "Our Indiranagar Café Gets a New Brew Bar",
      subhead: "Longer pour times, better extractions, and a place to sit and watch.",
      body: "We tore out the old counter.\n\nThe new brew bar faces the street, with two Chemex stations and a Japanese siphon setup that takes 8 minutes per cup. You're welcome to watch.\n\nThe menu expands next week — filter flights, seasonal cold brew, and a rotating guest roast from somewhere interesting.",
      status: "published",
      coverImageUrl: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&q=80&w=1200",
      publishAt: now - 2 * 24 * 60 * 60 * 1000,
    });

    // Brand story
    await ctx.db.insert("posts", {
      type: "brand-story",
      headline: "Why We Only Roast to Order",
      subhead: "Everyone warehouses. We don't.",
      body: "Every batch at Third Wave Coffee goes from roaster to your door within 72 hours.\n\nIt started as an operational headache — no warehouse space, two staff, and an oven that only fit 5kg at a time. Then customers started tasting the difference.\n\nFresh coffee doesn't just taste better. It smells different when you open the bag. It blooms differently in the cup. It's a whole other thing.\n\nWe kept the small batches. We always will.",
      status: "published",
      coverImageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1200",
      publishAt: now - 4 * 24 * 60 * 60 * 1000,
    });

    // Product launch
    await ctx.db.insert("posts", {
      type: "product-launch",
      headline: "Introducing: Natural Process Yirgacheffe",
      subhead: "Blueberry. Jasmine. A finish that lingers.",
      body: "Ethiopia's Yirgacheffe zone produces the most floral coffees in the world. The natural process — drying with the cherry intact — adds fruit fermentation notes that no washed lot can match.\n\nTasting notes: fresh blueberry, jasmine tea, dark chocolate finish.\n\nRoast level: Light. Grind for pour-over or Aeropress.",
      status: "published",
      coverImageUrl: "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?auto=format&fit=crop&q=80&w=1200",
      publishAt: now - 1 * 24 * 60 * 60 * 1000,
    });

    // Champion
    await ctx.db.insert("posts", {
      type: "champion",
      headline: "Priya Nair — South India Barista Champion 2025",
      subhead: "",
      body: "Priya trained for 18 months on a single espresso machine in her parents' kitchen before walking onto the competition floor.",
      status: "published",
      coverImageUrl: "https://images.unsplash.com/photo-1607631568010-a87245c0daf8?auto=format&fit=crop&q=80&w=400",
      publishAt: now - 6 * 24 * 60 * 60 * 1000,
      personName: "Priya Nair",
      personRole: "South India Barista Champion 2025",
      personStory: "Trained on a single espresso machine for 18 months before placing first at the regional championship. She's currently developing our next seasonal espresso blend.",
    });

    return { seeded: true, message: "Seeded 5 posts and 1 discount code (CIRCLE15)." };
  },
});
