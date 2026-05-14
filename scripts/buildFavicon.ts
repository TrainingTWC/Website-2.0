/**
 * Build a favicon with a white circle background from public/logo.png.
 * Output: public/favicon.png (256x256).
 *
 *   npx tsx scripts/buildFavicon.ts
 */
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "public", "logo.png");
const OUT = path.join(ROOT, "public", "favicon.png");

const SIZE = 256;
const PADDING = 24; // px on each side inside the circle

async function main() {
  // White circle SVG background
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
      <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="#ffffff" />
    </svg>`
  );

  // Resize logo to fit inside circle (with padding), preserving aspect.
  const inner = SIZE - PADDING * 2;
  const logo = await sharp(SRC)
    .resize({ width: inner, height: inner, fit: "inside" })
    .toBuffer();

  await sharp(bg)
    .composite([{ input: logo, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(OUT);

  console.log(`Built favicon → ${OUT} (${SIZE}x${SIZE}, white circle bg)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
