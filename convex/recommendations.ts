"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { BRAND_CONTEXT, buildPersonalitiesBlock } from "./productContext";

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
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return {
        primaryProductIds: [],
        crossSellProductIds: [],
        explanation:
          "AI recommendations are not configured. Please set the MISTRAL_API_KEY environment variable in your Convex dashboard.",
      };
    }

    const productNames = args.products.map((p) => p.name);
    const personalitiesBlock = buildPersonalitiesBlock(productNames);

    const catalogSnippet = args.products
      .map(
        (p) =>
          `ID: ${p._id} | Name: ${p.name} | Category: ${p.category} | Roast: ${p.roastLevel ?? "N/A"} | Origin: ${p.origin ?? "N/A"} | Flavor: ${p.flavorNotes.join(", ")} | Price: ₹${p.price.toLocaleString("en-IN")}`
      )
      .join("\n");

    const answersSnippet = Object.entries(args.answers as Record<string, string>)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const prompt = `
${BRAND_CONTEXT}

${personalitiesBlock}

PRODUCT CATALOG (ID | Name | Category | Roast | Origin | Flavor | Price):
${catalogSnippet}

CUSTOMER ANSWERS:
${answersSnippet}

TASK:
You are Third Intelligence, the recommendation engine for Third Wave Coffee.
Using the brand voice directive above, select the best product matches for this customer.

Rules:
- primaryProductIds: 1–3 IDs of coffee products (beans or bags) that best match the customer's answers
- crossSellProductIds: 1–2 IDs of complementary products (gear, merch, or different format coffee) — use crossSellAffinity from the personality profiles as guidance
- explanation: 2–3 sentences in Third Intelligence voice (crisp, confident, precise). Reference the matched product's archetype, specific flavor notes, and a brewing suggestion. Do NOT use filler like "great choice", "you'll love this", or "based on your preferences".

RETURN JSON ONLY:
{
  "primaryProductIds": ["id1"],
  "crossSellProductIds": ["id2"],
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
            model: "mistral-small-latest",
            messages: [
              {
                role: "system",
                content: "You are Third Intelligence, a coffee recommendation engine. Always respond with valid JSON only — no markdown, no explanation outside the JSON.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.7,
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

      const parsed = JSON.parse(text) as {
        primaryProductIds: string[];
        crossSellProductIds: string[];
        explanation: string;
      };

      // Validate required fields exist
      if (!Array.isArray(parsed.primaryProductIds) || !parsed.explanation) {
        throw new Error("Malformed response structure from Mistral");
      }

      return parsed;
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
  handler: async (_ctx, args) => {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error:
          "MISTRAL_API_KEY not configured. Set it in the Convex dashboard to unlock AI brewing recipes.",
      };
    }

    const yieldMl = Math.round(args.dose * args.ratio);
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
- Ratio: 1:${args.ratio} (target yield ~${yieldMl} ml)
- Strength preference: ${args.strength}

Return JSON ONLY in this exact shape — no markdown, no prose outside JSON:
{
  "title": "short evocative recipe name (max 6 words)",
  "grind": "grind size description (e.g. 'medium-fine, like table salt')",
  "waterTempC": <number 80-96>,
  "totalTimeSec": <number>,
  "steps": [
    { "label": "Bloom", "timeSec": 30, "detail": "Pour 40g water, swirl, wait." },
    { "label": "First pour", "timeSec": 30, "detail": "..." }
  ],
  "tastingNote": "1 sentence prediction of how the cup will taste, referencing the bean's flavor notes",
  "tip": "1 sentence pro tip specific to this bean+method combination"
}

Rules:
- 3 to 6 steps total, each with timeSec and detail (max 18 words)
- Sum of step timeSec must equal totalTimeSec
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
            model: "mistral-small-latest",
            messages: [
              {
                role: "system",
                content:
                  "You are Third Intelligence, a precise coffee brewing engine. Always respond with valid JSON only — no markdown, no prose outside the JSON.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.8,
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

      const parsed = JSON.parse(text) as {
        title: string;
        grind: string;
        waterTempC: number;
        totalTimeSec: number;
        steps: Array<{ label: string; timeSec: number; detail: string }>;
        tastingNote: string;
        tip: string;
      };

      if (!parsed.title || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
        return { ok: false as const, error: "Malformed recipe payload" };
      }

      return { ok: true as const, recipe: parsed };
    } catch (error) {
      console.error("brewingRecipe error:", error);
      return {
        ok: false as const,
        error: "Could not generate recipe. Try again in a moment.",
      };
    }
  },
});
