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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        primaryProductIds: [],
        crossSellProductIds: [],
        explanation:
          "AI recommendations are not configured. Please set the GEMINI_API_KEY environment variable in your Convex dashboard.",
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        console.error("Gemini HTTP error:", response.status, await response.text());
        throw new Error(`Gemini returned ${response.status}`);
      }

      const json = await response.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from Gemini");

      const parsed = JSON.parse(text) as {
        primaryProductIds: string[];
        crossSellProductIds: string[];
        explanation: string;
      };

      // Validate required fields exist
      if (!Array.isArray(parsed.primaryProductIds) || !parsed.explanation) {
        throw new Error("Malformed response structure from Gemini");
      }

      return parsed;
    } catch (error) {
      console.error("Gemini Error:", error);
      return {
        primaryProductIds: [],
        crossSellProductIds: [],
        explanation:
          "Something went wrong while brewing your recommendation. Please try again!",
      };
    }
  },
});
