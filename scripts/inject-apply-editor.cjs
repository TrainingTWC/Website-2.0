"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const cmsPath = path.join(ROOT, "src/components/admin/AboutCMS.tsx");
const lines = fs.readFileSync(cmsPath, "utf8").split(/\r?\n/);

// Find the line with <HeroEditor inside CareersEditors (it's the first occurrence)
const heroIdx = lines.findIndex(
  (l) => l.includes('<HeroEditor storageKey="about.careers.hero"')
);
if (heroIdx === -1) {
  console.error("❌  Could not find HeroEditor line in CareersEditors");
  process.exit(1);
}

// Insert <ApplyLinkEditor onSave={onSave} /> AFTER HeroEditor
const indent = "      ";
lines.splice(heroIdx + 1, 0, `${indent}<ApplyLinkEditor onSave={onSave} />`);

fs.writeFileSync(cmsPath, lines.join("\n"), "utf8");
console.log(`✅  Inserted <ApplyLinkEditor> at line ${heroIdx + 2} in AboutCMS.tsx`);
