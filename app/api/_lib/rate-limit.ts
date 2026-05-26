// server-only — do not import this file in client components

/**
 * Module-level sliding window rate limiter.
 * In a long-running Node.js process (local dev, single-instance server),
 * this map persists across requests and provides accurate per-IP tracking.
 * On Vercel (serverless), each cold start creates a fresh instance, so
 * protection is per-worker rather than globally absolute — still effective
 * against bursts within a single warm instance.
 *
 * For global rate limiting at scale, replace with @upstash/ratelimit + Redis.
 */
const windowMap = new Map<string, number[]>();

/**
 * Check whether a key is within the allowed rate limit.
 * Returns `true` if the request is allowed, `false` if rate-limited.
 *
 * @param key       Identifier to track (typically a client IP address)
 * @param limit     Maximum number of requests allowed within `windowMs`
 * @param windowMs  Sliding window duration in milliseconds
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
  if (timestamps.length >= limit) {
    return false;
  }
  timestamps.push(now);
  windowMap.set(key, timestamps);
  return true;
}

/**
 * Derive a rate-limit key from the incoming request.
 * Reads `x-forwarded-for` (set by Vercel's edge network) and falls back
 * to "unknown" when not present.
 *
 * NOTE: In production on Vercel, x-forwarded-for is populated by the
 * edge network and reflects the real client IP. On a single-instance
 * server it also reflects the real IP. The "unknown" fallback groups all
 * unidentifiable clients under one key — conservative but safe.
 */
export function getRateLimitKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  return forwarded.split(",")[0].trim() || "unknown";
}
