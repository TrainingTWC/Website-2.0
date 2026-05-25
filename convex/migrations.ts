import { mutation } from "./_generated/server";

type MainCategory = "coffee" | "merch";
type SubCategory =
  | "beans"
  | "ecb"
  | "drinkware"
  | "bags"
  | "keychains"
  | "chocolates-nuts"
  | "brewing-tools";

/**
 * Heuristic that maps a product's legacy {type, category, name} to the new
 * (mainCategory, subCategory) taxonomy. Pure / deterministic so we can re-run
 * this migration safely.
 */
function classify(
  name: string,
  type: "beans" | "bags" | "merch",
  category: string | undefined,
): { mainCategory: MainCategory; subCategory: SubCategory } {
  const n = name.toLowerCase();
  const c = (category ?? "").toLowerCase();

  // Brewing tools — covers Coffee/Brewing Tools and Merch/Brewing Tools.
  const brewingKeywords = [
    "french press",
    "v60",
    "pour over",
    "pour-over",
    "pourover",
    "moka",
    "aeropress",
    "kettle",
    "grinder",
    "scale",
    "dripper",
    "chemex",
    "brewer",
    "filter paper",
    "filters",
  ];
  if (
    brewingKeywords.some((k) => n.includes(k) || c.includes(k.replace(/\s+/g, "-")))
  ) {
    return {
      mainCategory: type === "merch" ? "merch" : "coffee",
      subCategory: "brewing-tools",
    };
  }

  if (type === "beans") {
    return { mainCategory: "coffee", subCategory: "beans" };
  }
  if (type === "bags") {
    return { mainCategory: "coffee", subCategory: "ecb" };
  }

  // type === "merch" → split by keyword.
  if (
    n.includes("chocolate") ||
    n.includes("nuts") ||
    n.includes("almond") ||
    n.includes("cashew") ||
    n.includes("snack") ||
    n.includes("cookie") ||
    n.includes("bar") ||
    c.includes("chocolate") ||
    c.includes("nuts") ||
    c.includes("snack")
  ) {
    return { mainCategory: "merch", subCategory: "chocolates-nuts" };
  }
  if (
    n.includes("keychain") ||
    n.includes("pin") ||
    n.includes("badge") ||
    n.includes("sticker") ||
    n.includes("accessor") ||
    c.includes("keychain") ||
    c.includes("accessor")
  ) {
    return { mainCategory: "merch", subCategory: "keychains" };
  }
  if (
    n.includes("tote") ||
    n.includes("bag") ||
    n.includes("backpack") ||
    n.includes("pouch") ||
    c.includes("tote") ||
    c.includes("bag")
  ) {
    return { mainCategory: "merch", subCategory: "bags" };
  }
  // Default merch → drinkware (cups, mugs, tumblers, bottles).
  return { mainCategory: "merch", subCategory: "drinkware" };
}

/**
 * Idempotent migration: assigns mainCategory + subCategory to every product
 * based on the heuristic above. Re-running is safe — values will be re-asserted.
 *
 * Run with: `npx convex run migrations:backfillTaxonomy`
 */
export const backfillTaxonomy = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const byBucket: Record<string, number> = {};
    let updated = 0;
    for (const p of products) {
      const { mainCategory, subCategory } = classify(p.name, p.type, p.category);
      const key = `${mainCategory}/${subCategory}`;
      byBucket[key] = (byBucket[key] ?? 0) + 1;
      // Skip patch if both fields already match — saves writes.
      if (p.mainCategory === mainCategory && p.subCategory === subCategory) continue;
      await ctx.db.patch(p._id, { mainCategory, subCategory });
      updated++;
    }
    return { scanned: products.length, updated, byBucket };
  },
});

/**
 * Repoint all product imageUrls from the old GitHub Pages repo URL
 * (trainingtwc.github.io/brewmatch-ai/) to the stable custom domain
 * (thirdwavecoffee.prismintelligence.in/).
 *
 * Safe to re-run — skips products whose imageUrl is already on the
 * custom domain or doesn't contain the old repo path.
 *
 * Also patches any siteContent rows whose stored JSON contains the old URL
 * (e.g. banner slides, chapter images).
 */
export const patchImageBaseUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const OLD = "https://trainingtwc.github.io/brewmatch-ai/";
    const NEW = "https://thirdwavecoffee.prismintelligence.in/";

    // ── Products ────────────────────────────────────────────────────────────
    const products = await ctx.db.query("products").collect();
    let productsPatched = 0;
    for (const p of products) {
      if (typeof p.imageUrl === "string" && p.imageUrl.includes(OLD)) {
        await ctx.db.patch(p._id, { imageUrl: p.imageUrl.replaceAll(OLD, NEW) });
        productsPatched++;
      }
    }

    // ── siteContent (banner slides, chapter images) ──────────────────────────
    const rows = await ctx.db.query("siteContent").collect();
    let contentPatched = 0;
    for (const row of rows) {
      if (typeof row.json === "string" && row.json.includes(OLD)) {
        await ctx.db.patch(row._id, { json: row.json.replaceAll(OLD, NEW) });
        contentPatched++;
      }
    }

    return { productsPatched, contentPatched };
  },
});
