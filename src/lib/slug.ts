/** Convert a product name to a URL-safe slug. e.g. "Kenyan Single Origin" → "kenyan-single-origin" */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
