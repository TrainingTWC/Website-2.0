const fs = require("fs");
const path = require("path");

// Patch CmsVerifyContext to accept initialVerifiedAt prop
const ctxFile = path.join(__dirname, "../src/components/admin/CmsVerifyContext.tsx");
let ctx = fs.readFileSync(ctxFile, "utf8").replace(/\r\n/g, "\n");

ctx = ctx.replace(
  `export function CmsVerifyProvider({\n  email,\n  children,\n}: {\n  email: string;\n  children: ReactNode;\n}) {\n`,
  `export function CmsVerifyProvider({\n  email,\n  initialVerifiedAt = 0,\n  children,\n}: {\n  email: string;\n  initialVerifiedAt?: number;\n  children: ReactNode;\n}) {\n`
);

ctx = ctx.replace(
  "  const [lastVerifiedAt, setLastVerifiedAt] = useState<number>(0);",
  "  const [lastVerifiedAt, setLastVerifiedAt] = useState<number>(initialVerifiedAt);"
);

fs.writeFileSync(ctxFile, ctx, "utf8");
console.log("✅ CmsVerifyContext.tsx patched — added initialVerifiedAt prop");

// Now rewrite AdminAuthGate.tsx
const gateFile = path.join(__dirname, "../src/components/admin/AdminAuthGate.tsx");
const gateContent = `"use client";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Authenticated, Unauthenticated, AuthLoading, useMutation, useQuery, useAction } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, LogOut, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { AdminLogin } from "./AdminLogin";
import { CmsVerifyProvider } from "./CmsVerifyContext";

const convexApi = api as any;
const otpApi = (api as any).otp;

export type AdminMe = {
  userId: string;
  email: string | null;
  name: string | null;
  admin: {
    _id: string;
    role: "superadmin" | "admin" | "editor" | "viewer" | "hr" | "marketing" | "pr";
    permissions: Record<string, boolean>;
    active: boolean;
    invitedAt: number;
    lastSeenAt?: number;
  } | null;
};

interface AdminAuthGateProps {
  panelLabel?: string;
  requireSuperadmin?: boolean;
  children: (me: AdminMe) => ReactNode;
}

export function AdminAuthGate({ panelLabel = "Merchant", requireSuperadmin, children }: AdminAuthGateProps) {
  return (
    <>
      <AuthLoading>
        <LoadingScreen />
      </AuthLoading>
      <Unauthenticated>
        <AdminLogin panelLabel={panelLabel} />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedShell panelLabel={panelLabel} requireSuperadmin={requireSuperadmin}>
          {children}
        </AuthenticatedShell>
      </Authenticated>
    </>
  );
}

// ── OTP-gated authenticated shell ─────────────────────────────────────────────
function AuthenticatedShell({
  panelLabel,
  requireSuperadmin,
  children,
}: {
  panelLabel: string;
  requireSuperadmin?: boolean;
  children: (me: AdminMe) => ReactNode;
}) {
  const bootstrap  = useMutation(convexApi.admins.bootstrap);
  const me         = useQuery(convexApi.admins.me) as AdminMe | undefined;
  const requestOTP = useAction(otpApi.requestOTP);
  const verifyOTP  = useMutation(otpApi.verifyOTP);

  const [otpVerified, setOtpVerified] = useState(false);
  const [verifiedAt,  setVerifiedAt]  = useState(0);
  const [otpCode,     setOtpCode]     = useState("");
  const [otpError,    setOtpError]    = useState<string | null>(null);
  const [otpInfo,     setOtpInfo]     = useState<string | null>(null);
  const [otpLoading,  setOtpLoading]  = useState(false);
  const otpSentRef = useRef(false);

  useEffect(() => { bootstrap().catch(() => {}); }, [bootstrap]);

  // Check sessionStorage on mount once email is known
  useEffect(() => {
    if (!me?.email) return;
    const normalEmail = me.email.toLowerCase();
    try {
      const stored = sessionStorage.getItem("otp_verified");
      if (stored) {
        const { email: storedEmail, verifiedAt: storedAt } = JSON.parse(stored);
        if (storedEmail === normalEmail && Date.now() - storedAt < 30 * 60 * 1000) {
          setVerifiedAt(storedAt);
          setOtpVerified(true);
          return; // valid session, skip OTP screen
        }
      }
    } catch {}
    // No valid sessionStorage entry — need OTP
    if (!otpSentRef.current) {
      otpSentRef.current = true;
      sendOTP(normalEmail);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.email]);

  async function sendOTP(emailAddr: string) {
    setOtpError(null);
    try {
      await requestOTP({ email: emailAddr, purpose: "login" });
      setOtpInfo("A verification code has been sent to your email.");
    } catch (err: any) {
      setOtpError(err?.message ?? "Failed to send verification code.");
      otpSentRef.current = false; // allow retry
    }
  }

  async function handleVerifyOTP(e: FormEvent) {
    e.preventDefault();
    if (!me?.email) return;
    setOtpLoading(true);
    setOtpError(null);
    try {
      const result = await verifyOTP({
        email: me.email.toLowerCase(),
        code: otpCode.trim(),
        purpose: "login",
      });
      if (result.ok) {
        const now = Date.now();
        sessionStorage.setItem(
          "otp_verified",
          JSON.stringify({ email: me.email.toLowerCase(), verifiedAt: now })
        );
        setVerifiedAt(now);
        setOtpVerified(true);
      } else {
        setOtpError(result.error ?? "Invalid code.");
      }
    } catch (err: any) {
      setOtpError(err?.message ?? "Verification failed.");
    } finally {
      setOtpLoading(false);
    }
  }

  if (me === undefined) return <LoadingScreen />;
  if (!me.admin) return <NotInvited email={me.email ?? ""} />;
  if (!me.admin.active) return <RevokedAccess email={me.email ?? ""} />;
  if (requireSuperadmin && me.admin.role !== "superadmin") {
    return <NotSuperadmin email={me.email ?? ""} role={me.admin.role} />;
  }
  void panelLabel;

  // ── OTP gate ──────────────────────────────────────────────────────────────
  if (!otpVerified) {
    return (
      <div className="relative min-h-screen w-full bg-[linear-gradient(180deg,#F4EFE6_0%,#E9E1D2_100%)] flex items-center justify-center px-4 overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-amber-300/30 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full bg-emerald-300/20 blur-[120px]" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full max-w-md"
        >
          <div className="relative rounded-[2rem] border border-white/55 bg-white/65 backdrop-blur-2xl shadow-[0_30px_80px_rgba(20,20,20,0.12)] overflow-hidden p-8 sm:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0)_30%)]" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-natural-accent/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-natural-accent" />
                </div>
                <div>
                  <p className="font-bold text-stone-900">Identity Verification</p>
                  <p className="text-xs text-stone-500">
                    Code sent to <span className="font-semibold">{me.email}</span>
                  </p>
                </div>
              </div>

              {otpInfo && (
                <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-xl bg-emerald-100/70 border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                  <p className="text-xs text-emerald-800">{otpInfo}</p>
                </div>
              )}

              <form onSubmit={handleVerifyOTP} className="space-y-3">
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

                {otpError && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-rose-100/70 border border-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-rose-700">{otpError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otpLoading || otpCode.length < 6}
                  className="w-full inline-flex items-center justify-center gap-2 bg-natural-accent text-white font-bold text-sm px-4 py-3 rounded-xl shadow-[0_14px_32px_rgba(90,90,64,0.35)] hover:brightness-110 active:scale-[0.98] transition disabled:opacity-60"
                >
                  {otpLoading ? "Verifying…" : "Verify & enter"}
                  {!otpLoading && <ShieldCheck className="w-4 h-4" />}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-stone-200/60 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={otpLoading}
                  onClick={() => { otpSentRef.current = false; sendOTP(me.email!.toLowerCase()); setOtpCode(""); }}
                  className="w-full text-xs text-stone-500 hover:text-stone-900 transition inline-flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resend code
                </button>
                <SignOutButton />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Dashboard (OTP verified) ──────────────────────────────────────────────
  return (
    <CmsVerifyProvider email={me.email ?? ""} initialVerifiedAt={verifiedAt}>
      {children(me)}
    </CmsVerifyProvider>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────
function SignOutButton() {
  const { signOut } = useAuthActions();
  return (
    <button
      onClick={() => { sessionStorage.removeItem("otp_verified"); signOut(); }}
      className="w-full text-xs text-stone-400 hover:text-stone-700 transition inline-flex items-center justify-center gap-1.5"
    >
      <LogOut className="w-3 h-3" /> Sign out
    </button>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(180deg,#F4EFE6_0%,#E9E1D2_100%)]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-stone-500 text-sm font-medium"
      >
        Loading…
      </motion.div>
    </div>
  );
}

function StatusCard({ icon, title, body, email }: { icon: ReactNode; title: string; body: string; email: string }) {
  const { signOut } = useAuthActions();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(180deg,#F4EFE6_0%,#E9E1D2_100%)] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-md w-full rounded-3xl border border-white/55 bg-white/65 backdrop-blur-2xl shadow-[0_30px_80px_rgba(20,20,20,0.12)] p-8 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
        <h2 className="font-serif text-2xl font-bold text-stone-900">{title}</h2>
        <p className="text-sm text-stone-500 mt-2">{body}</p>
        {email && (
          <p className="text-[11px] font-mono text-stone-400 mt-3 break-all">{email}</p>
        )}
        <button
          onClick={() => signOut()}
          className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-natural-accent hover:underline"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </motion.div>
    </div>
  );
}

function NotInvited({ email }: { email: string }) {
  return (
    <StatusCard
      icon={<Lock className="w-6 h-6" />}
      title="Access not granted"
      body="Your account is authenticated, but you haven't been invited to the admin panel. Ask a superadmin to invite you."
      email={email}
    />
  );
}

function RevokedAccess({ email }: { email: string }) {
  return (
    <StatusCard
      icon={<Lock className="w-6 h-6" />}
      title="Access revoked"
      body="Your admin access has been turned off. Contact a superadmin to restore it."
      email={email}
    />
  );
}

function NotSuperadmin({ email, role }: { email: string; role: string }) {
  return (
    <StatusCard
      icon={<Lock className="w-6 h-6" />}
      title="Superadmin only"
      body={\`This area is restricted to superadmins. Your current role is "\${role}".\`}
      email={email}
    />
  );
}
`;

fs.writeFileSync(gateFile, gateContent, "utf8");
console.log("✅ AdminAuthGate.tsx rewritten with OTP gate + CmsVerifyProvider");
