const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../convex/otp.ts");
let raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

// Fix the mangled console.warn string
const OLD = "      console.warn(\n" +
  "        `[TWC-ADMIN-OTP] Email not configured (set RESEND_API_KEY). \" +\n" +
  '        "OTP for ${normalEmail}: ${code} (valid 10 min)`\n' +
  "      );";

const NEW = "      console.warn(" +
  "\n        `[TWC-ADMIN-OTP] No RESEND_API_KEY set. OTP for ${normalEmail}: ${code} (valid 10 min)`" +
  "\n      );";

if (!raw.includes(OLD)) {
  // Try simpler fix - just replace the whole console.warn block
  raw = raw.replace(
    /console\.warn\(\s*`\[TWC-ADMIN-OTP\][^`]+`\s*\);/,
    'console.warn(`[TWC-ADMIN-OTP] No RESEND_API_KEY set. OTP for ${normalEmail}: ${code} (valid 10 min)`);'
  );
  console.log("✅ Fixed via regex");
} else {
  raw = raw.replace(OLD, NEW);
  console.log("✅ Fixed via exact match");
}

fs.writeFileSync(file, raw, "utf8");
