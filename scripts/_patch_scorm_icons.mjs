import { readFileSync, writeFileSync } from "node:fs";
const path = "src/components/about/ScormViewer.tsx";
let src = readFileSync(path, "utf8");

// add lucide import
const after = `import { motion, AnimatePresence } from "motion/react";`;
const add = `import { GraduationCap, X } from "lucide-react";`;
if (!src.includes(add)) src = src.replace(after, `${after}\n${add}`);

// replace 🎓 icon
const oldGlyph = `        <div className="shrink-0 w-16 h-16 rounded-2xl border-2 border-about-accent flex items-center justify-center text-3xl" aria-hidden>
          🎓
        </div>`;
const newGlyph = `        <div className="shrink-0 w-16 h-16 rounded-2xl border-2 border-about-accent flex items-center justify-center text-about-accent" aria-hidden>
          <GraduationCap className="w-7 h-7" strokeWidth={1.75} />
        </div>`;
if (src.includes(oldGlyph)) src = src.replace(oldGlyph, newGlyph);
else console.error("glyph block not found");

// replace ✕ close glyph (line ~171) - it's likely an inline char
src = src.replace(/>\s*✕\s*</g, "><X className=\"w-4 h-4\" /><");

writeFileSync(path, src, "utf8");
console.log("✓ Patched ScormViewer");
