"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

// Fix useAboutContent.ts — insert hook using line-based approach
const hooksPath = path.join(ROOT, "src/lib/useAboutContent.ts");
const lines = fs.readFileSync(hooksPath, "utf8").split(/\r?\n/);

// Find "// Newsroom" comment that immediately follows useCareerStats
const newsroomIdx = lines.findIndex((l) => l.trim() === "// Newsroom");
if (newsroomIdx === -1) {
  console.error("❌  Could not find '// Newsroom' marker");
  process.exit(1);
}

// Inject hook + blank line before the Newsroom block
const newLines = [
  "export function useApplyLink(): string {",
  '  return useContentValue<string>("about.careers.applyLink", "mailto:careers@brewmatch.in");',
  "}",
  "",
];
lines.splice(newsroomIdx, 0, ...newLines);
fs.writeFileSync(hooksPath, lines.join("\n"), "utf8");
console.log("✅  useAboutContent.ts — useApplyLink injected at line", newsroomIdx);
