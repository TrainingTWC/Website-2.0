// Fix: add useCareerMarqueeSpeed to import in careers/page.tsx
const fs = require("fs");
let src = fs.readFileSync("app/about/careers/page.tsx", "utf8");
const had = src.includes("\r\n");
if (had) src = src.replace(/\r\n/g, "\n");

src = src.replace(
  "  useCareerMarquee,\n",
  "  useCareerMarquee,\n  useCareerMarqueeSpeed,\n"
);

if (had) src = src.replace(/\n/g, "\r\n");
fs.writeFileSync("app/about/careers/page.tsx", src, "utf8");
console.log("✓ fixed import");
