/**
 * Per-IP sliding-window rate limiter.
 *
 * Uses a module-level Map, which persists for the lifetime of a warm Worker
 * instance. In Cloudflare's architecture each isolate handles many requests
 * before being evicted, so this provides meaningful burst protection.
 *
 * For exact global rate limiting across all Workers, replace with
 * Cloudflare Durable Objects or a Cloudflare Rate Limiting rule in the
 * dashboard (zero-code, applies before the Worker even runs).
 */
const windowMap = new Map<string, number[]>();

/**
 * Returns `true` if the request is allowed, `false` if rate-limited.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const timestamps = (windowMap.get(key) ?? []).filter(
    (t) => now - t < windowMs
  );
  if (timestamps.length >= limit) return false;
  timestamps.push(now);
  windowMap.set(key, timestamps);
  return true;
}

/**
 * Derive a rate-limit key from the incoming Cloudflare Worker request.
 * Prefers `cf-connecting-ip` (set by Cloudflare's edge, non-spoofable)
 * over `x-forwarded-for`. Falls back to "unknown".
 */
export function getRateLimitKey(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf && cf.trim()) return cf.trim();
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  return forwarded.split(",")[0].trim() || "unknown";
}
