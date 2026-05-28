const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../convex/otp.ts");
let raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

raw = raw.replace(
  " *  - Emails sent via Resend from noreply@TWC.prismintelligence.in",
  " *  - Emails sent via Resend from noreply@prismintelligence.in"
);
raw = raw.replace(
  'from: "TWC Admin <noreply@TWC.prismintelligence.in>",',
  'from: "TWC Admin <noreply@prismintelligence.in>",'
);

fs.writeFileSync(file, raw, "utf8");
console.log("✅ Sender email updated to noreply@prismintelligence.in");
