import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

// ── Data Export API ──────────────────────────────────────────────────────────
//
// GET  https://watchful-cormorant-351.convex.site/api/v1/export
//      ?from=<unix_ms>   — optional; default: 0 (all-time)
//                          pass the previous response's `generatedAt` value
//                          for incremental / delta syncs
//
// Headers:
//   Authorization: Bearer <api_key>
//
// Response: JSON — see shape below.
//
// API keys are created by superadmins via convex/apiKeys.ts → createApiKey().
// The full key is shown exactly once at creation time and never stored.
// ─────────────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

async function sha256hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const exportHandler = httpAction(async (ctx, request) => {
  // ── CORS preflight ────────────────────────────────────────────────────────
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // ── Authenticate ──────────────────────────────────────────────────────────
  const authHeader = request.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonError(
      "Missing Authorization header. Use: Authorization: Bearer <api_key>",
      401
    );
  }
  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("twc_live_")) {
    return jsonError("Invalid API key format.", 401);
  }

  const keyHash = await sha256hex(rawKey);
  const { valid } = await ctx.runMutation(internal.apiKeys._validateAndTouch, {
    keyHash,
  });
  if (!valid) {
    return jsonError("Invalid or revoked API key.", 401);
  }

  // ── Parse query params ─────────────────────────────────────────────────────
  const url = new URL(request.url);
  const fromParam = url.searchParams.get("from");
  // Default = 0 (all-time) so first sync always returns everything.
  // For incremental sync, pass the previous response's `generatedAt` as ?from=
  const from = fromParam ? Math.max(0, parseInt(fromParam, 10)) : 0;
  const fromDate = from > 0
    ? new Date(from).toISOString().slice(0, 10) // "YYYY-MM-DD"
    : "2020-01-01"; // safe all-time floor for the daily summary string index

  // ── Fetch all data in parallel ─────────────────────────────────────────────
  const [
    orders,
    orderSummary,
    products,
    categories,
    admins,
    discounts,
    posts,
    pageViewDailySummary,
    pageViews,
    customerEvents,
    cartSnapshots,
    clientErrors,
    funnelSummary,
    webVitals,
    auditLog,
    media,
  ] = await Promise.all([
    ctx.runQuery(internal.dataExport._getOrders, { from }),
    ctx.runQuery(internal.dataExport._getOrderSummary, {}),
    ctx.runQuery(internal.dataExport._getProducts, {}),
    ctx.runQuery(internal.dataExport._getCategories, {}),
    ctx.runQuery(internal.dataExport._getAdmins, {}),
    ctx.runQuery(internal.dataExport._getDiscounts, {}),
    ctx.runQuery(internal.dataExport._getPosts, {}),
    ctx.runQuery(internal.dataExport._getPageViewDailySummary, { fromDate }),
    ctx.runQuery(internal.dataExport._getPageViews, { from }),
    ctx.runQuery(internal.dataExport._getCustomerEvents, { from }),
    ctx.runQuery(internal.dataExport._getCartSnapshots, { from }),
    ctx.runQuery(internal.dataExport._getClientErrors, { from }),
    ctx.runQuery(internal.dataExport._getFunnelSummary, {}),
    ctx.runQuery(internal.dataExport._getWebVitals, { from }),
    ctx.runQuery(internal.dataExport._getAuditLog, { from }),
    ctx.runQuery(internal.dataExport._getMedia, {}),
  ]);

  const generatedAt = Date.now();

  const payload = {
    // ── Meta ─────────────────────────────────────────────────────────────
    generatedAt,
    generatedAtISO: new Date(generatedAt).toISOString(),
    from,
    fromISO: new Date(from).toISOString(),
    tip: "For incremental sync, pass the previous response's `generatedAt` as ?from= on your next call.",

    // ── Row counts (quick sanity check without parsing the full payload) ──
    counts: {
      orders: (orders as unknown[]).length,
      products: (products as unknown[]).length,
      categories: (categories as unknown[]).length,
      admins: (admins as unknown[]).length,
      discounts: (discounts as unknown[]).length,
      posts: (posts as unknown[]).length,
      pageViewDailySummary: (pageViewDailySummary as unknown[]).length,
      pageViews: (pageViews as unknown[]).length,
      customerEvents: (customerEvents as unknown[]).length,
      cartSnapshots: (cartSnapshots as unknown[]).length,
      clientErrors: (clientErrors as unknown[]).length,
      funnelSummary: (funnelSummary as unknown[]).length,
      webVitals: (webVitals as unknown[]).length,
      auditLog: (auditLog as unknown[]).length,
      media: (media as unknown[]).length,
    },

    // ── Data ─────────────────────────────────────────────────────────────
    data: {
      // Transactional
      orders,
      orderSummary,
      // Catalogue
      products,
      categories,
      discounts,
      // Editorial
      posts,
      // Team
      admins,
      // Page views
      pageViewDailySummary,
      pageViews,
      // Funnel telemetry (v8.0)
      customerEvents,
      cartSnapshots,
      clientErrors,
      funnelSummary,
      // Performance
      webVitals,
      // Admin activity
      auditLog,
      // Studio media (v9.0)
      media,
    },
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "X-TWC-Export-Version": "1.0",
      "X-TWC-Generated-At": String(generatedAt),
      ...CORS_HEADERS,
    },
  });
});

http.route({ path: "/api/v1/export", method: "GET", handler: exportHandler });
http.route({ path: "/api/v1/export", method: "OPTIONS", handler: exportHandler });

export default http;
