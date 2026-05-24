"use client";
/**
 * CmsVerifyContext — provides OTP re-verification for CMS save operations.
 *
 * Usage in any CMS component:
 *   const { ensureVerified } = useCmsVerify();
 *   async function handleSave() {
 *     await ensureVerified();  // shows OTP modal if session >30 min old
 *     await saveData(...);
 *   }
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useAction, useMutation } from "convex/react";
import { api as convexApi } from "../../../convex/_generated/api";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";

const OTP_SESSION_DURATION_MS = 30 * 60 * 1000; // 30 min

type CmsVerifyCtx = {
  /** Resolves immediately if session still valid; otherwise shows OTP modal and resolves after success. */
  ensureVerified: () => Promise<void>;
  /** Timestamp of the last successful OTP verification (0 = never). */
  lastVerifiedAt: number;
  /** Call after login OTP succeeds to seed the initial verification timestamp. */
  markVerified: () => void;
};

const CmsVerifyContext = createContext<CmsVerifyCtx>({
  ensureVerified: async () => {},
  lastVerifiedAt: 0,
  markVerified: () => {},
});

export function useCmsVerify() {
  return useContext(CmsVerifyContext);
}

export function CmsVerifyProvider({
  email,
  initialVerifiedAt = 0,
  children,
}: {
  email: string;
  initialVerifiedAt?: number;
  children: ReactNode;
}) {
  const requestOTP = useAction((convexApi as any).otp.requestOTP);
  const verifyOTP = useMutation((convexApi as any).otp.verifyOTP);

  const [lastVerifiedAt, setLastVerifiedAt] = useState<number>(initialVerifiedAt);
  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpInfo, setOtpInfo] = useState<string | null>(null);

  // Promise resolver held between ensureVerified() call and modal confirm
  const resolveRef = useRef<(() => void) | null>(null);
  const rejectRef = useRef<((e: Error) => void) | null>(null);

  const markVerified = useCallback(() => {
    setLastVerifiedAt(Date.now());
  }, []);

  const sendCode = useCallback(async () => {
    setSending(true);
    setOtpError(null);
    setOtpInfo(null);
    try {
      await requestOTP({ email, purpose: "cms_action" });
      setOtpInfo("OTP Sent");
    } catch (err: any) {
      setOtpError("Failed");
    } finally {
      setSending(false);
    }
  }, [email, requestOTP]);

  const handleVerify = useCallback(async () => {
    if (!code.trim()) return;
    setVerifying(true);
    setOtpError(null);
    try {
      const result = await verifyOTP({ email, code: code.trim(), purpose: "cms_action" });
      if (result.ok) {
        const now = Date.now();
        setLastVerifiedAt(now);
        setModalOpen(false);
        setCode("");
        setOtpInfo(null);
        resolveRef.current?.();
        resolveRef.current = null;
        rejectRef.current = null;
      } else {
        setOtpError("Failed");
      }
    } catch (err: any) {
      setOtpError("Failed");
    } finally {
      setVerifying(false);
    }
  }, [email, code, verifyOTP]);

  const ensureVerified = useCallback((): Promise<void> => {
    const isValid = lastVerifiedAt > 0 && Date.now() - lastVerifiedAt < OTP_SESSION_DURATION_MS;
    if (isValid) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      resolveRef.current = resolve;
      rejectRef.current = reject;
      setCode("");
      setOtpError(null);
      setOtpInfo(null);
      setModalOpen(true);
      // Auto-send OTP when modal opens
      sendCode();
    });
  }, [lastVerifiedAt, sendCode]);

  return (
    <CmsVerifyContext.Provider value={{ ensureVerified, lastVerifiedAt, markVerified }}>
      {children}

      {/* Re-verification modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-2xl border border-white/60 shadow-2xl p-7"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-natural-accent/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-natural-accent" />
                </div>
                <div>
                  <p className="font-bold text-stone-900 text-sm">Re-verification required</p>
                  <p className="text-xs text-stone-500">Your session has expired. Enter the code sent to your email.</p>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  placeholder="6-digit code"
                  className="w-full text-center text-2xl font-bold tracking-[0.35em] py-3 rounded-xl bg-stone-50 border border-stone-200 outline-none focus:ring-2 ring-natural-accent/30 placeholder:text-stone-300 placeholder:tracking-normal placeholder:text-base placeholder:font-normal"
                />

                {otpError && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-rose-700">{otpError}</p>
                  </div>
                )}
                {otpInfo && (
                  <p className="text-xs text-emerald-700 text-center">{otpInfo}</p>
                )}

                <button
                  onClick={handleVerify}
                  disabled={verifying || code.length < 6}
                  className="w-full py-2.5 rounded-xl bg-natural-accent text-white font-bold text-sm disabled:opacity-50 hover:brightness-110 transition"
                >
                  {verifying ? "Verifying…" : "Verify & continue"}
                </button>

                <button
                  onClick={sendCode}
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition"
                >
                  <RefreshCw className={`w-3 h-3 ${sending ? "animate-spin" : ""}`} />
                  {sending ? "Sending…" : "Resend code"}
                </button>
              </div>

              <button
                onClick={() => {
                  setModalOpen(false);
                  rejectRef.current?.(new Error("Verification cancelled."));
                  resolveRef.current = null;
                  rejectRef.current = null;
                }}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 text-lg leading-none transition"
                aria-label="Cancel"
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </CmsVerifyContext.Provider>
  );
}
