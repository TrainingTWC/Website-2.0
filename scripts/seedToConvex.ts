import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import path from "path";
import { api } from "../convex/_generated/api.js";

const convexUrl = process.env.VITE_CONVEX_URL;
if (!convexUrl) {
  console.error("Missing VITE_CONVEX_URL in environment.");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

// Images are served from public/assets/ - use that folder for uploads
const IMAGE_DIR = path.join(process.cwd(), "public", "assets");

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
  }
];

async function uploadFile(filePath: string) {
  // Generate upload URL from Convex
  const uploadUrl = await client.mutation(api.seed.generateUploadUrl);

  // Read file as buffer
  const fileBuffer = fs.readFileSync(filePath);
  const mimeType = "image/jpeg";

  // Upload to Convex
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": mimeType },
    body: fileBuffer,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`);
  }

  const { storageId } = await response.json();
  return storageId;
}

async function run() {
  console.log("Starting seed script...");
  const formattedProducts = [];

  for (const product of productsToSeed) {
    let storageId = undefined;
    let imageUrl = product.imageUrl || "";

    if (product.imageFile) {
      const filePath = path.join(IMAGE_DIR, product.imageFile);
      if (fs.existsSync(filePath)) {
        console.log(`Uploading ${product.imageFile}...`);
        try {
          storageId = await uploadFile(filePath);
          console.log(`  → storageId: ${storageId}`);
        } catch (err) {
          console.error(`  Error uploading ${product.imageFile}:`, err);
          // Fallback to encoded local path
          imageUrl = `/assets/${encodeURIComponent(product.imageFile)}`;
        }
      } else {
        console.warn(`File not found: ${filePath}`);
        imageUrl = `/assets/${encodeURIComponent(product.imageFile)}`;
      }
    }

    const { imageFile, ...rest } = product;
    formattedProducts.push({
      ...rest,
      storageId,
      imageUrl,
    });
  }

  console.log("Seeding to Convex database...");
  const result = await client.mutation(api.seed.seedFromScript, { products: formattedProducts as any });
  console.log("Seed complete!", result);
}

run().catch(console.error);
