"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

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
          "AI recommendations are not configured. Please set the GEMINI_API_KEY environment variable.",
      };
    }

    const productsSnippet = args.products
      .map(
        (p) => `
      ID: ${p._id}
      Name: ${p.name}
      Type: ${p.type}
      Category: ${p.category}
      Roast: ${p.roastLevel || "N/A"}
      Origin: ${p.origin || "N/A"}
      Tags: ${p.tags.join(", ")}
      Flavor Notes: ${p.flavorNotes.join(", ")}
      Price: ₹${p.price.toLocaleString("en-IN")}
      Description: ${p.description}
    `
      )
      .join("\n");

    const answersSnippet = JSON.stringify(args.answers);

    const prompt = `
      You are an expert barista and personal shopper for a high-end Indian specialty coffee shop.
      Based on the following customer preferences and our product catalog, recommend the perfect matches.
      
      CUSTOMER PREFERENCES:
      ${answersSnippet}
      
      PRODUCT CATALOG:
      ${productsSnippet}
      
      TASKS:
      1. Select 1-3 primary coffee product IDs that best match the customer's preferences.
      2. Select 1-2 complementary product IDs (gear, bundles, or other coffees that pair well).
      3. Provide a brief, warm, knowledgeable explanation of why these were chosen (max 3 sentences). Be specific about flavor notes and brewing suggestions.
      
      RETURN JSON ONLY in the following format:
      {
        "primaryProductIds": ["id1", "id2"],
        "crossSellProductIds": ["id3"],
        "explanation": "..."
      }
    `;

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

      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from Gemini");

      return JSON.parse(text) as {
        primaryProductIds: string[];
        crossSellProductIds: string[];
        explanation: string;
      };
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
