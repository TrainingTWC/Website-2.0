import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import path from "path";
import { api } from "../convex/_generated/api.js";

// Use CONVEX_URL env var to target a specific deployment (e.g. prod).
// Falls back to VITE_CONVEX_URL from .env.local for dev.
const convexUrl = process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL;
if (!convexUrl) {
  console.error("Missing CONVEX_URL or VITE_CONVEX_URL in environment.");
  process.exit(1);
}
console.log(`Targeting: ${convexUrl}`);
const client = new ConvexHttpClient(convexUrl);

// ── Image serving ────────────────────────────────────────────────────────────
// Images are served from GitHub Pages CDN (Fastly) — not Convex file storage.
// This keeps Convex File Bandwidth at zero regardless of traffic volume.
// Update this if the GitHub Pages URL changes.
const GITHUB_PAGES_BASE = "https://trainingtwc.github.io/brewmatch-ai";

// Optimized WebP manifest for LQIP blur hashes
const IMAGE_DIR = path.join(process.cwd(), "public", "optimized");
const MANIFEST_PATH = path.join(IMAGE_DIR, "manifest.json");
const manifest: Record<string, { webp: string; lqip: string; width: number; height: number }> = fs.existsSync(MANIFEST_PATH)
  ? JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"))
  : {};

// Define the products and their corresponding image file names
const productsToSeed = [
  // ════ COFFEE BEANS ════
  {
    name: "El Diablo Blend",
    description: "A devilishly good blend. Rich, dark, and intense with notes of dark chocolate and roasted nuts. Perfect for an espresso or a strong milk-based coffee.",
    type: "beans", category: "blend", price: 650,
    tags: ["dark-roast", "blend", "espresso"], roastLevel: "dark", origin: "Chikmagalur, India", weight: "250g",
    flavorNotes: ["Dark Chocolate", "Roasted Nuts"], stockStatus: "in-stock", rating: 4.8, reviewCount: 312,
    imageFile: "EDB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-01.jpg"
  },
  {
    name: "French Roast",
    description: "Our darkest roast. Smoky, bold, and unapologetic. Intense body with a lingering dark cocoa finish.",
    type: "beans", category: "blend", price: 600,
    tags: ["dark-roast", "bold", "smoky"], roastLevel: "dark", origin: "India", weight: "250g",
    flavorNotes: ["Smoky", "Dark Cocoa"], stockStatus: "in-stock", rating: 4.6, reviewCount: 245,
    imageFile: "FR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-05.jpg"
  },
  {
    name: "Monsoon Malabar",
    description: "A globally renowned Indian specialty. Exposed to the monsoon winds of the Malabar coast, these beans develop a uniquely earthy, malty flavor with virtually no acidity.",
    type: "beans", category: "single-origin", price: 750,
    tags: ["medium-roast", "earthy", "malty", "single-origin"], roastLevel: "medium", origin: "Malabar Coast, India", weight: "250g",
    flavorNotes: ["Earthy", "Malty", "Balanced"], stockStatus: "in-stock", rating: 4.9, reviewCount: 521,
    imageFile: "MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-09.jpg"
  },
  {
    name: "Signature Cold Brew Blend",
    description: "Specially crafted for cold brewing. Steep overnight for a naturally sweet, low-acid, and incredibly smooth cold brew.",
    type: "beans", category: "blend", price: 650,
    tags: ["medium-roast", "smooth", "refreshing"], roastLevel: "medium", origin: "India", weight: "250g",
    flavorNotes: ["Chocolate", "Smooth"], stockStatus: "in-stock", rating: 4.8, reviewCount: 334,
    imageFile: "SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-13.jpg"
  },
  {
    name: "Speciality Single Origin Bababudangiri",
    description: "Speciality Single Origin from the historic Bababudangiri hills. A bright, fruity cup with notes of tropical fruits and a clean finish.",
    type: "beans", category: "single-origin", price: 850,
    tags: ["light-roast", "fruity", "single-origin"], roastLevel: "light", origin: "Bababudangiri, India", weight: "250g",
    flavorNotes: ["Tropical Fruits"], stockStatus: "in-stock", rating: 4.7, reviewCount: 189,
    imageFile: "SSBR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-21.jpg"
  },
  {
    name: "Speciality Single Origin Coorg",
    description: "A robust and spicy single origin from the hills of Coorg. Full-bodied with hints of black pepper and dark chocolate.",
    type: "beans", category: "single-origin", price: 800,
    tags: ["medium-dark-roast", "spicy", "single-origin"], roastLevel: "medium-dark", origin: "Coorg, India", weight: "250g",
    flavorNotes: ["Black Pepper", "Dark Chocolate"], stockStatus: "in-stock", rating: 4.6, reviewCount: 211,
    imageFile: "SSCR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-25.jpg"
  },
  {
    name: "Signature South Indian Filter Blend",
    description: "The classic Madras filter coffee experience. A perfect ratio of coffee to chicory for a thick, sweet, and strong cup. Best enjoyed with hot milk and sugar.",
    type: "beans", category: "blend", price: 450,
    tags: ["dark-roast", "filter-coffee", "chicory"], roastLevel: "dark", origin: "South India", weight: "250g",
    flavorNotes: ["Burnt Caramel", "Roasted Almonds"], stockStatus: "in-stock", rating: 4.9, reviewCount: 843,
    imageFile: "SSIFB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-17.jpg"
  },
  {
    name: "Speciality Single Origin Ratnagiri",
    description: "An exquisite single origin from Ratnagiri estate. Known for its wine-like acidity and complex berry notes.",
    type: "beans", category: "single-origin", price: 900,
    tags: ["light-roast", "berry", "complex"], roastLevel: "light", origin: "Ratnagiri Estate, India", weight: "250g",
    flavorNotes: ["Wine", "Mixed Berries"], stockStatus: "in-stock", rating: 4.9, reviewCount: 154,
    imageFile: "SSRR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-33.jpg"
  },
  {
    name: "Vienna Roast",
    description: "A luscious, rich roast with a beautiful balance of bitter and sweet. Notes of milk chocolate and caramel with a creamy mouthfeel.",
    type: "beans", category: "blend", price: 650,
    tags: ["medium-dark-roast", "chocolate", "smooth"], roastLevel: "medium-dark", origin: "India", weight: "250g",
    flavorNotes: ["Milk Chocolate", "Caramel"], stockStatus: "in-stock", rating: 4.8, reviewCount: 412,
    imageFile: "VR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-29.jpg"
  },

  // ════ COLD BREW ════
  {
    name: "Cold Brew Bags - Medium Dark",
    description: "Drop a bag in a jar of cold water, refrigerate for 12–18 hours, and wake up to smooth, low-acid cold brew concentrate.",
    type: "bags", category: "cold-brew", price: 500,
    tags: ["cold-brew", "medium-dark", "low-acid"], roastLevel: "medium-dark", origin: "India", weight: "5 bags",
    flavorNotes: ["Dark Chocolate", "Smooth"], stockStatus: "in-stock", rating: 4.8, reviewCount: 334,
    imageFile: "WEBSITE COLD BREW IMAGES MDR 2026 2048x2048-01.jpg"
  },
  {
    name: "Cold Brew Bags - Medium Roast",
    description: "A brighter, fruitier cold brew experience. Steep overnight for a naturally sweet, low-acid cold brew.",
    type: "bags", category: "cold-brew", price: 500,
    tags: ["cold-brew", "medium-roast", "low-acid"], roastLevel: "medium", origin: "India", weight: "5 bags",
    flavorNotes: ["Caramel", "Smooth"], stockStatus: "in-stock", rating: 4.7, reviewCount: 215,
    imageFile: "WEBSITE COLD BREW IMAGES MR 2026 2048x2048-03.jpg"
  },

  // ════ EASY COFFEE BAGS (ECB) ════
  {
    name: "Easy Coffee Bags - Assorted",
    description: "Can't decide? Try our assorted pack of easy coffee bags. Just add hot water for a perfect cup anywhere, anytime.",
    type: "bags", category: "drip-bag", price: 400,
    tags: ["drip-bag", "assorted", "convenient"], roastLevel: "medium", origin: "India", weight: "10 bags",
    flavorNotes: ["Assorted"], stockStatus: "in-stock", rating: 4.7, reviewCount: 512,
    imageFile: "WEBSITE ECB ASSORT IMAGES 2026 2048x2048-05.jpg"
  },
  {
    name: "Easy Coffee Bags - Monsoon Malabar",
    description: "The earthy, malty goodness of our Monsoon Malabar, now in a convenient drip bag.",
    type: "bags", category: "drip-bag", price: 450,
    tags: ["drip-bag", "earthy", "convenient"], roastLevel: "medium", origin: "India", weight: "10 bags",
    flavorNotes: ["Earthy", "Malty"], stockStatus: "in-stock", rating: 4.9, reviewCount: 289,
    imageFile: "WEBSITE ECB MM IMAGES 2026 2048x2048-07.jpg"
  },
  {
    name: "Easy Coffee Bags - Single Origin",
    description: "Enjoy our premium single origin coffee in a convenient, ready-to-brew drip bag format.",
    type: "bags", category: "drip-bag", price: 450,
    tags: ["drip-bag", "single-origin", "convenient"], roastLevel: "light", origin: "India", weight: "10 bags",
    flavorNotes: ["Fruity", "Bright"], stockStatus: "in-stock", rating: 4.8, reviewCount: 176,
    imageFile: "WEBSITE ECB SO IMAGES 2026 2048x2048-09.jpg"
  },
  {
    name: "Easy Coffee Bags - Vienna Roast",
    description: "The rich, balanced notes of our Vienna Roast, packed perfectly for a drip bag brew.",
    type: "bags", category: "drip-bag", price: 450,
    tags: ["drip-bag", "chocolate", "convenient"], roastLevel: "medium-dark", origin: "India", weight: "10 bags",
    flavorNotes: ["Milk Chocolate", "Caramel"], stockStatus: "in-stock", rating: 4.8, reviewCount: 243,
    imageFile: "WEBSITE ECB VR IMAGES 2026 2048x2048-11.jpg"
  },

  // ════ MERCH ════
  {
    name: "Third Wave Ceramic Pour-Over Mug",
    description: "Handcrafted 350ml ceramic mug with a matte finish and embossed Third Wave Coffee logo. Double-fired for chip resistance.",
    type: "merch", category: "mug", price: 899,
    tags: ["mug", "ceramic", "handcrafted", "gift", "merch"], flavorNotes: [], stockStatus: "in-stock", rating: 4.8, reviewCount: 567,
    imageFile: "merch-green-mug.jpg",
    imageUrl: null
  },
  {
    name: "TWC Collector Tiger Mug",
    description: "Limited edition ceramic mug featuring hand-painted botanical art with the signature Third Wave Coffee tiger motif. Comes in a branded gift box.",
    type: "merch", category: "mug", price: 1299,
    tags: ["mug", "ceramic", "collector", "limited-edition", "gift", "merch"], flavorNotes: [], stockStatus: "in-stock", rating: 4.9, reviewCount: 1243,
    imageFile: "merch-white-mug.jpg",
    imageUrl: null
  },
  {
    name: "Third Wave Enamel Keychain",
    description: "Hard enamel keychain with the Third Wave Coffee logo in antique brass. Durable zinc alloy body with a lobster clasp attachment.",
    type: "merch", category: "keychain", price: 349,
    tags: ["keychain", "enamel", "gift", "accessory", "merch"], flavorNotes: [], stockStatus: "in-stock", rating: 4.5, reviewCount: 876,
    imageFile: "merch-green-mug.jpg",
    imageUrl: null
  },

  // ════ NEW MERCH (2025 Collection) ════
  {
    name: "Black Art Tote Bag",
    description: "Sturdy black canvas tote bag featuring a gold foil 'The Pattern of Coffee and People' art print. Third Wave Coffee branding. Spacious and reusable.",
    type: "merch", category: "tote", price: 799,
    tags: ["tote", "bag", "canvas", "art", "gift", "merch"], flavorNotes: [], stockStatus: "in-stock", rating: 4.7, reviewCount: 0,
    imageFile: null,
    imageUrl: "https://trainingtwc.github.io/brewmatch-ai/optimized/black-tote-bag.webp"
  },
  {
    name: "White Skater Tote Bag",
    description: "Natural cream canvas tote with a playful skater dog illustration holding a coffee cup. Third Wave Coffee branding. Lightweight and everyday-ready.",
    type: "merch", category: "tote", price: 799,
    tags: ["tote", "bag", "canvas", "illustrated", "gift", "merch"], flavorNotes: [], stockStatus: "in-stock", rating: 4.7, reviewCount: 0,
    imageFile: null,
    imageUrl: "https://trainingtwc.github.io/brewmatch-ai/optimized/white-tote-bag.webp"
  },
  {
    name: "Cat in a Cup Lapel Pin",
    description: "Charming wooden lapel pin of a black cat sitting in a striped coffee cup. Third Wave Coffee branded backing card. Perfect for bags, jackets, and gift sets.",
    type: "merch", category: "pin", price: 449,
    tags: ["lapel-pin", "wooden", "cat", "accessory", "gift", "merch"], flavorNotes: [], stockStatus: "in-stock", rating: 4.8, reviewCount: 0,
    imageFile: null,
    imageUrl: "https://trainingtwc.github.io/brewmatch-ai/optimized/cat-in-cup-lapel-pin.webp"
  },
  {
    name: "Cat Lapel Pin",
    description: "Brushed metal lapel pin featuring a contented sleeping cat cradling a Third Wave Coffee cup. Elegant antique finish with a secure butterfly clutch.",
    type: "merch", category: "pin", price: 449,
    tags: ["lapel-pin", "metal", "cat", "accessory", "gift", "merch"], flavorNotes: [], stockStatus: "in-stock", rating: 4.8, reviewCount: 0,
    imageFile: null,
    imageUrl: "https://trainingtwc.github.io/brewmatch-ai/optimized/cat-lapel-pin.webp"
  },
  {
    name: "Coffee Strainer",
    description: "Fine-mesh stainless steel coffee strainer with Third Wave Coffee branding. Fits most cups and mugs — perfect for filter coffee and loose-leaf brewing.",
    type: "merch", category: "accessories", price: 699,
    tags: ["strainer", "steel", "brewing", "kitchen", "merch"], flavorNotes: [], stockStatus: "in-stock", rating: 4.6, reviewCount: 0,
    imageFile: null,
    imageUrl: "https://trainingtwc.github.io/brewmatch-ai/optimized/coffee-strainer.webp"
  },
  {
    name: "Brass Dabara Set",
    description: "Traditional South Indian filter coffee experience in a premium gold brass finish. Includes a dabara tumbler, saucer, and branded storage canister. An heirloom-quality set.",
    type: "merch", category: "accessories", price: 1499,
    tags: ["dabara", "brass", "filter-coffee", "traditional", "gift", "merch"], flavorNotes: [], stockStatus: "in-stock", rating: 4.9, reviewCount: 0,
    imageFile: null,
    imageUrl: "https://trainingtwc.github.io/brewmatch-ai/optimized/dabra-set.webp"
  },
  {
    name: "Keychain & Magnetic Bookmarks Set",
    description: "Gift set featuring a wooden 'You Can Brew This' Third Wave Coffee keychain and two coffee-themed magnetic bookmarks. Perfect for coffee lovers who love to read.",
    type: "merch", category: "keychain", price: 549,
    tags: ["keychain", "wooden", "bookmark", "gift-set", "merch"], flavorNotes: [], stockStatus: "in-stock", rating: 4.7, reviewCount: 0,
    imageFile: null,
    imageUrl: "https://trainingtwc.github.io/brewmatch-ai/optimized/keychain-magnetic-bookmarks.webp"
  },
  {
    name: "NFC Smart Keychain",
    description: "Laser-engraved wooden keychain shaped like a bottle, featuring a serene forest and Third Wave Coffee scene. Built-in NFC chip — tap to share your contact info instantly.",
    type: "merch", category: "keychain", price: 599,
    tags: ["keychain", "nfc", "wooden", "smart", "tech", "merch"], flavorNotes: [], stockStatus: "in-stock", rating: 4.6, reviewCount: 0,
    imageFile: null,
    imageUrl: "https://trainingtwc.github.io/brewmatch-ai/optimized/nfc-keychain.webp"
  },
  {
    name: "Iridescent Sipper Cup",
    description: "Eye-catching iridescent purple sipper cup with diamond-textured exterior. Comes with a reusable straw and a Third Wave Coffee holographic logo badge. 700ml capacity.",
    type: "merch", category: "drinkware", price: 999,
    tags: ["sipper", "cup", "purple", "iridescent", "drinkware", "merch"], flavorNotes: [], stockStatus: "in-stock", rating: 4.7, reviewCount: 0,
    imageFile: null,
    imageUrl: "https://trainingtwc.github.io/brewmatch-ai/optimized/sipper.webp"
  },
  {
    name: "Gradient Stainless Steel Tumbler",
    description: "Double-walled insulated tumbler with a stunning pink-to-teal gradient and faceted geometric design. Third Wave Coffee laser-engraved logo. Includes a metal straw. 500ml capacity.",
    type: "merch", category: "drinkware", price: 1299,
    tags: ["tumbler", "steel", "insulated", "gradient", "drinkware", "gift", "merch"], flavorNotes: [], stockStatus: "in-stock", rating: 4.8, reviewCount: 0,
    imageFile: null,
    imageUrl: "https://trainingtwc.github.io/brewmatch-ai/optimized/tumbler.webp"
  }
];

async function run() {
  console.log("Starting seed script...");
  const formattedProducts = [];

  for (const product of productsToSeed) {
    let imageUrl = product.imageUrl || "";
    let imageBlur: string | undefined = undefined;

    if (product.imageFile) {
      const entry = manifest[product.imageFile];
      const webpName = entry?.webp ?? product.imageFile.replace(/\.(jpe?g|png)$/i, ".webp");
      if (entry) imageBlur = entry.lqip;

      // Serve from GitHub Pages CDN — no Convex upload needed
      imageUrl = `${GITHUB_PAGES_BASE}/optimized/${encodeURIComponent(webpName)}`;
      console.log(`  → ${product.imageFile.split(" ")[0]} mapped to GitHub Pages CDN`);
    }

    const { imageFile, ...rest } = product;
    formattedProducts.push({
      ...rest,
      imageUrl,
      imageBlur,
    });
  }

  console.log("\nSeeding to Convex database...");
  const result = await client.mutation(api.seed.seedFromScript, { products: formattedProducts as any });
  console.log("Seed complete!", result);
  console.log("\nImages are now served from GitHub Pages CDN. Convex File Bandwidth = 0.");
}

run().catch(console.error);
