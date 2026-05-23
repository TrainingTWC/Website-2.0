/**
 * Resolve a path under the public base.
 * Always pass a path relative to /public, no leading slash needed.
 *
 *   asset("logo.png") -> "/logo.png"
 */
export function asset(p: string): string {
  const base = "/";
  const clean = p.startsWith("/") ? p.slice(1) : p;

  if (/^assets\/.*\.(jpe?g|png)$/i.test(clean)) {
    const fileName = clean.slice("assets/".length).replace(/\.(jpe?g|png)$/i, ".webp");
    return `${base}optimized/${fileName}`;
  }

  if (clean === "third-intelligence-icon.png") {
    return `${base}third-intelligence-icon.webp`;
  }

  return base + clean;
}
