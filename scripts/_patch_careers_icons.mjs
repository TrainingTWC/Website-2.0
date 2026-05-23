import { readFileSync, writeFileSync } from "node:fs";

const path = "app/about/careers/page.tsx";
let src = readFileSync(path, "utf8");

// 1) Add lucide import after the ScormViewer import
const importAnchor = `import { ScormViewer } from "@/src/components/about/ScormViewer";`;
const lucideImport = `import { Heart, Brain, Palmtree, BookOpen, Coffee, Globe } from "lucide-react";`;
if (!src.includes(lucideImport)) {
  src = src.replace(importAnchor, `${importAnchor}\n${lucideImport}`);
}

// 2) Replace benefitTiles definition
const oldTiles = `const benefitTiles = [
  { emoji: "❤️", title: "Health cover", detail: "You + family. Same plan, barista to exec.", color: "bg-rose-50 border-rose-200" },
  { emoji: "🧠", title: "Mental health", detail: "Confidential sessions. No manager approval.", color: "bg-violet-50 border-violet-200" },
  { emoji: "🏖️", title: "30 real days off", detail: "No fake unlimited. Actual 30 days.", color: "bg-sky-50 border-sky-200" },
  { emoji: "📚", title: "Rs 50k/year to learn", detail: "Courses, books, certs, conferences.", color: "bg-amber-50 border-amber-200" },
  { emoji: "☕", title: "Free beans forever", detail: "Two bags a month + cafe meals on shift.", color: "bg-orange-50 border-orange-200" },
  { emoji: "🌏", title: "Sabbatical", detail: "Eligible every 5 years. Paid time to think.", color: "bg-emerald-50 border-emerald-200" },
];`;

const newTiles = `const benefitTiles = [
  { Icon: Heart, title: "Health cover", detail: "You + family. Same plan, barista to exec.", color: "bg-rose-50 border-rose-200", iconColor: "text-rose-500" },
  { Icon: Brain, title: "Mental health", detail: "Confidential sessions. No manager approval.", color: "bg-violet-50 border-violet-200", iconColor: "text-violet-500" },
  { Icon: Palmtree, title: "30 real days off", detail: "No fake unlimited. Actual 30 days.", color: "bg-sky-50 border-sky-200", iconColor: "text-sky-500" },
  { Icon: BookOpen, title: "Rs 50k/year to learn", detail: "Courses, books, certs, conferences.", color: "bg-amber-50 border-amber-200", iconColor: "text-amber-600" },
  { Icon: Coffee, title: "Free beans forever", detail: "Two bags a month + cafe meals on shift.", color: "bg-orange-50 border-orange-200", iconColor: "text-orange-500" },
  { Icon: Globe, title: "Sabbatical", detail: "Eligible every 5 years. Paid time to think.", color: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-500" },
];`;

if (!src.includes(oldTiles)) {
  console.error("Could not find old benefitTiles block");
  process.exit(1);
}
src = src.replace(oldTiles, newTiles);

// 3) Replace the rendering map
const oldRender = `          {benefitTiles.map(({ emoji, title, detail, color }, i) => (
            <RevealOnScroll key={title} delay={i * 0.04}>
              <TiltCard intensity={5} className={\`rounded-2xl border p-6 h-full \${color} shadow-about-soft\`}>
                <div className="text-4xl mb-4" aria-hidden>{emoji}</div>
                <h3 className="font-serif font-bold text-xl leading-snug">{title}</h3>
                <p className="mt-2 text-sm text-natural-text/65 leading-relaxed">{detail}</p>
              </TiltCard>
            </RevealOnScroll>
          ))}`;

const newRender = `          {benefitTiles.map(({ Icon, title, detail, color, iconColor }, i) => (
            <RevealOnScroll key={title} delay={i * 0.04}>
              <TiltCard intensity={5} className={\`rounded-2xl border p-6 h-full \${color} shadow-about-soft\`}>
                <div className={\`mb-4 \${iconColor}\`} aria-hidden>
                  <Icon className="w-9 h-9" strokeWidth={1.75} />
                </div>
                <h3 className="font-serif font-bold text-xl leading-snug">{title}</h3>
                <p className="mt-2 text-sm text-natural-text/65 leading-relaxed">{detail}</p>
              </TiltCard>
            </RevealOnScroll>
          ))}`;

if (!src.includes(oldRender)) {
  console.error("Could not find old render block");
  process.exit(1);
}
src = src.replace(oldRender, newRender);

writeFileSync(path, src, "utf8");
console.log("✓ Patched careers icons");
