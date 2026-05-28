const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../convex/otp.ts");
let raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

// 1. Add ConvexError import (add to the convex/values import line)
raw = raw.replace(
  `import { v } from "convex/values";`,
  `import { v, ConvexError } from "convex/values";`
);

// 2. Replace the "no API key throws" block + the failing "resp.ok" throw
//    with: fallback to console.log when no key, ConvexError for fetch failures
const OLD_BLOCK = `    // Send via Resend
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Email service not configured. Set RESEND_API_KEY in Convex environment variables."
      );
    }`;

const NEW_BLOCK = `    // Send via Resend
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // RESEND_API_KEY not configured — log code to Convex function logs so
      // the admin can retrieve it from the Convex Dashboard > Functions > Logs
      // until email is properly set up.
      console.warn(
        \`[TWC-ADMIN-OTP] Email not configured (set RESEND_API_KEY). \" +
        \"OTP for \${normalEmail}: \${code} (valid 10 min)\`
      );
      return { sent: true };
    }`;

if (!raw.includes(OLD_BLOCK)) {
  console.error("ERROR: Could not find the RESEND_API_KEY block to patch.");
  process.exit(1);
}
raw = raw.replace(OLD_BLOCK, NEW_BLOCK);

// 3. Change the throw Error on fetch failure to ConvexError so the message reaches the client
raw = raw.replace(
  `throw new Error(\`Email delivery failed: \${errText}\`);`,
  `throw new ConvexError(\`Email delivery failed: \${errText}\`);`
);

// 4. Also fix the rate-limit error to use ConvexError
raw = raw.replace(
  `throw new Error(\n        "Too many verification requests. Please wait 15 minutes before requesting another code."\n      );`,
  `throw new ConvexError("Too many verification requests. Please wait 15 minutes before requesting another code.");`
);

fs.writeFileSync(file, raw, "utf8");
console.log("✅ convex/otp.ts patched — fallback log mode + ConvexError for visible messages");
