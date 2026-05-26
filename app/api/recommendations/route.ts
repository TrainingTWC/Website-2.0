export const dynamic = "force-dynamic";

import { convexServer, convexApi } from "../_lib/convex-server";
import { checkRateLimit, getRateLimitKey } from "../_lib/rate-limit";

export async function POST(request: Request): Promise<Response> {
  // Rate limit: 10 requests per minute per IP (AI calls consume OpenAI quota)
  const ip = getRateLimitKey(request);
  if (!checkRateLimit(ip, 10, 60_000)) {
    return Response.json({ error: "Too many requests. Please wait and try again." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  // ── Discriminator ────────────────────────────────────────────────────────
  const kind = b.kind as string | undefined;
  if (kind !== "brew" && kind !== "drink") {
    return Response.json({ error: 'kind must be "brew" or "drink"' }, { status: 400 });
  }

  // ── Shared fields ────────────────────────────────────────────────────────
  const productName = b.productName as string | undefined;
  if (!productName || !productName.trim()) {
    return Response.json({ error: "productName is required" }, { status: 400 });
  }

  const flavorNotes = b.flavorNotes as string[] | undefined;
  if (!Array.isArray(flavorNotes)) {
    return Response.json({ error: "flavorNotes must be an array" }, { status: 400 });
  }

  // ── Dispatch ─────────────────────────────────────────────────────────────
  try {
    if (kind === "brew") {
      // ── Brew-specific validation ─────────────────────────────────────────
      const method = b.method as string | undefined;
      if (!method || !method.trim()) {
        return Response.json({ error: "method is required for brew" }, { status: 400 });
      }

      const strength = b.strength as string | undefined;
      if (!strength || !strength.trim()) {
        return Response.json({ error: "strength is required for brew" }, { status: 400 });
      }

      const dose = b.dose as number | undefined;
      if (typeof dose !== "number" || dose <= 0) {
        return Response.json({ error: "dose must be a positive number" }, { status: 400 });
      }

      const ratio = b.ratio as number | undefined;
      if (typeof ratio !== "number" || ratio <= 0) {
        return Response.json({ error: "ratio must be a positive number" }, { status: 400 });
      }

      const result = await convexServer.action(convexApi.recommendations.brewingRecipe, {
        productName: productName.trim(),
        ...(typeof b.roastLevel === "string" ? { roastLevel: b.roastLevel } : {}),
        ...(typeof b.origin === "string" ? { origin: b.origin } : {}),
        flavorNotes,
        method: method.trim(),
        dose,
        ratio,
        strength: strength.trim(),
      });

      return Response.json(result, { status: 200 });
    } else {
      // ── Drink-specific validation ────────────────────────────────────────
      const drinkStyle = b.drinkStyle as string | undefined;
      if (!drinkStyle || !drinkStyle.trim()) {
        return Response.json({ error: "drinkStyle is required for drink" }, { status: 400 });
      }

      const flavorAdd = b.flavorAdd as string | undefined;
      if (!flavorAdd || !flavorAdd.trim()) {
        return Response.json({ error: "flavorAdd is required for drink" }, { status: 400 });
      }

      const milk = b.milk as string | undefined;
      if (!milk || !milk.trim()) {
        return Response.json({ error: "milk is required for drink" }, { status: 400 });
      }

      const temperature = b.temperature as string | undefined;
      if (!temperature || !temperature.trim()) {
        return Response.json({ error: "temperature is required for drink" }, { status: 400 });
      }

      const size = b.size as string | undefined;
      if (!size || !size.trim()) {
        return Response.json({ error: "size is required for drink" }, { status: 400 });
      }

      const result = await convexServer.action(convexApi.recommendations.flavoredDrink, {
        productName: productName.trim(),
        ...(typeof b.roastLevel === "string" ? { roastLevel: b.roastLevel } : {}),
        flavorNotes,
        drinkStyle: drinkStyle.trim(),
        flavorAdd: flavorAdd.trim(),
        milk: milk.trim(),
        temperature: temperature.trim(),
        size: size.trim(),
      });

      return Response.json(result, { status: 200 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Recommendation request failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
