export const dynamic = "force-dynamic";

import { convexServer, convexApi } from "../_lib/convex-server";
import { checkRateLimit, getRateLimitKey } from "../_lib/rate-limit";

export async function POST(request: Request): Promise<Response> {
  // Rate limit: 20 requests per minute per IP
  const ip = getRateLimitKey(request);
  if (!checkRateLimit(ip, 20, 60_000)) {
    return Response.json({ error: "Too many requests. Please wait and try again." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  // ── Validate customer ────────────────────────────────────────────────────
  const customer = b.customer as Record<string, unknown> | undefined;
  if (!customer || typeof customer !== "object") {
    return Response.json({ error: "Missing customer object" }, { status: 400 });
  }

  const custName = customer.name as string | undefined;
  if (!custName || !custName.trim()) {
    return Response.json({ error: "customer.name is required" }, { status: 400 });
  }

  const custPhone = customer.phone as string | undefined;
  if (!custPhone || !/^\d{10}$/.test(custPhone)) {
    return Response.json({ error: "customer.phone must be a 10-digit number" }, { status: 400 });
  }

  const custEmail = customer.email as string | undefined;
  if (
    !custEmail ||
    !custEmail.includes("@") ||
    !custEmail.split("@")[1]?.includes(".")
  ) {
    return Response.json({ error: "customer.email is invalid" }, { status: 400 });
  }

  // ── Validate address ─────────────────────────────────────────────────────
  const address = customer.address as Record<string, unknown> | undefined;
  if (!address || typeof address !== "object") {
    return Response.json({ error: "Missing customer.address object" }, { status: 400 });
  }

  const addrLine1 = address.line1 as string | undefined;
  if (!addrLine1 || !addrLine1.trim()) {
    return Response.json({ error: "address.line1 is required" }, { status: 400 });
  }

  const addrCity = address.city as string | undefined;
  if (!addrCity || !addrCity.trim()) {
    return Response.json({ error: "address.city is required" }, { status: 400 });
  }

  const addrState = address.state as string | undefined;
  if (!addrState || !addrState.trim()) {
    return Response.json({ error: "address.state is required" }, { status: 400 });
  }

  const addrPincode = address.pincode as string | undefined;
  if (!addrPincode || !/^\d{6}$/.test(addrPincode)) {
    return Response.json({ error: "address.pincode must be a 6-digit number" }, { status: 400 });
  }

  // ── Validate items ───────────────────────────────────────────────────────
  const rawItems = b.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return Response.json({ error: "items must be a non-empty array" }, { status: 400 });
  }
  for (const item of rawItems) {
    const it = item as Record<string, unknown>;
    if (
      !it.productId ||
      !it.name ||
      typeof it.qty !== "number" ||
      typeof it.price !== "number"
    ) {
      return Response.json(
        { error: "Each item must have productId, name, qty (number), and price (number)" },
        { status: 400 }
      );
    }
  }

  // ── Validate subtotal ────────────────────────────────────────────────────
  const subtotal = b.subtotal as number | undefined;
  if (typeof subtotal !== "number" || subtotal <= 0) {
    return Response.json({ error: "subtotal must be a positive number" }, { status: 400 });
  }

  // ── Forward to Convex ────────────────────────────────────────────────────
  try {
    const result = await convexServer.mutation(convexApi.orders.submitOrder, {
      customer: {
        name: custName.trim(),
        phone: custPhone,
        email: custEmail,
        address: {
          line1: addrLine1.trim(),
          line2:
            typeof address.line2 === "string" && address.line2.trim()
              ? address.line2.trim()
              : undefined,
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
      ...(typeof b.paymentMethod === "string" ? { paymentMethod: b.paymentMethod } : {}),
      ...(typeof b.discountCode === "string" && b.discountCode
        ? { discountCode: b.discountCode }
        : {}),
    });

    return Response.json(result, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Order submission failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
