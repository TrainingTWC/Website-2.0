const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../src/components/admin/AdminLogin.tsx");
const content = `"use client";
import { useState, useRef, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api as convexApi } from "../../../convex/_generated/api";
import { motion, AnimatePresence } from "motion/react";
import { Coffee, Lock, Mail, ArrowRight, AlertCircle, KeyRound, ShieldCheck, RefreshCw } from "lucide-react";
import { asset } from "../../lib/asset";

const otpApi = (convexApi as any).otp;

/**
 * Two-phase admin login:
 *   Phase 1: email + password  →  brute-force check + signIn
 *   Phase 2: 6-digit OTP       →  verifyOTP → dashboard unlocked
 *
 * Security features:
 *  - Lockout after 5 bad passwords (15-min, enforced server-side)
 *  - OTP rate-limited (3 sends / 15 min)
 *  - OTP expires in 10 min, max 5 wrong guesses per code
 */
export function AdminLogin({ panelLabel = "Merchant" }: { panelLabel?: string }) {
  const { signIn, signOut } = useAuthActions();
  const purgeEmail     = useMutation((convexApi as any).authAdmin.purgeEmail);
  const recordFailure  = useMutation(otpApi.recordPasswordFailure);
  const recordSuccess  = useMutation(otpApi.recordPasswordSuccess);
  const requestOTP     = useAction(otpApi.requestOTP);
  const verifyOTP      = useMutation(otpApi.verifyOTP);
  const lockout        = useQuery(otpApi.checkLoginLockout, { email: "" });

  const [step, setStep]         = useState<"credentials" | "otp">("credentials");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [otpCode, setOtpCode]   = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [info, setInfo]         = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [showReset, setShowReset] = useState(false);
  const lockedEmail = useRef("");

  // Real-time lockout check for the typed email
  const lockoutStatus = useQuery(
    otpApi.checkLoginLockout,
    step === "credentials" && email.trim().length > 3
      ? { email: email.trim().toLowerCase() }
      : "skip"
  ) as { locked: boolean; lockedUntil?: number } | undefined;

  const isLocked = lockoutStatus?.locked === true;
  const lockUntilStr = lockoutStatus?.lockedUntil
    ? new Date(lockoutStatus.lockedUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  // ── Phase 1: credentials ──────────────────────────────────────────────────
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (isLocked) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    const fd = new FormData();
    fd.set("email", email.trim().toLowerCase());
    fd.set("password", password);
    try {
      fd.set("flow", "signIn");
      await signIn("password", fd);
      // signIn succeeded — record success + send OTP
      await recordSuccess({ email: email.trim().toLowerCase() });
      await requestOTP({ email: email.trim().toLowerCase(), purpose: "login" });
      lockedEmail.current = email.trim().toLowerCase();
      setStep("otp");
      setInfo("A 6-digit code has been sent to your email.");
    } catch (signInErr: any) {
      // Try sign-up (new account)
      try {
        fd.set("flow", "signUp");
        if (name) fd.set("name", name);
        await signIn("password", fd);
        await recordSuccess({ email: email.trim().toLowerCase() });
        await requestOTP({ email: email.trim().toLowerCase(), purpose: "login" });
        lockedEmail.current = email.trim().toLowerCase();
        setStep("otp");
        setInfo("A 6-digit code has been sent to your email.");
      } catch (signUpErr: any) {
        await recordFailure({ email: email.trim().toLowerCase() }).catch(() => {});
        const msg =
          signUpErr?.data?.toString?.() ??
          signUpErr?.message ??
          signInErr?.message ??
          "Unknown error";
        setError(
          \`Couldn't sign in or create the account. Server said: \${msg}. If you forgot the password, use 'Reset & set new password' below.\`
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Phase 2: OTP verification ─────────────────────────────────────────────
  async function submitOTP(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await verifyOTP({
        email: lockedEmail.current,
        code: otpCode.trim(),
        purpose: "login",
      });
      if (result.ok) {
        // OTP verified — session is already active (signIn already happened).
        // AdminAuthGate will pick up the verified state from sessionStorage.
        sessionStorage.setItem(
          "otp_verified",
          JSON.stringify({ email: lockedEmail.current, verifiedAt: Date.now() })
        );
        // Force a re-render of the auth gate by doing a soft navigation
        window.location.reload();
      } else {
        setError(result.error ?? "Invalid code.");
      }
    } catch (err: any) {
      setError(err?.message ?? "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function resendOTP() {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await requestOTP({ email: lockedEmail.current, purpose: "login" });
      setInfo("New code sent! Check your email.");
    } catch (err: any) {
      setError(err?.message ?? "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  }

  // ── Reset flow ─────────────────────────────────────────────────────────────
  async function trySignUp() {
    const fd = new FormData();
    fd.set("email", email.trim().toLowerCase());
    fd.set("password", password);
    fd.set("flow", "signUp");
    if (name) fd.set("name", name);
    await signIn("password", fd);
  }

  async function resetAndCreate() {
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) {
      setError("Enter the email and a new password first.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      try { await signOut(); } catch {}
      const result = await purgeEmail({ email: email.trim().toLowerCase() });
      setInfo(
        \`Cleared \${result.removed.authAccounts} authAccount(s), \${result.removed.users} user(s), \${result.removed.admins} admin row(s). Creating fresh account…\`
      );
      await new Promise((r) => setTimeout(r, 400));
      await trySignUp();
    } catch (err: any) {
      const msg = err?.data?.toString?.() ?? err?.message ?? "Reset failed. Try again.";
      setError(\`Reset failed: \${msg}\`);
    } finally {
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen w-full bg-[linear-gradient(180deg,#F4EFE6_0%,#E9E1D2_100%)] flex items-center justify-center px-4 overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-amber-300/30 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full bg-emerald-300/20 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.6)_0%,rgba(255,255,255,0)_45%)]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div className="relative rounded-[2rem] border border-white/55 bg-white/65 backdrop-blur-2xl shadow-[0_30px_80px_rgba(20,20,20,0.12)] overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0)_30%)]" />

          <div className="relative p-8 sm:p-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-7">
              <div className="w-12 h-12 rounded-2xl bg-natural-accent text-white flex items-center justify-center shadow-[0_10px_24px_rgba(90,90,64,0.35)]">
                <img src={asset("logo.png")} alt="" className="w-8 h-8 object-contain invert" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">{panelLabel} access</p>
                <p className="text-lg font-bold text-stone-900 leading-tight">Third Wave Coffee</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* ── Step 1: Credentials ── */}
              {step === "credentials" && (
                <motion.div
                  key="credentials"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.25 }}
                >
                  <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
                    Sign in to your panel.
                  </h1>
                  <p className="text-sm text-stone-500 mt-1.5">
                    Enter your credentials. A verification code will be emailed to you.
                  </p>

                  {isLocked && (
                    <div className="mt-4 flex items-start gap-2 px-3 py-2 rounded-xl bg-rose-100/70 border border-rose-200">
                      <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-rose-700">
                        Account temporarily locked until {lockUntilStr} due to too many failed attempts.
                      </p>
                    </div>
                  )}

                  <form onSubmit={submit} className="mt-6 space-y-3">
                    <div className="relative">
                      <Coffee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Display name (optional)"
                        className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/80 border border-white/70 text-sm placeholder:text-stone-400 outline-none focus:ring-2 ring-natural-accent/25"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@thirdwavecoffee.in"
                        className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/80 border border-white/70 text-sm placeholder:text-stone-400 outline-none focus:ring-2 ring-natural-accent/25"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password (min 8 characters)"
                        className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/80 border border-white/70 text-sm placeholder:text-stone-400 outline-none focus:ring-2 ring-natural-accent/25"
                      />
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-rose-100/70 border border-rose-200">
                        <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-rose-700">{error}</p>
                      </div>
                    )}
                    {info && (
                      <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-emerald-100/70 border border-emerald-200">
                        <ShieldCheck className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                        <p className="text-xs text-emerald-800">{info}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || isLocked}
                      className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-natural-accent text-white font-bold text-sm px-4 py-3 rounded-xl shadow-[0_14px_32px_rgba(90,90,64,0.35)] hover:brightness-110 active:scale-[0.98] transition disabled:opacity-60"
                    >
                      {loading ? "Working…" : "Continue"}
                      {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </form>

                  <div className="mt-5 pt-5 border-t border-stone-200/60">
                    {!showReset ? (
                      <button
                        type="button"
                        onClick={() => { setShowReset(true); setError(null); setInfo(null); }}
                        className="w-full text-xs text-stone-500 hover:text-stone-900 transition inline-flex items-center justify-center gap-1.5"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        Locked out? Reset &amp; set a new password
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-stone-600 leading-relaxed">
                          This wipes every existing auth row for{" "}
                          <span className="font-semibold text-stone-900">
                            {email.trim() || "this email"}
                          </span>{" "}
                          and creates a fresh account with the password typed above.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowReset(false)}
                            className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={resetAndCreate}
                            disabled={loading}
                            className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition disabled:opacity-60"
                          >
                            {loading ? "Resetting…" : "Reset & create"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: OTP ── */}
              {step === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-5 h-5 text-natural-accent" />
                    <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
                      Verify your identity.
                    </h1>
                  </div>
                  <p className="text-sm text-stone-500 mt-1.5">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-semibold text-stone-700">{lockedEmail.current}</span>.
                  </p>

                  {info && (
                    <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-xl bg-emerald-100/70 border border-emerald-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                      <p className="text-xs text-emerald-800">{info}</p>
                    </div>
                  )}

                  <form onSubmit={submitOTP} className="mt-6 space-y-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="w-full text-center text-3xl font-bold tracking-[0.4em] py-3.5 rounded-xl bg-white/80 border border-white/70 outline-none focus:ring-2 ring-natural-accent/25 placeholder:tracking-normal placeholder:text-stone-300 placeholder:text-base placeholder:font-normal"
                    />

                    {error && (
                      <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-rose-100/70 border border-rose-200">
                        <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-rose-700">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || otpCode.length < 6}
                      className="w-full inline-flex items-center justify-center gap-2 bg-natural-accent text-white font-bold text-sm px-4 py-3 rounded-xl shadow-[0_14px_32px_rgba(90,90,64,0.35)] hover:brightness-110 active:scale-[0.98] transition disabled:opacity-60"
                    >
                      {loading ? "Verifying…" : "Verify & sign in"}
                      {!loading && <ShieldCheck className="w-4 h-4" />}
                    </button>
                  </form>

                  <div className="mt-5 pt-5 border-t border-stone-200/60 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={resendOTP}
                      disabled={loading}
                      className="w-full text-xs text-stone-500 hover:text-stone-900 transition inline-flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className={\`w-3.5 h-3.5 \${loading ? "animate-spin" : ""}\`} />
                      Resend code
                    </button>
                    <button
                      type="button"
                      onClick={() => { setStep("credentials"); setError(null); setInfo(null); setOtpCode(""); }}
                      className="w-full text-xs text-stone-400 hover:text-stone-700 transition"
                    >
                      ← Back to sign in
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-[11px] text-stone-500 mt-5 font-medium">
          Access is granted by invitation. Contact your superadmin if you can't sign in.
        </p>
      </motion.div>
    </div>
  );
}
`;

fs.writeFileSync(file, content, "utf8");
console.log("✅ AdminLogin.tsx rewritten with two-phase OTP login");
