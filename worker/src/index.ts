/**
 * Brewmatch Cloudflare Worker — Security Proxy
 *
 * Routes:
 *   POST /orders           → Convex mutation  orders:submitOrder
 *   POST /recommendations  → Convex action    recommendations:brewingRecipe
 *                                              recommendations:flavoredDrink
 *
 * Environment variables (set via `wrangler secret put` or Cloudflare dashboard):
 *   CONVEX_URL      — https://different-bulldog-772.convex.cloud
 *   ALLOWED_ORIGIN  — e.g. https://YOUR-USERNAME.github.io  (or omit for *)
 *
 * Local dev: copy worker/.dev.vars.example → worker/.dev.vars and run:
 *   cd worker && npm run dev
 */

import { checkRateLimit, getRateLimitKey } from "./rate-limit";

export interface Env {
  CONVEX_URL: string;
  /** Comma-separated allowed origins, e.g. "https://foo.github.io,http://localhost:3000" */
  ALLOWED_ORIGIN?: string;
}

// ── CORS ─────────────────────────────────────────────────────────────────────

function buildCorsHeaders(env: Env, requestOrigin: string | null): Record<string, string> {
  const allowed = env.ALLOWED_ORIGIN ?? "*";
  // If wildcard, echo * (browsers require literal *; no credential cookies).
  // If specific origins, echo the request origin only if it matches.
  const allowedOrigins = allowed.split(",").map((o) => o.trim());
  const matchedOrigin =
    allowed === "*"
      ? "*"
      : requestOrigin && allowedOrigins.includes(requestOrigin)
        ? requestOrigin
        : allowedOrigins[0]; // fallback to first configured origin

  return {
    "Access-Control-Allow-Origin": matchedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

// ── Convex HTTP API ───────────────────────────────────────────────────────────

interface ConvexResponse {
  status: "success" | "error";
  value?: unknown;
  errorMessage?: string;
  errorData?: unknown;
}

/**
 * Call a Convex mutation or action via the Convex HTTP API.
 * Uses `format: "json"` so plain JSON args are accepted (no Convex encoding
 * needed since all args in this proxy are primitive types).
 *
 * Throws on Convex error — the caller returns HTTP 500 to the client with
 * the original Convex error message (including ConvexError messages, which
 * lets the CheckoutPage discount-retry logic work correctly).
 */
async function callConvex(
  convexUrl: string,
  type: "mutation" | "action",
  path: string,
  args: unknown
): Promise<unknown> {
  const res = await fetch(`${convexUrl}/api/${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" }),
  });

  const data = (await res.json()) as ConvexResponse;

  if (data.status === "error") {
    throw new Error(data.errorMessage ?? "Convex returned an error");
  }
  return data.value;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function jsonRes(
  body: unknown,
  status: number,
  cors: Record<string, string>
): Response {
  return Response.json(body, { status, headers: cors });
}

// ── /orders ───────────────────────────────────────────────────────────────────

async function handleOrders(
  request: Request,
  env: Env,
  cors: Record<string, string>
): Promise<Response> {
  const ip = getRateLimitKey(request);
  if (!checkRateLimit(ip, 20, 60_000)) {
    return jsonRes({ error: "Too many requests. Please wait and try again." }, 429, cors);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonRes({ error: "Invalid JSON body" }, 400, cors);
  }

  const b = body as Record<string, unknown>;

  // ── customer ────────────────────────────────────────────────────────────────
  const customer = b.customer as Record<string, unknown> | undefined;
  if (!customer || typeof customer !== "object") {
    return jsonRes({ error: "Missing customer object" }, 400, cors);
  }

  const custName = customer.name as string | undefined;
  if (!custName?.trim()) {
    return jsonRes({ error: "customer.name is required" }, 400, cors);
  }

  const custPhone = customer.phone as string | undefined;
  if (!custPhone || !/^\d{10}$/.test(custPhone)) {
    return jsonRes({ error: "customer.phone must be a 10-digit number" }, 400, cors);
  }

  const custEmail = customer.email as string | undefined;
  if (
    !custEmail ||
    !custEmail.includes("@") ||
    !custEmail.split("@")[1]?.includes(".")
  ) {
    return jsonRes({ error: "customer.email is invalid" }, 400, cors);
  }

  // ── address ─────────────────────────────────────────────────────────────────
  const address = customer.address as Record<string, unknown> | undefined;
  if (!address || typeof address !== "object") {
    return jsonRes({ error: "Missing customer.address object" }, 400, cors);
  }

  const addrLine1 = address.line1 as string | undefined;
  if (!addrLine1?.trim()) return jsonRes({ error: "address.line1 is required" }, 400, cors);

  const addrCity = address.city as string | undefined;
  if (!addrCity?.trim()) return jsonRes({ error: "address.city is required" }, 400, cors);

  const addrState = address.state as string | undefined;
  if (!addrState?.trim()) return jsonRes({ error: "address.state is required" }, 400, cors);

  const addrPincode = address.pincode as string | undefined;
  if (!addrPincode || !/^\d{6}$/.test(addrPincode)) {
    return jsonRes({ error: "address.pincode must be a 6-digit number" }, 400, cors);
  }

  // ── items ───────────────────────────────────────────────────────────────────
  const rawItems = b.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return jsonRes({ error: "items must be a non-empty array" }, 400, cors);
  }
  for (const item of rawItems) {
    const it = item as Record<string, unknown>;
    if (
      !it.productId ||
      !it.name ||
      typeof it.qty !== "number" ||
      typeof it.price !== "number"
    ) {
      return jsonRes(
        { error: "Each item must have productId, name, qty (number), price (number)" },
        400,
        cors
      );
    }
  }

  // ── subtotal ────────────────────────────────────────────────────────────────
  const subtotal = b.subtotal as number | undefined;
  if (typeof subtotal !== "number" || subtotal <= 0) {
    return jsonRes({ error: "subtotal must be a positive number" }, 400, cors);
  }

  // ── forward to Convex ───────────────────────────────────────────────────────
  try {
    const result = await callConvex(
      env.CONVEX_URL,
      "mutation",
      "orders:submitOrder",
      {
        customer: {
          name: custName.trim(),
          phone: custPhone,
          email: custEmail,
          address: {
            line1: addrLine1.trim(),
            ...(typeof address.line2 === "string" && address.line2.trim()
              ? { line2: address.line2.trim() }
              : {}),
            city: addrCity.trim(),
            state: addrState.trim(),
            pincode: addrPincode,
          },
        },
        items: (rawItems as Array<Record<string, unknown>>).map((item) => ({
          productId: item.productId as string,
          name: item.name as string,
          imageUrl: item.imageUrl as string,
          qty: item.qty as number,
          price: item.price as number,
        })),
        subtotal,
        ...(typeof b.paymentMethod === "string"
          ? { paymentMethod: b.paymentMethod }
          : {}),
        ...(typeof b.discountCode === "string" && b.discountCode
          ? { discountCode: b.discountCode }
          : {}),
      }
    );
    return jsonRes(result, 200, cors);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Order submission failed";
    return jsonRes({ error: msg }, 500, cors);
  }
}

// ── /recommendations ─────────────────────────────────────────────────────────

async function handleRecommendations(
  request: Request,
  env: Env,
  cors: Record<string, string>
): Promise<Response> {
  const ip = getRateLimitKey(request);
  if (!checkRateLimit(ip, 10, 60_000)) {
    return jsonRes({ error: "Too many requests. Please wait and try again." }, 429, cors);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonRes({ error: "Invalid JSON body" }, 400, cors);
  }

  const b = body as Record<string, unknown>;

  // ── discriminator ───────────────────────────────────────────────────────────
  const kind = b.kind as string | undefined;
  if (kind !== "brew" && kind !== "drink") {
    return jsonRes({ error: 'kind must be "brew" or "drink"' }, 400, cors);
  }

  // ── shared ──────────────────────────────────────────────────────────────────
  const productName = b.productName as string | undefined;
  if (!productName?.trim()) {
    return jsonRes({ error: "productName is required" }, 400, cors);
  }

  const flavorNotes = b.flavorNotes as string[] | undefined;
  if (!Array.isArray(flavorNotes)) {
    return jsonRes({ error: "flavorNotes must be an array" }, 400, cors);
  }

  // ── dispatch ────────────────────────────────────────────────────────────────
  try {
    if (kind === "brew") {
      const method = b.method as string | undefined;
      if (!method?.trim()) return jsonRes({ error: "method is required for brew" }, 400, cors);

      const strength = b.strength as string | undefined;
      if (!strength?.trim()) return jsonRes({ error: "strength is required for brew" }, 400, cors);

      const dose = b.dose as number | undefined;
      if (typeof dose !== "number" || dose <= 0) {
        return jsonRes({ error: "dose must be a positive number" }, 400, cors);
      }

      const ratio = b.ratio as number | undefined;
      if (typeof ratio !== "number" || ratio <= 0) {
        return jsonRes({ error: "ratio must be a positive number" }, 400, cors);
      }

      const result = await callConvex(
        env.CONVEX_URL,
        "action",
        "recommendations:brewingRecipe",
        {
          productName: productName.trim(),
          ...(typeof b.roastLevel === "string" ? { roastLevel: b.roastLevel } : {}),
          ...(typeof b.origin === "string" ? { origin: b.origin } : {}),
          flavorNotes,
          method: method.trim(),
          dose,
          ratio,
          strength: strength.trim(),
        }
      );
      return jsonRes(result, 200, cors);
    } else {
      // drink
      const drinkStyle = b.drinkStyle as string | undefined;
      if (!drinkStyle?.trim()) return jsonRes({ error: "drinkStyle is required" }, 400, cors);

      const flavorAdd = b.flavorAdd as string | undefined;
      if (!flavorAdd?.trim()) return jsonRes({ error: "flavorAdd is required" }, 400, cors);

      const milk = b.milk as string | undefined;
      if (!milk?.trim()) return jsonRes({ error: "milk is required" }, 400, cors);

      const temperature = b.temperature as string | undefined;
      if (!temperature?.trim()) return jsonRes({ error: "temperature is required" }, 400, cors);

      const size = b.size as string | undefined;
      if (!size?.trim()) return jsonRes({ error: "size is required" }, 400, cors);

      const result = await callConvex(
        env.CONVEX_URL,
        "action",
        "recommendations:flavoredDrink",
        {
          productName: productName.trim(),
          ...(typeof b.roastLevel === "string" ? { roastLevel: b.roastLevel } : {}),
          flavorNotes,
          drinkStyle: drinkStyle.trim(),
          flavorAdd: flavorAdd.trim(),
          milk: milk.trim(),
          temperature: temperature.trim(),
          size: size.trim(),
        }
      );
      return jsonRes(result, 200, cors);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Recommendation request failed";
    return jsonRes({ error: msg }, 500, cors);
  }
}

// ── Router ────────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") ?? null;
    const cors = buildCorsHeaders(env, origin);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "POST") {
      return jsonRes({ error: "Method not allowed" }, 405, cors);
    }

    if (url.pathname === "/orders") return handleOrders(request, env, cors);
    if (url.pathname === "/recommendations") return handleRecommendations(request, env, cors);

    return jsonRes({ error: "Not found" }, 404, cors);
  },
} satisfies ExportedHandler<Env>;
