const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../convex/recommendations.ts");
let raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

// Fix 1: Add explicit return type to the handler to break circular inference
raw = raw.replace(
  "  handler: async (ctx, args) => {",
  "  handler: async (ctx, args): Promise<{ primaryProductIds: string[]; crossSellProductIds: string[]; explanation: string }> => {"
);

// Fix 2: Type-annotate cachedEntry explicitly (breaks the circular type reference)
raw = raw.replace(
  "    const cachedEntry = await ctx.runQuery(internal.cache.get, { key: cacheKey });",
  "    const cachedEntry: { value: string } | null = await ctx.runQuery(internal.cache.get, { key: cacheKey });"
);

fs.writeFileSync(file, raw, "utf8");
console.log("✅ Fixed TypeScript errors in convex/recommendations.ts");
