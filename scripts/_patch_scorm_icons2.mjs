import { readFileSync, writeFileSync } from "node:fs";
const path = "src/components/about/ScormViewer.tsx";
let src = readFileSync(path, "utf8");

// More flexible: regex
const re = /<div className="shrink-0 w-16 h-16 rounded-2xl border-2 border-about-accent flex items-center justify-center text-3xl" aria-hidden>[\s\S]*?🎓[\s\S]*?<\/div>/;
const replacement = `<div className="shrink-0 w-16 h-16 rounded-2xl border-2 border-about-accent flex items-center justify-center text-about-accent" aria-hidden>
          <GraduationCap className="w-7 h-7" strokeWidth={1.75} />
        </div>`;
if (re.test(src)) {
  src = src.replace(re, replacement);
  writeFileSync(path, src, "utf8");
  console.log("✓ Replaced 🎓 glyph");
} else {
  console.error("✗ Pattern not matched");
  process.exit(1);
}
