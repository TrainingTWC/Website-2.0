const HOME_SECTION_TARGETS = new Set([
  "home",
  "hero",
  "section-coffee-beans",
  "section-coffee-ecb",
  "section-coffee-brewing",
  "section-merch-drinkware",
  "section-merch-bags",
  "section-merch-keychains",
  "section-merch-chocolates",
  "section-merch-brewing",
  "categories",
  "our-story",
]);

export function hrefForNavTarget(target: string): string {
  if (target === "third-circle") return "/third-circle";
  if (target === "order-portal") return "/orders";
  if (target === "shop") return "/shop";
  if (target === "home" || target === "hero") return "/";
  if (HOME_SECTION_TARGETS.has(target)) return `/#${target}`;
  return `/${target}`;
}

