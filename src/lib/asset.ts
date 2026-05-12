/**
 * Resolve a path under the Vite `base` (e.g. "/brewmatch-ai/").
 * Always pass a path relative to /public, no leading slash needed.
 *
 *   asset("logo.png") -> "/brewmatch-ai/logo.png" in prod
 *   asset("logo.png") -> "/logo.png" in dev
 */
export function asset(p: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const clean = p.startsWith("/") ? p.slice(1) : p;
  return base.endsWith("/") ? base + clean : `${base}/${clean}`;
}
