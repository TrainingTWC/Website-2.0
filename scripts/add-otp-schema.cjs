const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../convex/schema.ts");
let raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

const newTables = `
  // ── Admin OTP codes ──────────────────────────────────────────────────────
  // Stores hashed one-time codes for login 2FA and CMS action re-verification.
  adminOtp: defineTable({
    email: v.string(),
    codeHash: v.string(),    // SHA-256 hex of the 6-digit code
    expiresAt: v.number(),   // Unix ms
    used: v.boolean(),
    attempts: v.number(),    // failed verify attempts (max 5 before invalidation)
    purpose: v.string(),     // "login" | "cms_action"
  }).index("by_email_purpose", ["email", "purpose"]),

  // ── Admin brute-force / rate-limit tracking ───────────────────────────────
  adminLoginAttempts: defineTable({
    email: v.string(),
    failedPassAt: v.array(v.number()),  // timestamps of failed password attempts
    otpSentAt: v.array(v.number()),     // timestamps of OTP send requests
    lockedUntil: v.optional(v.number()), // lock expiry (Unix ms)
  }).index("by_email", ["email"]),
});`;

if (raw.includes("adminOtp:")) {
  console.log("adminOtp table already exists — skipping.");
  process.exit(0);
}

// Replace the final `});` (the schema export closing) with new tables + closing
const marker = "});";
const lastIdx = raw.lastIndexOf(marker);
if (lastIdx === -1) {
  console.error("ERROR: Could not find closing '});' in schema.ts");
  process.exit(1);
}

const patched = raw.slice(0, lastIdx) + newTables;
fs.writeFileSync(file, patched, "utf8");
console.log("✅ convex/schema.ts patched — added adminOtp + adminLoginAttempts tables");
