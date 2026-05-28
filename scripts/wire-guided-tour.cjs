/**
 * Wire GuidedTour into HomeContent:
 * 1. Add import after SiteFooter import
 * 2. Render <GuidedTour> before closing </div> of the main container
 */
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../src/components/HomeContent.tsx");
let src = fs.readFileSync(file, "utf8");

// 1. Import
const IMPORT_ANCHOR = `import { SiteFooter } from "./SiteFooter";`;
const IMPORT_LINE   = `import { GuidedTour } from "./GuidedTour";`;

if (!src.includes(IMPORT_LINE)) {
  src = src.replace(IMPORT_ANCHOR, `${IMPORT_ANCHOR}\n${IMPORT_LINE}`);
  console.log("Import added.");
} else {
  console.log("Import already present.");
}

// 2. Render — insert GuidedTour just before the closing </div> of SmoothScroll wrapper
// That closing tag looks like:   </SmoothScroll>
const SMOOTH_CLOSE = `    </SmoothScroll>`;
const GUIDED_TOUR  = `        <GuidedTour onOpenTI={openTI} />\n`;

if (!src.includes("<GuidedTour")) {
  src = src.replace(SMOOTH_CLOSE, `${GUIDED_TOUR}${SMOOTH_CLOSE}`);
  console.log("GuidedTour rendered.");
} else {
  console.log("GuidedTour already rendered.");
}

fs.writeFileSync(file, src, "utf8");
console.log("Done.");
