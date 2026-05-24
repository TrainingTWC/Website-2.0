const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'components', 'admin', 'AboutCMS.tsx');
let src = fs.readFileSync(file, 'utf8');

const before = "await setContent({ key: \"about.careers.marqueeSpeed\", json: speed });";
const after  = "await setContent({ key: \"about.careers.marqueeSpeed\", json: JSON.stringify(speed) });";

if (!src.includes(before)) {
  console.error('Pattern not found — already fixed or changed?');
  console.error('Looking for:', before);
  process.exit(1);
}

src = src.replace(before, after);
fs.writeFileSync(file, src, 'utf8');
console.log('✓ fixed: json: speed  →  json: JSON.stringify(speed)');
