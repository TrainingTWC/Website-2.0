const fs = require("fs");
const path = require("path");

function fix(filePath, replacements) {
  let raw = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  for (const [from, to] of replacements) {
    raw = raw.replace(from, to);
  }
  fs.writeFileSync(filePath, raw, "utf8");
  console.log(`✅ Fixed ${path.basename(filePath)}`);
}

const root = path.join(__dirname, "..");

// AdminAuthGate.tsx — two ConvexError catches
fix(path.join(root, "src/components/admin/AdminAuthGate.tsx"), [
  [
    'setOtpError(err?.message ?? "Failed to send verification code.");',
    'setOtpError((err?.data as string) ?? err?.message ?? "Failed to send verification code.");'
  ],
  [
    'setOtpError(err?.message ?? "Verification failed.");',
    'setOtpError((err?.data as string) ?? err?.message ?? "Verification failed.");'
  ],
]);

// AdminLogin.tsx — verifyOTP and resend catches (not the signIn/signUp ones)
fix(path.join(root, "src/components/admin/AdminLogin.tsx"), [
  [
    'setError(err?.message ?? "Verification failed.");',
    'setError((err?.data as string) ?? err?.message ?? "Verification failed.");'
  ],
  [
    'setError(err?.message ?? "Failed to resend code.");',
    'setError((err?.data as string) ?? err?.message ?? "Failed to resend code.");'
  ],
]);

// CmsVerifyContext.tsx — two ConvexError catches
fix(path.join(root, "src/components/admin/CmsVerifyContext.tsx"), [
  [
    'setOtpError(err?.message ?? "Failed to send code.");',
    'setOtpError((err?.data as string) ?? err?.message ?? "Failed to send code.");'
  ],
  [
    'setOtpError(err?.message ?? "Verification failed.");',
    'setOtpError((err?.data as string) ?? err?.message ?? "Verification failed.");'
  ],
]);
