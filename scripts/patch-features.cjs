/**
 * One-shot patch: scroll indicator in Cinematic.tsx,
 * filter home from mobile nav in HomeContent.tsx.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

// ── 1. Cinematic.tsx — scroll indicator ──────────────────────
const cinematicPath = path.join(root, "src/components/Cinematic.tsx");
let cinematic = fs.readFileSync(cinematicPath, "utf8");

const SLIDESHOW_BLOCK = `      {/* Slideshow`;
const TAGLINE_BLOCK = `      {/* Hero tagline`;

const SCROLL_INDICATOR = `
      {/* Scroll indicator — fades out as user starts scrolling */}
      <motion.div
        style={{ opacity: titleOpacity }}
        className="relative z-10 flex flex-col items-center gap-1 py-5 pointer-events-none select-none"
        aria-hidden
      >
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-1.5"
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.45em] text-natural-text/30">
            Scroll to explore
          </span>
          <span className="w-px h-6 block"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(120,80,40,0.25), transparent)" }}
          />
          <ArrowDown className="w-3.5 h-3.5 text-natural-text/25" />
        </motion.div>
      </motion.div>

`;

if (cinematic.includes("Scroll to explore")) {
  console.log("Cinematic.tsx: scroll indicator already present, skipping.");
} else {
  // Insert between the slideshow block and the tagline block
  cinematic = cinematic.replace(
    `      ${TAGLINE_BLOCK.trimStart()}`,
    SCROLL_INDICATOR + `      ${TAGLINE_BLOCK.trimStart()}`
  );
  fs.writeFileSync(cinematicPath, cinematic, "utf8");
  console.log("Cinematic.tsx: scroll indicator added.");
}

// ── 2. HomeContent.tsx — filter "home" from mobile bottom nav ──
const homePath = path.join(root, "src/components/HomeContent.tsx");
let home = fs.readFileSync(homePath, "utf8");

const OLD_MAP = `          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavTo(item.target)}
              aria-label={item.label}`;

const NEW_MAP = `          {NAV_ITEMS.filter((item) => item.key !== "home").map((item) => (
            <button
              key={item.key}
              onClick={() => onNavTo(item.target)}
              aria-label={item.label}`;

if (home.includes('filter((item) => item.key !== "home")')) {
  console.log("HomeContent.tsx: home filter already present, skipping.");
} else if (home.includes(OLD_MAP)) {
  home = home.replace(OLD_MAP, NEW_MAP);
  fs.writeFileSync(homePath, home, "utf8");
  console.log("HomeContent.tsx: home filtered from mobile bottom nav.");
} else {
  console.warn("HomeContent.tsx: could not find mobile nav map pattern — manual edit required.");
}

console.log("Done.");
