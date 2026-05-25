// Canonical slot/slotKey registry for Brewing Studio media.
// Imported by:
//   - convex/media.ts (size-limit enforcement)
//   - src/components/StudioMedia.tsx (slot typing)
//   - src/components/admin/StudioMediaTab.tsx (Phase 2 slot picker)
//
// Adding a new slot or kind here is a deliberate schema change — keep this
// file in sync with the v.union literals in convex/schema.ts `media` table.

export const STUDIO_SLOTS = {
  brew_method: ["v60", "aeropress", "frenchpress", "coldbrew", "espresso"] as const,
  brew_step: [
    "v60.bloom",
    "v60.firstpour",
    "v60.secondpour",
    "v60.drawdown",
    "aeropress.bloom",
    "aeropress.stir",
    "aeropress.press",
    "frenchpress.bloom",
    "frenchpress.steep",
    "frenchpress.plunge",
    "coldbrew.grind",
    "coldbrew.steep",
    "coldbrew.decant",
    "espresso.grind",
    "espresso.tamp",
    "espresso.pull",
  ] as const,
  signature: [
    "el-diablo",
    "third-wave-latte",
    "honey-cortado",
    "iced-mocha-storm",
    "campfire-cold-brew",
    "cardamom-cold-fizz",
  ] as const,
  // Product slotKey is the product slug — open-ended, validated against the products table at runtime.
  product: [] as readonly string[],
  ambience: ["studio", "shop-floor", "v60-loop"] as const,
} as const;

export type StudioSlot = keyof typeof STUDIO_SLOTS;

export function isValidSlotKey(slot: StudioSlot, slotKey: string): boolean {
  if (slot === "product") return slotKey.length > 0;
  const allowed = STUDIO_SLOTS[slot] as readonly string[];
  return allowed.includes(slotKey);
}

export const MEDIA_KIND_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5 MB
  video: 25 * 1024 * 1024, // 25 MB
  gif: 10 * 1024 * 1024, // 10 MB
  lottie: 200 * 1024, // 200 KB
  glb: 15 * 1024 * 1024, // 15 MB
} as const;

export type MediaKind = keyof typeof MEDIA_KIND_SIZE_LIMITS;
