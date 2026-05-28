const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../src/components/admin/AdminAuthGate.tsx");
let raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

// Update sendOTP success message to hint about Convex logs when email isn't set up
raw = raw.replace(
  '      setOtpInfo("A verification code has been sent to your email.");',
  '      setOtpInfo("Code sent. If you don\'t receive an email within 30 seconds, check your Convex Dashboard → Functions → Logs for the code (email setup pending).");'
);

// Same fix in AdminLogin.tsx
const loginFile = path.join(__dirname, "../src/components/admin/AdminLogin.tsx");
let login = fs.readFileSync(loginFile, "utf8").replace(/\r\n/g, "\n");

login = login.replace(
  '      setInfo("A 6-digit code has been sent to your email.");',
  '      setInfo("Code sent. If no email arrives in 30 seconds, check Convex Dashboard → Functions → Logs for the code.");'
);

fs.writeFileSync(file, raw, "utf8");
fs.writeFileSync(loginFile, login, "utf8");
console.log("✅ Updated OTP success messages to hint about Convex logs fallback");
