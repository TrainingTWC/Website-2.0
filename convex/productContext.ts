/**
 * productContext.ts
 *
 * Single source of truth for:
 *   1. Third Wave Coffee brand context + Third Intelligence voice directive
 *   2. Personality profiles for every product in the catalog
 *
 * Used by recommendations.ts to build the AI prompt.
 * Keep personality names in exact sync with product names in seedToConvex.ts.
 */

// ─────────────────────────────────────────────
// BRAND CONTEXT
// ─────────────────────────────────────────────

export const BRAND_CONTEXT = `
ABOUT THIRD WAVE COFFEE (TWC)
Third Wave Coffee is an Indian specialty coffee brand built on one conviction: coffee is worth paying
attention to. Every product in the catalog is sourced from specific Indian estates, roasted with intent,
and designed to reward the people who notice the difference. TWC is not about convenience for its own sake —
it is about bringing exceptional coffee to more people, on their terms.

SPECIALTY COFFEE PHILOSOPHY
Specialty coffee means traceability and craft at every step — from the altitude and soil of the estate
to the roast profile to the brew method. Flavor notes are not marketing copy; they are the honest result
of these decisions. A light roast from Bababudangiri tastes of tropical fruit because of where it grew
and how it was processed, not because of anything added.

THIRD INTELLIGENCE VOICE
Third Intelligence is TWC's recommendation system. When it speaks, it speaks as a knowledgeable barista —
not an enthusiastic salesperson, not a search algorithm. The voice is:
  - Crisp: no filler, no hedging, no "great choice" type affirmations
  - Confident: state the match and own it; explain why with specifics
  - Precise: name the flavor, the method, the reason — vague praise is not permitted
  - Human: brief warmth is fine; effusiveness is not
  - Contextual: reference the customer's answers implicitly, not literally ("You said you like bold...")

WHAT THIRD INTELLIGENCE DOES NOT SAY
  ✗ "This is a great choice for you!"
  ✗ "You'll love this coffee."
  ✗ "Based on your preferences..."
  ✗ "I think you might enjoy..."
  ✗ Any filler sentence that adds no information
`;

// ─────────────────────────────────────────────
// PRODUCT PERSONALITIES
// ─────────────────────────────────────────────
//
// Each entry:
//   archetype     — the product's one-word character type
//   tagline       — one punchy sentence capturing its essence
//   voice         — how the AI talks about this product (3–5 descriptors)
//   idealCustomer — one sentence: who is this for
//   mood          — when/where/atmosphere for this product
//   brewingRitual — recommended brew method and why it unlocks the product
//   crossSellAffinity — product names that pair naturally with this one
//
// ─────────────────────────────────────────────

export interface ProductPersonality {
  archetype: string;
  tagline: string;
  voice: string[];
  idealCustomer: string;
  mood: string;
  brewingRitual: string;
  crossSellAffinity: string[];
}

export const PRODUCT_PERSONALITIES: Record<string, ProductPersonality> = {

  // ══════════════════════════════════════════
  // COFFEE BEANS
  // ══════════════════════════════════════════

  "El Diablo Blend": {
    archetype: "The Rebel",
    tagline: "Uncompromising. Dark, fierce, and precisely calibrated for those who want their coffee to mean something.",
    voice: ["intense", "direct", "unapologetic", "punchy"],
    idealCustomer: "Someone who starts the day at full throttle — espresso drinkers, early risers who treat coffee as fuel rather than comfort.",
    mood: "Pre-dawn. A dark kitchen, no music, no distraction. The cup that gets you from zero to ready.",
    brewingRitual: "Best as espresso or moka pot — pressure extracts the full dark-chocolate depth without tipping into bitterness. Milk drinks welcome; the blend holds its character through a flat white.",
    crossSellAffinity: ["TWC Collector Tiger Mug", "Third Wave Ceramic Pour-Over Mug"],
  },

  "French Roast": {
    archetype: "The Purist",
    tagline: "The darkest note on the scale. No apologies, no subtlety — just deep, smoky power.",
    voice: ["bold", "unadorned", "definitive", "smoky"],
    idealCustomer: "The person who finds most coffees too mild — they want roast character above all else, and they drink it black.",
    mood: "Late evening or early morning. A wooden table, a thick mug, nothing else required.",
    brewingRitual: "French press amplifies the full body and lets natural oils survive. Avoid paper filters — they strip the smokiness that defines this roast.",
    crossSellAffinity: ["Third Wave Enamel Keychain", "TWC Collector Tiger Mug"],
  },

  "Monsoon Malabar": {
    archetype: "The Sage",
    tagline: "A century of technique in a single cup — earthy, ancient, and impossible to rush.",
    voice: ["wise", "grounded", "unhurried", "storied"],
    idealCustomer: "The connoisseur who wants something with a story and a sense of place — curious about process, uninterested in trend.",
    mood: "A slow afternoon, monsoon weather outside, a pour-over brewing while you read something worth reading.",
    brewingRitual: "Pour-over or Chemex to let the earthy-malty complexity develop without interference. Water at 92–94°C — any hotter and the maltiness turns harsh.",
    crossSellAffinity: ["Easy Coffee Bags - Monsoon Malabar", "Third Wave Ceramic Pour-Over Mug"],
  },

  "Signature Cold Brew Blend": {
    archetype: "The Strategist",
    tagline: "Engineered for cold. What takes 12 hours to make takes seconds to understand — smooth, chocolate-forward, with no acid to fight.",
    voice: ["precise", "reliable", "clean", "modern"],
    idealCustomer: "The planner who preps cold brew on Sunday nights so the week starts right — values consistency and rewards process.",
    mood: "A glass jar in the fridge waiting for you. Ice over a tall glass, morning light, zero friction.",
    brewingRitual: "Cold steep only — 12 to 18 hours in filtered water in the fridge. No heat. The blend is calibrated to this method; brewing it hot loses the smoothness entirely.",
    crossSellAffinity: ["Cold Brew Bags - Medium Dark", "Cold Brew Bags - Medium Roast"],
  },

  "Speciality Single Origin Bababudangiri": {
    archetype: "The Explorer",
    tagline: "Grown in history, tasted in the present — tropical, vivid, and unapologetically bright.",
    voice: ["vibrant", "curious", "expressive", "precise"],
    idealCustomer: "The specialty coffee convert who has moved past dark roasts and is discovering what light roast actually means — brightness is a feature, not a flaw.",
    mood: "Mid-morning with good light. A cup that makes the room feel more alive.",
    brewingRitual: "V60 or AeroPress at 88–90°C — high heat destroys the fruit notes. A finer grind and shorter steep time keeps the tropical character intact.",
    crossSellAffinity: ["Easy Coffee Bags - Single Origin", "Third Wave Ceramic Pour-Over Mug"],
  },

  "Speciality Single Origin Coorg": {
    archetype: "The Mountaineer",
    tagline: "Dense highland air, black pepper on the tongue, dark chocolate underneath — a cup with topography.",
    voice: ["robust", "layered", "rooted", "specific"],
    idealCustomer: "The medium-dark drinker who wants origin character without losing body — appreciates complexity that doesn't require a course to understand.",
    mood: "Cool morning, Western Ghats weather. A mug that grounds you before the day starts.",
    brewingRitual: "French press or stovetop moka — both respect the full body. Grind medium-coarse; the spice notes emerge in the finish rather than the front, so give it time.",
    crossSellAffinity: ["Third Wave Ceramic Pour-Over Mug", "TWC Collector Tiger Mug"],
  },

  "Signature South Indian Filter Blend": {
    archetype: "The Traditionalist",
    tagline: "This is not nostalgia. This is the original — the Madras filter coffee that taught India what coffee tastes like.",
    voice: ["authoritative", "warm", "grounded", "familiar"],
    idealCustomer: "Anyone who grew up on filter coffee or wants to understand what all the South Indian reverence is actually about — the most culturally rooted cup in the catalog.",
    mood: "Steel tumbler, dabarah, morning newspaper. The ritual before the day can take anything from you.",
    brewingRitual: "South Indian filter device only. Two tablespoons per cup, slow drip, then dilute with hot milk 1:1. Sugar is your call, but do not skip the filter — this blend was built for it.",
    crossSellAffinity: ["Third Wave Enamel Keychain", "TWC Collector Tiger Mug"],
  },

  "Speciality Single Origin Ratnagiri": {
    archetype: "The Vintner",
    tagline: "Estate-specific, wine-like, and quietly exceptional — the cup for people who want something rare.",
    voice: ["refined", "complex", "unhurried", "precise"],
    idealCustomer: "The coffee enthusiast who reads tasting notes and means it — someone who wants a reference-level light roast from a single named estate.",
    mood: "An afternoon with nothing urgent. A tasting session, not a caffeine grab.",
    brewingRitual: "V60 with precise water temperature (88°C) and a slow, controlled pour. This is not a forgiving brew; it rewards attention with berries and wine-like acidity. Grind fresh, brew immediately.",
    crossSellAffinity: ["Third Wave Ceramic Pour-Over Mug", "Easy Coffee Bags - Single Origin"],
  },

  "Vienna Roast": {
    archetype: "The Diplomat",
    tagline: "Neither extreme. Milk chocolate, caramel, creamy body — the roast that everyone agrees on.",
    voice: ["balanced", "approachable", "smooth", "refined"],
    idealCustomer: "The person who wants something genuinely good without wanting to study for it — an everyday drinker ready to trade up from commodity coffee.",
    mood: "Mid-morning or post-lunch. The cup that fits any desk, any meeting, any day.",
    brewingRitual: "Drip machine, pour-over, or Aeropress — it performs consistently across all methods. Excellent with milk. A strong base for lattes without fighting the espresso machine.",
    crossSellAffinity: ["Easy Coffee Bags - Vienna Roast", "Third Wave Ceramic Pour-Over Mug"],
  },

  // ══════════════════════════════════════════
  // COLD BREW BAGS
  // ══════════════════════════════════════════

  "Cold Brew Bags - Medium Dark": {
    archetype: "The Night Operator",
    tagline: "Set it up the night before. Wake up to something worth it.",
    voice: ["practical", "confident", "smooth", "efficient"],
    idealCustomer: "The cold brew convert who wants consistency without fuss — they know what they want and they want it ready.",
    mood: "Fridge-ready by morning. Ice, glass, go.",
    brewingRitual: "One bag, 500ml cold filtered water, 12–18 hours in the fridge. Remove bag, pour over ice. The medium-dark roast gives dark chocolate notes that hold through dilution.",
    crossSellAffinity: ["Signature Cold Brew Blend", "Cold Brew Bags - Medium Roast"],
  },

  "Cold Brew Bags - Medium Roast": {
    archetype: "The Optimist",
    tagline: "Brighter, fruitier cold brew — the one that makes you look forward to mornings.",
    voice: ["bright", "clean", "refreshing", "light"],
    idealCustomer: "The cold brew drinker who wants fruit character and sweetness without added sugar — usually someone transitioning from iced lattes.",
    mood: "Warm afternoon, afternoon slump, a glass of cold brew instead of another snack.",
    brewingRitual: "Same as Medium Dark — 12 hours cold steep — but the medium roast produces caramel-forward sweetness that needs less time to open up. Try 10 hours for a lighter, brighter result.",
    crossSellAffinity: ["Signature Cold Brew Blend", "Cold Brew Bags - Medium Dark"],
  },

  // ══════════════════════════════════════════
  // EASY COFFEE BAGS (Drip Bags)
  // ══════════════════════════════════════════

  "Easy Coffee Bags - Assorted": {
    archetype: "The Curator",
    tagline: "Can't commit? Don't. The assorted pack is how you find your coffee before you stock it.",
    voice: ["exploratory", "playful", "open", "practical"],
    idealCustomer: "The curious buyer who wants to try the catalog before going deep — often gifted or chosen as a starter pack.",
    mood: "Saturday morning with no agenda. Trying something new.",
    brewingRitual: "Just-boiled water cooled for 30 seconds, poured slowly over the bag. Let it steep 3–4 minutes. Each bag in the assorted pack is a different roast — use the packaging to track which ones land.",
    crossSellAffinity: ["Vienna Roast", "Monsoon Malabar", "El Diablo Blend"],
  },

  "Easy Coffee Bags - Monsoon Malabar": {
    archetype: "The Portable Sage",
    tagline: "The estate experience in your bag — earthy, malty, and effortless wherever you are.",
    voice: ["grounded", "convenient", "authentic", "reliable"],
    idealCustomer: "The Monsoon Malabar fan who travels or works outside — they want the estate character without the pour-over setup.",
    mood: "Office desk, hotel room, or a quiet corner with a travel mug.",
    brewingRitual: "92°C water (not boiling), 4-minute steep. The drip bag concentrates the earthy-malty character cleanly. Longer steep = more intensity, not bitterness.",
    crossSellAffinity: ["Monsoon Malabar", "Third Wave Enamel Keychain"],
  },

  "Easy Coffee Bags - Single Origin": {
    archetype: "The Traveler",
    tagline: "Single origin in a bag — the specialty experience without the ritual tax.",
    voice: ["light", "bright", "accessible", "honest"],
    idealCustomer: "The specialty-curious drinker who wants origin character without brewing gear — a gateway product.",
    mood: "A window, good light, a slow start to the morning.",
    brewingRitual: "88–90°C water only — never boiling — for 3 minutes. The light roast is fragile; too much heat turns fruit notes papery. Quick, careful, rewarding.",
    crossSellAffinity: ["Speciality Single Origin Bababudangiri", "Speciality Single Origin Ratnagiri"],
  },

  "Easy Coffee Bags - Vienna Roast": {
    archetype: "The Dependable",
    tagline: "Wherever you need a good cup, this delivers. No drama. No compromise.",
    voice: ["consistent", "smooth", "approachable", "everyday"],
    idealCustomer: "The office or travel coffee drinker who wants something genuinely good without a setup — often the non-enthusiast who just wants a better cup.",
    mood: "Conference room, airport lounge, any situation where gear is not an option.",
    brewingRitual: "Any hot water — 88–94°C — for 3–4 minutes. The Vienna roast is the most forgiving in the lineup; it produces a clean, caramel-forward cup across a wide range of temperatures.",
    crossSellAffinity: ["Vienna Roast", "Third Wave Enamel Keychain"],
  },

  // ══════════════════════════════════════════
  // MERCH
  // ══════════════════════════════════════════

  "Third Wave Ceramic Pour-Over Mug": {
    archetype: "The Ritualist's Vessel",
    tagline: "Built for the patient brewer — holds heat, holds character, holds up.",
    voice: ["considered", "tactile", "enduring", "minimal"],
    idealCustomer: "The pour-over or filter coffee brewer who wants a mug that matches the intentionality of the ritual — not a promotional item.",
    mood: "Any slow morning. The mug that earns its place on the shelf.",
    brewingRitual: "Best paired with any pour-over or filter coffee — Monsoon Malabar, Ratnagiri, Bababudangiri. The double-fired ceramic retains heat through a slow brew.",
    crossSellAffinity: ["Monsoon Malabar", "Speciality Single Origin Ratnagiri", "Speciality Single Origin Bababudangiri", "Vienna Roast"],
  },

  "TWC Collector Tiger Mug": {
    archetype: "The Statement",
    tagline: "Limited edition, hand-painted, collectible — for the person who treats their coffee corner as a considered space.",
    voice: ["bold", "distinctive", "collector-grade", "expressive"],
    idealCustomer: "The coffee enthusiast or gift-buyer who wants something with presence — this is not a daily driver, it is an object worth owning.",
    mood: "A coffee corner that has been curated. A gift that lands.",
    brewingRitual: "Pair with TWC's most characterful coffees — El Diablo, French Roast, Signature South Indian Filter Blend. The tiger motif belongs with coffees that have personality.",
    crossSellAffinity: ["El Diablo Blend", "French Roast", "Signature South Indian Filter Blend"],
  },

  "Third Wave Enamel Keychain": {
    archetype: "The Signal",
    tagline: "Carry it, gift it, wear your coffee identity in antique brass.",
    voice: ["compact", "expressive", "gift-ready", "identity-marking"],
    idealCustomer: "The TWC regular who wants a piece of the brand outside the café — or anyone buying a gift with a coffee angle.",
    mood: "Pocket, keys, bag. Everyday carry for a coffee-first person.",
    brewingRitual: "No brewing ritual. Pairs with any product as a gifting add-on — especially the drip bags for a travel-coffee gift bundle.",
    crossSellAffinity: ["Easy Coffee Bags - Assorted", "Easy Coffee Bags - Monsoon Malabar", "Easy Coffee Bags - Vienna Roast"],
  },

};

// ─────────────────────────────────────────────
// PROMPT BUILDER HELPERS
// ─────────────────────────────────────────────

/**
 * Builds the personality block for a single product to embed in the AI prompt.
 */
export function buildPersonalitySnippet(
  productName: string,
  personality: ProductPersonality
): string {
  return `
  PRODUCT: ${productName}
  Archetype: ${personality.archetype}
  Tagline: ${personality.tagline}
  Ideal customer: ${personality.idealCustomer}
  Mood: ${personality.mood}
  Brewing ritual: ${personality.brewingRitual}
  Voice cues: ${personality.voice.join(", ")}`.trim();
}

/**
 * Builds the full personality block for all products to embed in the AI prompt.
 * Only includes products that are present in the current catalog.
 */
export function buildPersonalitiesBlock(productNames: string[]): string {
  const lines: string[] = ["PRODUCT PERSONALITIES:"];
  for (const name of productNames) {
    const personality = PRODUCT_PERSONALITIES[name];
    if (personality) {
      lines.push(buildPersonalitySnippet(name, personality));
      lines.push("");
    }
  }
  return lines.join("\n");
}
