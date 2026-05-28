const fs = require('fs');

function patch(path, replacements) {
  let src = fs.readFileSync(path, 'utf8');
  for (const [from, to] of replacements) {
    if (!src.includes(from)) {
      console.warn('  NOT FOUND:', from.slice(0, 60));
    } else {
      src = src.split(from).join(to);
      console.log('  replaced:', from.slice(0, 60));
    }
  }
  fs.writeFileSync(path, src, 'utf8');
  console.log('patched', path);
}

// AdminLogin.tsx
patch('src/components/admin/AdminLogin.tsx', [
  [
    'setInfo("Code sent. If no email arrives in 30 seconds, check Convex Dashboard \u2192 Functions \u2192 Logs for the code.")',
    'setInfo("OTP Sent")',
  ],
  [
    'setInfo("A 6-digit code has been sent to your email.")',
    'setInfo("OTP Sent")',
  ],
  [
    'setInfo("New code sent! Check your email.")',
    'setInfo("OTP Sent")',
  ],
  [
    'setError(result.error ?? "Invalid code.")',
    'setError("Failed")',
  ],
  [
    'setError((err?.data as string) ?? err?.message ?? "Verification failed.")',
    'setError("Failed")',
  ],
  [
    'setError((err?.data as string) ?? err?.message ?? "Failed to resend code.")',
    'setError("Failed")',
  ],
]);

// AdminAuthGate.tsx
patch('src/components/admin/AdminAuthGate.tsx', [
  [
    'setOtpInfo("Code sent. If you don\'t receive an email within 30 seconds, check your Convex Dashboard \u2192 Functions \u2192 Logs for the code (email setup pending).")',
    'setOtpInfo("OTP Sent")',
  ],
  [
    'setOtpError((err?.data as string) ?? err?.message ?? "Failed to send verification code.")',
    'setOtpError("Failed")',
  ],
  [
    'setOtpError(result.error ?? "Invalid code.")',
    'setOtpError("Failed")',
  ],
  [
    'setOtpError((err?.data as string) ?? err?.message ?? "Verification failed.")',
    'setOtpError("Failed")',
  ],
]);

// CmsVerifyContext.tsx
patch('src/components/admin/CmsVerifyContext.tsx', [
  [
    'setOtpInfo("Code sent! Check your email.")',
    'setOtpInfo("OTP Sent")',
  ],
  [
    'setOtpError((err?.data as string) ?? err?.message ?? "Failed to send code.")',
    'setOtpError("Failed")',
  ],
  [
    'setOtpError(result.error ?? "Invalid code.")',
    'setOtpError("Failed")',
  ],
  [
    'setOtpError((err?.data as string) ?? err?.message ?? "Verification failed.")',
    'setOtpError("Failed")',
  ],
]);
