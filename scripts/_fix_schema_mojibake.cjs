// Fix mojibake (UTF-8 read-as-cp1252 then re-saved) in convex/schema.ts
const fs = require("fs");
const path = "convex/schema.ts";
let t = fs.readFileSync(path, "utf8");
const before = t.length;

// Box-drawing horizontal (─, U+2500) became "â\u0080\u0094" / "â\u0094\u0080" sequences
// Heavy double horizontal (═, U+2550) became "â\u0095\u0090"
// em-dash (—, U+2014) became "â\u0080\u0094"
// curly apostrophes/quotes similar

// Strategy: collapse any run of corrupt mojibake bytes inside comments into ASCII dashes/equals/apostrophes.
// Box drawing single-line: \u00e2\u0094\u0080  (â + box-light-h)
t = t.replace(/(\u00e2\u0094\u0080)+/g, "--");
// Box drawing double-line: \u00e2\u0095\u0090
t = t.replace(/(\u00e2\u0095\u0090)+/g, "==");
// em-dash: \u00e2\u0080\u0094
t = t.replace(/\u00e2\u0080\u0094/g, "--");
// en-dash: \u00e2\u0080\u0093
t = t.replace(/\u00e2\u0080\u0093/g, "-");
// curly single quotes: \u00e2\u0080\u0098 \u00e2\u0080\u0099
t = t.replace(/\u00e2\u0080[\u0098\u0099]/g, "'");
// curly double quotes: \u00e2\u0080\u009c \u00e2\u0080\u009d
t = t.replace(/\u00e2\u0080[\u009c\u009d]/g, '"');

fs.writeFileSync(path, t, "utf8");
console.log(`before=${before} after=${t.length}`);
