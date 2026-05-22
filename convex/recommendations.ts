"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { createHash } from "crypto";
import { BRAND_CONTEXT, buildPersonalitiesBlock } from "./productContext";

// ── Cache-key helpers ──────────────────────────────────────────────────────
// Increment CACHE_VERSION whenever prompt templates change so stale entries
// are automatically bypassed (old entries become orphaned, not served).
const CACHE_VERSION = "v1";

function stableStringify(val: unknown): string {
  if (val === null || typeof val !== "object") return JSON.stringify(val);
  if (Array.isArray(val)) return "[" + (val as unknown[]).map(stableStringify).join(",") + "]";
  const keys = Object.keys(val as object).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + stableStringify((val as Record<string, unknown>)[k]))
      .join(",") +
    "}"
  );
}

function makeCacheKey(actionName: string, args: unknown): string {
  return createHash("sha256")
    .update(`${CACHE_VERSION}:${actionName}:${stableStringify(args)}`)
    .digest("hex");
}

// Strip <think>…</think> reasoning traces and markdown fences before parsing.
// Mistral Small 4 (mistral-small-2603) is a hybrid reasoning model; even with
// response_format: json_object it can emit thinking tokens in the content field.
function safeParseJSON(text: string): unknown {
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  return JSON.parse(cleaned);
}

export const getRecommendation = action({
  args: {
    answers: v.any(),
    products: v.array(
      v.object({
        _id: v.string(),
        name: v.string(),
        type: v.string(),
        roastLevel: v.optional(v.string()),
        tags: v.array(v.string()),
        description: v.string(),
        flavorNotes: v.array(v.string()),
        price: v.number(),
        origin: v.optional(v.string()),
        category: v.string(),
      })
    ),
    // Optional: passed by the client to enable per-session rate limiting.
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return {
        primaryProductIds: [],
        crossSellProductIds: [],
        explanation:
          "AI recommendations are not configured. Please set the MISTRAL_API_KEY environment variable in your Convex dashboard.",
      };
    }

    // ── L1: Convex AI response cache ────────────────────────────────────────────────
    // Cache key covers only the user’s answers (product catalog is stable).
    const cacheKey = makeCacheKey("getRecommendation", { answers: args.answers });
    const cachedEntry = await ctx.runQuery(internal.cache.get, { key: cacheKey });
    if (cachedEntry) {
      try { return JSON.parse(cachedEntry.value); } catch { /* corrupted — fall through to fresh call */ }
    }

    // ── Rate limiting via Upstash Redis (optional) ────────────────────────────────
    // Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in Convex dashboard.
    // Allows 5 AI requests per sessionId per 15 minutes; gracefully skipped if
    // env vars are absent so the feature degrades without breaking anything.
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (args.sessionId && redisUrl && redisToken) {
      try {
        const rlKey = `rl:rec:${args.sessionId}`;
        const pipeRes = await fetch(`${redisUrl}/pipeline`, {
          method: "POST",
          headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
          body: JSON.stringify([["INCR", rlKey], ["EXPIRE", rlKey, 900]]),
        });
        const rlResults = await pipeRes.json() as { result: number }[];
        if ((rlResults[0]?.result ?? 0) > 5) {
          return {
            primaryProductIds: [],
            crossSellProductIds: [],
            explanation: "You’ve requested several matches recently. Please wait a few minutes and try again.",
          };
        }
      } catch { /* Redis unavailable — allow the request through */ }
    }

    const productNames = args.products.map((p) => p.name);
    const personalitiesBlock = buildPersonalitiesBlock(productNames);

    // Use simple numeric indices so Mistral never mangles opaque Convex IDs.
    // We map idx → real _id after parsing.
    const idxToId: Record<string, string> = {};
    const catalogSnippet = args.products
      .map((p, i) => {
        const idx = String(i + 1);
        idxToId[idx] = p._id;
        return `IDX: ${idx} | Name: ${p.name} | Category: ${p.category} | Roast: ${p.roastLevel ?? "N/A"} | Origin: ${p.origin ?? "N/A"} | Flavor: ${p.flavorNotes.join(", ")} | Price: ₹${p.price.toLocaleString("en-IN")}`;
      })
      .join("\n");

    // Also build a name → _id lookup as a fallback in case Mistral returns names.
    const nameToId: Record<string, string> = {};
    for (const p of args.products) {
      nameToId[p.name.toLowerCase().trim()] = p._id;
    }

    const resolveIds = (raw: string[]): string[] => {
      const resolved: string[] = [];
      for (const val of raw) {
        const trimmed = val.trim();
        if (idxToId[trimmed]) {
          resolved.push(idxToId[trimmed]);
        } else if (nameToId[trimmed.toLowerCase()]) {
          resolved.push(nameToId[trimmed.toLowerCase()]);
        }
        // discard anything that doesn't resolve
      }
      return resolved;
    };

    const answersSnippet = Object.entries(args.answers as Record<string, string>)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const prompt = `
${BRAND_CONTEXT}

${personalitiesBlock}

PRODUCT CATALOG (IDX | Name | Category | Roast | Origin | Flavor | Price):
${catalogSnippet}

CUSTOMER ANSWERS:
${answersSnippet}

TASK:
You are Third Intelligence, the recommendation engine for Third Wave Coffee.
Using the brand voice directive above, select the best product matches for this customer.

Rules:
- primaryProductIds: array of 1–3 IDX numbers (e.g. "3") of coffee products (beans or bags) that best match the answers
- crossSellProductIds: array of 1–2 IDX numbers of complementary products (gear, merch, or different format coffee)
- explanation: 2–3 sentences in Third Intelligence voice (crisp, confident, precise). Reference the matched product's specific flavor notes and a brewing suggestion. Do NOT use filler phrases.
- Return ONLY the numeric IDX values from the catalog above. Do not invent new numbers.

RETURN JSON ONLY:
{
  "primaryProductIds": ["3"],
  "crossSellProductIds": ["7"],
  "explanation": "..."
}
`.trim();

    try {
      const response = await fetch(
        "https://api.mistral.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "mistral-small-2603",
            messages: [
              {
                role: "system",
                content: "You are Third Intelligence, a coffee recommendation engine. Always respond with valid JSON only — no markdown, no explanation outside the JSON.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.3,
            reasoning_effort: "none",
            response_format: { type: "json_object" },
          }),
        }
      );

      if (!response.ok) {
        console.error("Mistral HTTP error:", response.status, await response.text());
        throw new Error(`Mistral returned ${response.status}`);
      }

      const json = await response.json();
      const text = json?.choices?.[0]?.message?.content;
      if (!text) throw new Error("Empty response from Mistral");

      const parsed = safeParseJSON(text) as {
        primaryProductIds: string[];
        crossSellProductIds: string[];
        explanation: string;
      };

      // Validate required fields exist
      if (!Array.isArray(parsed.primaryProductIds) || !parsed.explanation) {
        throw new Error("Malformed response structure from Mistral");
      }

      const result = {
        primaryProductIds: resolveIds(parsed.primaryProductIds),
        crossSellProductIds: Array.isArray(parsed.crossSellProductIds)
          ? resolveIds(parsed.crossSellProductIds)
          : [],
        explanation: parsed.explanation,
      };
      // Store successful result in Convex cache (avoids re-calling Mistral for identical answers)
      try { await ctx.runMutation(internal.cache.set, { key: cacheKey, value: JSON.stringify(result) }); } catch { /* ignore cache write failure */ }
      return result;
    } catch (error) {
      console.error("Mistral Error:", error);
      return {
        primaryProductIds: [],
        crossSellProductIds: [],
        explanation:
          "Something went wrong while brewing your recommendation. Please try again!",
      };
    }
  },
});

// ── Brewing recipe: AI generates a custom brew spec for a product + method ──
// Uses Mistral (env: MISTRAL_API_KEY). Returns structured recipe JSON consumed
// by the in-product Brewing Studio.
export const brewingRecipe = action({
  args: {
    productName: v.string(),
    roastLevel: v.optional(v.string()),
    origin: v.optional(v.string()),
    flavorNotes: v.array(v.string()),
    method: v.string(), // "espresso" | "v60" | "french-press" | "aeropress" | "cold-brew"
    dose: v.number(), // grams of coffee
    ratio: v.number(), // 1:N water ratio (e.g. 16 -> 1:16)
    strength: v.string(), // "light" | "balanced" | "strong"
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error:
          "MISTRAL_API_KEY not configured. Set it in the Convex dashboard to unlock AI brewing recipes.",
      };
    }

    const cacheKey = makeCacheKey("brewingRecipe", args);
    const cached = (await ctx.runQuery(internal.cache.get, { key: cacheKey })) as { value: string } | null;
    if (cached) return JSON.parse(cached.value) as { ok: true; recipe: unknown };

    // ratio = brew water : coffee (standard SCA definition)
    // Total brewing water = dose × ratio
    // Coffee grounds absorb ~2.5× their weight, so cup yield ≈ brewWaterG − (dose × 2.5)
    const brewWaterG = Math.round(args.dose * args.ratio);
    const yieldG = Math.max(0, Math.round(brewWaterG - args.dose * 2.5));
    const prompt = `
You are Third Intelligence, the brewing engine for Third Wave Coffee. Generate
a precise, opinionated recipe for the following bean + method.

BEAN
- Name: ${args.productName}
- Roast: ${args.roastLevel ?? "unspecified"}
- Origin: ${args.origin ?? "unspecified"}
- Flavor notes: ${args.flavorNotes.join(", ") || "n/a"}

METHOD: ${args.method}
PARAMETERS
- Dose: ${args.dose} g
- Ratio: 1:${args.ratio} (total brewing water ~${brewWaterG} g poured; estimated cup yield ~${yieldG} ml after grounds absorption)
- Strength preference: ${args.strength}

Return JSON ONLY in this exact shape — no markdown, no prose outside JSON:
{
  "title": "short evocative recipe name (max 6 words)",
  "grind": "grind size description (e.g. 'medium-fine, like table salt')",
  "waterTempC": <number 80-96>,
  "totalTimeSec": <number>,
  "steps": [
    { "label": "Bloom", "timeSec": 30, "waterG": 40, "detail": "Pour 40g water, swirl, wait." },
    { "label": "First pour", "timeSec": 30, "waterG": 80, "detail": "..." }
  ],
  "tastingNote": "1 sentence prediction of how the cup will taste, referencing the bean's flavor notes",
  "tip": "1 sentence pro tip specific to this bean+method combination",
  "pairings": {
    "food": "one short food pairing suggestion (max 8 words)",
    "book": "one short book or genre suggestion (max 8 words)",
    "music": "one short music artist, genre, or playlist suggestion (max 8 words)"
  }
}

Rules:
- 3 to 6 steps total, each with timeSec, waterG (grams of water POURED in that step) and detail (max 18 words)
- Sum of step timeSec must equal totalTimeSec
- Sum of step waterG must equal the TOTAL BREWING WATER (~${brewWaterG} g) for pour-over / drip methods — NOT the cup yield; for espresso, waterG per step represents preinfusion/extraction grams reaching the cup; for immersion methods (french-press, aeropress, cold-brew) the first step's waterG is the total water added and subsequent steps use waterG = 0
- waterTempC must reflect roast level (darker = lower temp)
- Steps should feel like a real barista wrote them, not generic
- Voice: precise, confident, Third Intelligence (no filler, no exclamations)
`.trim();

    try {
      const response = await fetch(
        "https://api.mistral.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "mistral-small-2603",
            messages: [
              {
                role: "system",
                content:
                  "You are Third Intelligence, a precise coffee brewing engine. Always respond with valid JSON only — no markdown, no prose outside the JSON.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.8,
            reasoning_effort: "none",
            response_format: { type: "json_object" },
          }),
        }
      );

      if (!response.ok) {
        const body = await response.text();
        console.error("Mistral HTTP error:", response.status, body);
        return { ok: false as const, error: `Mistral returned ${response.status}` };
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json?.choices?.[0]?.message?.content;
      if (!text) {
        return { ok: false as const, error: "Empty response from Mistral" };
      }

      const parsed = safeParseJSON(text) as {
        title: string;
        grind: string;
        waterTempC: number;
        totalTimeSec: number;
        steps: Array<{ label: string; timeSec: number; waterG?: number; detail: string }>;
        tastingNote: string;
        tip: string;
        pairings: { food: string; book: string; music: string };
      };

      if (!parsed.title || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
        return { ok: false as const, error: "Malformed recipe payload" };
      }

      const result = { ok: true as const, recipe: parsed };
      await ctx.runMutation(internal.cache.set, { key: cacheKey, value: JSON.stringify(result) });
      return result;
    } catch (error) {
      console.error("brewingRecipe error:", error);
      return {
        ok: false as const,
        error: "Could not generate recipe. Try again in a moment.",
      };
    }
  },
});

// ── Sip Forecast: AI-generated cup forecast for easy coffee bags ──
// Bag products don't need grinders or scales — they're drop-and-steep
// (cold-brew) or single-pour (drip-bag). This action returns a mood-matched
// "forecast" with a tailored ritual, a 3-phase flavor arc, and a pairing.
// Mistral only (env: MISTRAL_API_KEY).
export const sipForecast = action({
  args: {
    productName: v.string(),
    roastLevel: v.optional(v.string()),
    origin: v.optional(v.string()),
    flavorNotes: v.array(v.string()),
    bagKind: v.string(), // "drip-bag" | "cold-brew"
    moment: v.string(), // e.g. "morning-calm", "late-night", free text ok
    cupSize: v.string(), // "small" | "medium" | "large"
    intensity: v.string(), // "gentle" | "balanced" | "bold"
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error:
          "MISTRAL_API_KEY not configured. Set it in the Convex dashboard to unlock the Sip Forecast.",
      };
    }

    const cacheKey = makeCacheKey("sipForecast", args);
    const cached = (await ctx.runQuery(internal.cache.get, { key: cacheKey })) as { value: string } | null;
    if (cached) return JSON.parse(cached.value) as { ok: true; forecast: unknown };

    const methodHint =
      args.bagKind === "cold-brew"
        ? "COLD BREW IMMERSION BAG — drop one bag into cold water in a sealed jar, refrigerate. No heat, no equipment. Time is measured in hours (8–18). Output a steep duration in hours."
        : "DRIP / POUR-OVER BAG — hang the bag's paper ears over a mug, pour hot water in stages. No grinder, no scale. Time is measured in seconds per pour (20–45s) and water temp in Celsius (88–96).";

    const prompt = `
You are Third Intelligence, the cup forecaster for Third Wave Coffee. The
customer is holding an easy coffee bag (not loose beans, not a machine).
Generate a poetic, useful "sip forecast" that matches their moment.

PRODUCT
- Name: ${args.productName}
- Roast: ${args.roastLevel ?? "unspecified"}
- Origin: ${args.origin ?? "unspecified"}
- Flavor notes: ${args.flavorNotes.join(", ") || "n/a"}

METHOD: ${methodHint}

CONTEXT
- Moment: ${args.moment}
- Cup size: ${args.cupSize}
- Intensity preference: ${args.intensity}

Return JSON ONLY, this exact shape, no markdown:
{
  "title": "evocative 3-5 word forecast title",
  "headline": "single-line technical summary, e.g. '92°C · 30s per pour · 3 pours' (drip) or '12 hours · refrigerator · 1 bag per 300ml' (cold-brew)",
  "ritual": [
    { "label": "Pour 1", "detail": "max 18 words" }
  ],
  "arc": [
    { "moment": "First sip", "note": "max 14 words sensory description" },
    { "moment": "Mid cup", "note": "max 14 words" },
    { "moment": "Final sip", "note": "max 14 words" }
  ],
  "cupCard": "2 short sentences (max 35 words total) describing the cup as if narrating their moment. Poetic but specific.",
  "pairings": {
    "food": "one short food pairing suggestion (max 8 words)",
    "book": "one short book or genre suggestion (max 8 words)",
    "music": "one short music artist, genre, or playlist suggestion (max 8 words)"
  }
}

Rules:
- ritual: 2–4 steps total, scaled to bag kind
- arc: ALWAYS exactly 3 entries
- Reference the product's flavor notes and origin where natural
- Tie cupCard to the moment without being saccharine
- Voice: precise, confident, slightly cinematic. No exclamations. No emojis.
`.trim();

    try {
      const response = await fetch(
        "https://api.mistral.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "mistral-small-2603",
            messages: [
              {
                role: "system",
                content:
                  "You are Third Intelligence, the sip forecaster. Always respond with valid JSON only — no markdown, no prose outside the JSON.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.9,
            reasoning_effort: "none",
            response_format: { type: "json_object" },
          }),
        }
      );

      if (!response.ok) {
        const body = await response.text();
        console.error("Mistral HTTP error (sipForecast):", response.status, body);
        return { ok: false as const, error: `Mistral returned ${response.status}` };
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json?.choices?.[0]?.message?.content;
      if (!text) {
        return { ok: false as const, error: "Empty response from Mistral" };
      }

      const parsed = safeParseJSON(text) as {
        title: string;
        headline: string;
        ritual: Array<{ label: string; detail: string }>;
        arc: Array<{ moment: string; note: string }>;
        cupCard: string;
        pairings: { food: string; book: string; music: string };
      };

      if (
        !parsed.title ||
        !Array.isArray(parsed.ritual) ||
        parsed.ritual.length === 0 ||
        !Array.isArray(parsed.arc) ||
        parsed.arc.length !== 3 ||
        !parsed.cupCard ||
        !parsed.pairings
      ) {
        return { ok: false as const, error: "Malformed forecast payload" };
      }

      const result = { ok: true as const, forecast: parsed };
      await ctx.runMutation(internal.cache.set, { key: cacheKey, value: JSON.stringify(result) });
      return result;
    } catch (error) {
      console.error("sipForecast error:", error);
      return {
        ok: false as const,
        error: "Could not generate forecast. Try again in a moment.",
      };
    }
  },
});

// ── Flavored Drink: AI builds a café-quality drink recipe on top of the bean ──
// Used by BrewingStudio "Signature Drink" mode. Caller provides bean details +
// drink spec (style, flavor addition, milk, temperature, size).
// Mistral only (env: MISTRAL_API_KEY).
export const flavoredDrink = action({
  args: {
    productName: v.string(),
    roastLevel: v.optional(v.string()),
    flavorNotes: v.array(v.string()),
    drinkStyle: v.string(), // "latte" | "cappuccino" | "flat-white" | "mocha" | "cortado" | "cold-tonic" | "whipped" | "affogato"
    flavorAdd: v.string(), // "none" | "vanilla" | "caramel" | "hazelnut" | "cinnamon" | "brown sugar" | "cardamom" | "rose"
    milk: v.string(), // "whole" | "oat" | "almond" | "coconut" | "soy" | "no milk"
    temperature: v.string(), // "hot" | "iced"
    size: v.string(), // "small" | "medium" | "large"
    brewMethod: v.optional(v.string()), // e.g. "drip-bag pour-over" | "cold-brew immersion bag" — omit for espresso-based
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error:
          "MISTRAL_API_KEY not configured. Set it in the Convex dashboard to unlock signature drinks.",
      };
    }

    const cacheKey = makeCacheKey("flavoredDrink", args);
    const cached = (await ctx.runQuery(internal.cache.get, { key: cacheKey })) as { value: string } | null;
    if (cached) return JSON.parse(cached.value) as { ok: true; recipe: unknown };

    const prompt = `
You are Third Intelligence, the craft drinks engine for Third Wave Coffee.
Build a premium café-quality drink recipe using the provided coffee base.

COFFEE BASE
- Name: ${args.productName}
- Roast: ${args.roastLevel ?? "unspecified"}
- Flavor notes: ${args.flavorNotes.join(", ") || "n/a"}

DRINK SPEC
- Style: ${args.drinkStyle}
- Flavor addition: ${args.flavorAdd === "none" ? "none — serve clean" : args.flavorAdd}
- Milk: ${args.milk === "no milk" ? "no milk" : `${args.milk} milk`}
- Temperature: ${args.temperature}
- Size: ${args.size}${args.brewMethod ? `
- Base brew method: ${args.brewMethod} — the coffee is brewed as a bag (no espresso machine). Adapt the build steps for this brew base.` : ""}

Return JSON ONLY, no markdown, no prose outside JSON:
{
  "title": "drink name (3-5 words, creative but grounded)",
  "servingNote": "concise descriptor e.g. 'Hot · 300ml · double shot' or 'Iced · 400ml · slow pour'",
  "steps": [
    { "label": "step name (2-3 words)", "duration": "time hint (e.g. '30s', '2 min', 'immediately')", "detail": "max 20 words, precise barista instruction" }
  ],
  "tastingNote": "one sentence sensory prediction referencing the coffee's flavor notes and the flavor addition",
  "tip": "one sentence pro tip specific to this drink+coffee combination",
  "pairings": {
    "food": "one short food pairing suggestion (max 8 words)",
    "book": "one short book or genre suggestion (max 8 words)",
    "music": "one short music artist, genre, or playlist suggestion (max 8 words)"
  }
}

Rules:
- 3-5 steps total
- For "iced": include ice and layering in steps; build top-to-bottom in glass
- For "no milk": adapt to a black or tonic variation — no milk steps at all
- For "affogato": vanilla ice cream is implied even if no flavor is selected
- If flavorAdd is "none", do not reference any syrup in the build
- Reference the coffee's actual flavor notes in tastingNote
- Voice: precise, confident, Third Intelligence. No emojis, no exclamations.
`.trim();

    try {
      const response = await fetch(
        "https://api.mistral.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "mistral-small-2603",
            messages: [
              {
                role: "system",
                content:
                  "You are Third Intelligence, a precise craft drinks engine. Always respond with valid JSON only — no markdown, no prose outside the JSON.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.85,
            reasoning_effort: "none",
            response_format: { type: "json_object" },
          }),
        }
      );

      if (!response.ok) {
        const body = await response.text();
        console.error("Mistral HTTP error (flavoredDrink):", response.status, body);
        return { ok: false as const, error: `Mistral returned ${response.status}` };
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json?.choices?.[0]?.message?.content;
      if (!text) {
        return { ok: false as const, error: "Empty response from Mistral" };
      }

      const parsed = safeParseJSON(text) as {
        title: string;
        servingNote: string;
        steps: Array<{ label: string; duration: string; detail: string }>;
        tastingNote: string;
        tip: string;
        pairings: { food: string; book: string; music: string };
      };

      if (
        !parsed.title ||
        !Array.isArray(parsed.steps) ||
        parsed.steps.length === 0 ||
        !parsed.tastingNote
      ) {
        return { ok: false as const, error: "Malformed drink payload" };
      }

      const result = { ok: true as const, recipe: parsed };
      await ctx.runMutation(internal.cache.set, { key: cacheKey, value: JSON.stringify(result) });
      return result;
    } catch (error) {
      console.error("flavoredDrink error:", error);
      return {
        ok: false as const,
        error: "Could not craft your drink. Try again in a moment.",
      };
    }
  },
});
