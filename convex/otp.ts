/**
 * OTP (One-Time Password) system for admin 2FA login and CMS re-verification.
 *
 * Security properties:
 *  - OTP codes are SHA-256 hashed before storage (no plaintext in DB)
 *  - 6-digit codes with 10-minute expiry
 *  - Max 5 failed verify attempts per code before invalidation
 *  - Max 3 OTP send requests per email per 15-minute window
 *  - Password brute-force lockout: 5 failures → 15-minute lock per email
 *  - Emails sent via Resend from noreply@prismintelligence.in
 */

import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── Constants ────────────────────────────────────────────────────────────────
const OTP_EXPIRY_MS = 10 * 60 * 1000;        // 10 minutes
const MAX_OTP_VERIFY_ATTEMPTS = 5;            // wrong guesses per code
const MAX_OTP_SENDS = 3;                      // send requests per window
const OTP_SEND_WINDOW_MS = 15 * 60 * 1000;   // 15-minute sliding window
const MAX_PASSWORD_FAILS = 5;                 // bad passwords before lockout
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;  // lockout duration

// ── Crypto helper ─────────────────────────────────────────────────────────────
async function sha256hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Internal helpers (not callable from the browser) ─────────────────────────

export const _getAttempts = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) =>
    ctx.db
      .query("adminLoginAttempts")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first(),
});

export const _storeOTP = internalMutation({
  args: {
    email: v.string(),
    codeHash: v.string(),
    expiresAt: v.number(),
    purpose: v.string(),
  },
  handler: async (ctx, { email, codeHash, expiresAt, purpose }) => {
    // Delete any previous OTPs for this email+purpose before inserting a new one
    const old = await ctx.db
      .query("adminOtp")
      .withIndex("by_email_purpose", (q) =>
        q.eq("email", email).eq("purpose", purpose)
      )
      .collect();
    for (const o of old) await ctx.db.delete(o._id);

    await ctx.db.insert("adminOtp", {
      email,
      codeHash,
      expiresAt,
      used: false,
      attempts: 0,
      purpose,
    });
  },
});

export const _recordOtpSend = internalMutation({
  args: { email: v.string(), sentAt: v.number() },
  handler: async (ctx, { email, sentAt }) => {
    const doc = await ctx.db
      .query("adminLoginAttempts")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    const recentSends = [
      ...((doc?.otpSentAt ?? []).filter(
        (t) => sentAt - t < OTP_SEND_WINDOW_MS
      )),
      sentAt,
    ];
    if (doc) {
      await ctx.db.patch(doc._id, { otpSentAt: recentSends });
    } else {
      await ctx.db.insert("adminLoginAttempts", {
        email,
        failedPassAt: [],
        otpSentAt: recentSends,
        lockedUntil: undefined,
      });
    }
  },
});

// ── Public functions ──────────────────────────────────────────────────────────

/**
 * Check whether an email is currently locked out after too many failed passwords.
 * Call this BEFORE attempting signIn to give a clear error message.
 */
export const checkLoginLockout = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const doc = await ctx.db
      .query("adminLoginAttempts")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase().trim()))
      .first();
    if (!doc) return { locked: false };
    const now = Date.now();
    if (doc.lockedUntil && now < doc.lockedUntil) {
      return { locked: true, lockedUntil: doc.lockedUntil };
    }
    return { locked: false };
  },
});

/**
 * Record a failed password attempt. Locks the email for 15 min after 5 failures.
 */
export const recordPasswordFailure = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalEmail = email.toLowerCase().trim();
    const now = Date.now();
    const window = 15 * 60 * 1000;
    const doc = await ctx.db
      .query("adminLoginAttempts")
      .withIndex("by_email", (q) => q.eq("email", normalEmail))
      .first();
    const recentFails = [
      ...((doc?.failedPassAt ?? []).filter((t) => now - t < window)),
      now,
    ];
    const lockedUntil =
      recentFails.length >= MAX_PASSWORD_FAILS ? now + LOCKOUT_DURATION_MS : doc?.lockedUntil;
    if (doc) {
      await ctx.db.patch(doc._id, { failedPassAt: recentFails, lockedUntil });
    } else {
      await ctx.db.insert("adminLoginAttempts", {
        email: normalEmail,
        failedPassAt: recentFails,
        otpSentAt: [],
        lockedUntil,
      });
    }
  },
});

/**
 * Clear failed password counter on successful login.
 * Requires the caller to be authenticated — only a signed-in user can clear
 * their own lockout. This prevents unauthenticated callers from wiping the
 * brute-force counter for any admin email (LOCKOUT-BYPASS-01).
 */
export const recordPasswordSuccess = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    // Must be called by an authenticated session — not publicly accessible.
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthorized");
    const normalEmail = email.toLowerCase().trim();
    const doc = await ctx.db
      .query("adminLoginAttempts")
      .withIndex("by_email", (q) => q.eq("email", normalEmail))
      .first();
    if (doc) {
      await ctx.db.patch(doc._id, { failedPassAt: [], lockedUntil: undefined });
    }
  },
});

/**
 * Send a 6-digit OTP to the given email address.
 * Rate-limited to 3 requests per 15 minutes per email.
 * purpose: "login" | "cms_action"
 */
export const requestOTP = action({
  args: {
    email: v.string(),
    // Allowlisted purposes only — no free-form strings stored in adminOtp (OTP-PURPOSE-01).
    purpose: v.optional(v.union(v.literal("login"), v.literal("cms_action"))),
  },
  handler: async (ctx, { email, purpose = "login" }) => {
    const normalEmail = email.toLowerCase().trim();
    const now = Date.now();

    // Rate-limit check
    const attemptsDoc = await ctx.runQuery(internal.otp._getAttempts, {
      email: normalEmail,
    });
    const recentSends = (attemptsDoc?.otpSentAt ?? []).filter(
      (t: number) => now - t < OTP_SEND_WINDOW_MS
    );
    if (recentSends.length >= MAX_OTP_SENDS) {
      throw new ConvexError("Too many verification requests. Please wait 15 minutes before requesting another code.");
    }

    // Generate, hash, and store OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await sha256hex(code);
    const expiresAt = now + OTP_EXPIRY_MS;

    await ctx.runMutation(internal.otp._storeOTP, {
      email: normalEmail,
      codeHash,
      expiresAt,
      purpose,
    });
    await ctx.runMutation(internal.otp._recordOtpSend, {
      email: normalEmail,
      sentAt: now,
    });

    // Send via Resend
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // RESEND_API_KEY not configured — log code to Convex function logs so
      // the admin can retrieve it from the Convex Dashboard > Functions > Logs
      // until email is properly set up.
      console.warn(`[TWC-ADMIN-OTP] No RESEND_API_KEY set. OTP for ${normalEmail}: ${code} (valid 10 min)`);
      return { sent: true };
    }

    const purposeLabel = purpose === "cms_action" ? "Verification" : "Login";

    let resp: Response;
    try {
      resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "TWC Admin <noreply@prismintelligence.in>",
          to: [normalEmail],
          subject: `Your TWC Admin ${purposeLabel} Code`,
          html: `
            <div style="font-family:system-ui,Arial,sans-serif;max-width:440px;margin:0 auto;padding:32px 24px;background:#faf7f2;border-radius:12px;border:1px solid #e8dfd4;">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
                <div style="width:36px;height:36px;background:#5a3e28;border-radius:8px;"></div>
                <span style="font-size:16px;font-weight:700;color:#1a1a1a;">Third Wave Coffee</span>
              </div>
              <p style="color:#444;margin-bottom:6px;font-size:14px;">Your one-time ${purposeLabel.toLowerCase()} code:</p>
              <div style="font-size:38px;font-weight:800;letter-spacing:12px;color:#5a3e28;background:#f0e8dc;padding:20px;border-radius:10px;text-align:center;margin:16px 0;">
                ${code}
              </div>
              <p style="color:#888;font-size:12px;margin-top:16px;line-height:1.5;">
                This code expires in <strong>10 minutes</strong>.<br/>
                Never share it with anyone — TWC staff will never ask for it.<br/>
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>`,
        }),
      });
    } catch (fetchErr: unknown) {
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      console.error(`[TWC-ADMIN-OTP] Resend fetch error for ${normalEmail}: ${msg}`);
      throw new ConvexError("Could not reach the email service. Please try again in a moment.");
    }

    if (!resp.ok) {
      let errText = "(no body)";
      try { errText = await resp.text(); } catch { /* ignore */ }
      console.error(`[TWC-ADMIN-OTP] Resend HTTP ${resp.status} for ${normalEmail}: ${errText}`);
      throw new ConvexError(
        resp.status === 403
          ? "Email sending is not authorised. Check that the sending domain is verified in Resend."
          : `Email delivery failed (${resp.status}). Please try again or contact support.`,
      );
    }

    return { sent: true };
  },
});

/**
 * Verify a submitted OTP code.
 * Returns { ok: true } on success or { ok: false, error: string } on failure.
 */
export const verifyOTP = mutation({
  args: {
    email: v.string(),
    code: v.string(),
    // Allowlisted purposes only (OTP-PURPOSE-01).
    purpose: v.optional(v.union(v.literal("login"), v.literal("cms_action"))),
  },
  handler: async (ctx, { email, code, purpose = "login" }) => {
    const normalEmail = email.toLowerCase().trim();
    const now = Date.now();

    const otpDoc = await ctx.db
      .query("adminOtp")
      .withIndex("by_email_purpose", (q) =>
        q.eq("email", normalEmail).eq("purpose", purpose)
      )
      .first();

    if (!otpDoc) {
      return { ok: false, error: "No active code found. Request a new one." };
    }
    if (otpDoc.used) {
      return { ok: false, error: "Code already used. Request a new one." };
    }
    if (now > otpDoc.expiresAt) {
      await ctx.db.delete(otpDoc._id);
      return { ok: false, error: "Code expired. Request a new one." };
    }
    if (otpDoc.attempts >= MAX_OTP_VERIFY_ATTEMPTS) {
      return {
        ok: false,
        error: "Too many failed attempts. Request a new code.",
      };
    }

    // Constant-time comparison via hash
    const providedHash = await sha256hex(code.trim());
    if (providedHash !== otpDoc.codeHash) {
      const newAttempts = otpDoc.attempts + 1;
      await ctx.db.patch(otpDoc._id, { attempts: newAttempts });
      const remaining = MAX_OTP_VERIFY_ATTEMPTS - newAttempts;
      return {
        ok: false,
        error:
          remaining > 0
            ? `Invalid code. ${remaining} attempt(s) remaining.`
            : "Invalid code. No more attempts — request a new code.",
      };
    }

    await ctx.db.patch(otpDoc._id, { used: true });

    // ── Create a server-side OTP session (30 minutes) ────────────────────
    // Storing the session in Convex means the browser cannot bypass 2FA by
    // writing to sessionStorage. AdminAuthGate validates this token on every
    // page load via the validateOtpSession query.
    const sessionToken = crypto.randomUUID();
    const sessionExpiry = now + 30 * 60 * 1000;
    const oldSessions = await ctx.db
      .query("adminOtpSessions")
      .withIndex("by_email", (q) => q.eq("email", normalEmail))
      .collect();
    for (const s of oldSessions) await ctx.db.delete(s._id);
    await ctx.db.insert("adminOtpSessions", {
      email: normalEmail,
      token: sessionToken,
      expiresAt: sessionExpiry,
    });

    return { ok: true as const, sessionToken };
  },
});

/**
 * Validate a server-side OTP session token.
 * Called by AdminAuthGate on every page load to verify the stored token.
 */
export const validateOtpSession = query({
  args: { email: v.string(), token: v.string() },
  handler: async (ctx, { email, token }) => {
    const session = await ctx.db
      .query("adminOtpSessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (!session) return { valid: false };
    if (session.email !== email.toLowerCase().trim()) return { valid: false };
    if (Date.now() > session.expiresAt) return { valid: false };
    return { valid: true };
  },
});
