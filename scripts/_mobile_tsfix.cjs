// Fix TypeScript error: cast getDropItems return type as DropdownItem[]
const fs = require("fs");

let src = fs.readFileSync("src/components/MorphingHeader.tsx", "utf8");
const had = src.includes("\r\n");
if (had) src = src.replace(/\r\n/g, "\n");

src = src.replace(
  `  const getDropItems = (key: string) =>\n    key === "chapters" ? (chapterItems || []) : (STATIC_DROPDOWNS[key] || []);`,
  `  const getDropItems = (key: string): DropdownItem[] =>\n    (key === "chapters" ? (chapterItems || []) : (STATIC_DROPDOWNS[key] || [])) as DropdownItem[];`
);

if (had) src = src.replace(/\n/g, "\r\n");
fs.writeFileSync("src/components/MorphingHeader.tsx", src, "utf8");
console.log("✓ Fixed getDropItems return type");
