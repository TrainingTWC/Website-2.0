/**
 * Strip the near-black background from the Third Intelligence icon.
 * Pixels darker than `threshold` (luminance) become fully transparent;
 * remaining pixels are kept and slightly feathered at the edge.
 *
 *   npm run icon:strip
 */
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "public", "third-intelligence-icon.png");
const OUT = path.join(ROOT, "public", "third-intelligence-icon.png");

const THRESHOLD = 38; // luminance cutoff (0-255) — anything darker → transparent

async function main() {
  const input = sharp(SRC).ensureAlpha();
  const { data, info } = await input.raw().toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const out = Buffer.from(data); // copy

  let cleared = 0;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // ITU-R BT.601 luma
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < THRESHOLD) {
      out[i + 3] = 0; // fully transparent
      cleared++;
    } else if (lum < THRESHOLD + 30) {
      // soft feather: scale alpha by how far above threshold we are
      const t = (lum - THRESHOLD) / 30;
      out[i + 3] = Math.round(255 * t);
    }
  }

  await sharp(out, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toFile(OUT + ".tmp.png");

  // Atomic-ish replace
  const fs = await import("node:fs/promises");
  await fs.rename(OUT + ".tmp.png", OUT);

  console.log(
    `Done. Cleared ${cleared.toLocaleString()} px of ${(width * height).toLocaleString()} (${(
      (cleared / (width * height)) *
      100
    ).toFixed(1)}%) → ${OUT}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
