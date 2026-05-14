"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";

const SUPPORT_SYSTEM_PROMPT = `You are a friendly, helpful customer support agent for Third Wave Coffee (TWC), a premium Indian specialty coffee brand.
You assist customers with questions about their orders, shipping, products, and general coffee queries.
Keep answers concise (2-4 sentences max). Be warm and professional.
If you don't know something specific about the order, say so honestly and offer to escalate.
Do not make up tracking numbers or shipping ETAs.`;

export const answerSupportQuery = action({
  args: {
    question: v.string(),
    orderContext: v.object({
      orderId: v.string(),
      status: v.string(),
      itemCount: v.number(),
      total: v.number(),
      customerName: v.string(),
      city: v.string(),
    }),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) throw new Error("MISTRAL_API_KEY not configured.");

    const userMessage = `Order context: Order ID ${args.orderContext.orderId}, status "${args.orderContext.status}", ${args.orderContext.itemCount} item(s), total ₹${args.orderContext.total}, customer ${args.orderContext.customerName} from ${args.orderContext.city}.

Customer question: ${args.question}`;

    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        max_tokens: 200,
        temperature: 0.4,
        messages: [
          { role: "system", content: SUPPORT_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Mistral API error: ${err}`);
    }

    const data = await res.json();
    const answer: string =
      data?.choices?.[0]?.message?.content ?? "Sorry, I couldn't process that. Please try again.";
    return { answer };
  },
});
