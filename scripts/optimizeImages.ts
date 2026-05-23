/**
 * Resizes & re-encodes all images in public/assets/ to webp + thumbnail blur.
 * Also emits WebP versions of large root-level public images used directly by UI.
 *   - Full: 1200px webp @ q78  → public/optimized/<name>.webp
 *   - LQIP: 20px webp @ q40 → emitted as base64 in manifest.json
 * Used as the upload source for re-seeding Convex.
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const SRC = path.join(process.cwd(), "public", "assets");
const OUT = path.join(process.cwd(), "public", "optimized");
const MANIFEST = path.join(process.cwd(), "public", "optimized", "manifest.json");
const ROOT_ASSETS = [
  { input: "banner-schweppes.png", output: "banner-schweppes.webp", quality: 82 },
  { input: "banner-third-rush.jpg", output: "banner-third-rush.webp", quality: 82 },
  { input: "third-intelligence-icon.png", output: "third-intelligence-icon.webp", quality: 78 },
];

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const files = fs.readdirSync(SRC).filter((f) => /\.(jpe?g|png)$/i.test(f));
console.log(`Optimizing ${files.length} images...`);

const manifest: Record<string, { webp: string; lqip: string; width: number; height: number }> = {};

async function run() {
  for (const file of files) {
    const inPath = path.join(SRC, file);
    const baseName = file.replace(/\.(jpe?g|png)$/i, "");
    const outName = `${baseName}.webp`;
    const outPath = path.join(OUT, outName);

    const meta = await sharp(inPath).metadata();

    // Full-size webp
    await sharp(inPath)
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(outPath);

    // Tiny LQIP (base64 inline)
    const lqipBuf = await sharp(inPath)
      .resize({ width: 24 })
      .webp({ quality: 35 })
      .toBuffer();
    const lqip = `data:image/webp;base64,${lqipBuf.toString("base64")}`;

    const stat = fs.statSync(outPath);
    manifest[file] = {
      webp: outName,
      lqip,
      width: meta.width ?? 1200,
      height: meta.height ?? 1200,
    };
    console.log(`  ${file} → ${outName} (${(stat.size / 1024).toFixed(0)}KB)`);
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`\nWrote manifest: ${MANIFEST}`);

  console.log("\nOptimizing root public images...");
  for (const asset of ROOT_ASSETS) {
    const inPath = path.join(process.cwd(), "public", asset.input);
    const outPath = path.join(process.cwd(), "public", asset.output);
    if (!fs.existsSync(inPath)) continue;

    await sharp(inPath)
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: asset.quality, effort: 6 })
      .toFile(outPath);

    const stat = fs.statSync(outPath);
    console.log(`  ${asset.input} → ${asset.output} (${(stat.size / 1024).toFixed(0)}KB)`);
  }

  console.log(`Done. ${files.length} images optimized.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
