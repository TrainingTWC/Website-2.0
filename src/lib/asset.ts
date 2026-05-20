/**
 * Resolve a path under the public base.
 * Always pass a path relative to /public, no leading slash needed.
 *
 *   asset("logo.png") -> "/logo.png"
 */
export function asset(p: string): string {
  const base = "/";
  const clean = p.startsWith("/") ? p.slice(1) : p;
  return base + clean;
}
