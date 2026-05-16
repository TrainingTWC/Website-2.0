import { useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api as convexApi } from "../../../convex/_generated/api";
import { motion } from "motion/react";
import { Coffee, Lock, Mail, ArrowRight, AlertCircle, KeyRound } from "lucide-react";
import { asset } from "../../lib/asset";

/**
 * Glass auth screen for the admin panels. Defaults to sign-in. Includes a
 * "Reset & set new password" path that wipes the existing auth rows for
 * the given email and immediately registers a fresh account — so a locked
 * out superadmin can recover without using the Convex dashboard.
 */
export function AdminLogin({ panelLabel = "Merchant" }: { panelLabel?: string }) {
  const { signIn } = useAuthActions();
  const purgeEmail = useMutation(convexApi.authAdmin.purgeEmail);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);

  async function trySignIn() {
    const fd = new FormData();
    fd.set("email", email.trim().toLowerCase());
    fd.set("password", password);
    fd.set("flow", "signIn");
    await signIn("password", fd);
  }

  async function trySignUp() {
    const fd = new FormData();
    fd.set("email", email.trim().toLowerCase());
    fd.set("password", password);
    fd.set("flow", "signUp");
    if (name) fd.set("name", name);
    await signIn("password", fd);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await trySignIn();
    } catch {
      try {
        await trySignUp();
      } catch {
        setError(
          "Couldn't sign in or create the account. If you forgot the password, use 'Reset & set new password' below."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function resetAndCreate() {
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) {
      setError("Enter the email and a new password first.");
      return;
    }
    setLoading(true);
    try {
      const result = await purgeEmail({ email: email.trim().toLowerCase() });
      setInfo(`Cleared ${result.removed.authAccounts} old auth row(s). Creating fresh account…`);
      await trySignUp();
    } catch (err: any) {
      setError(err?.message ?? "Reset failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

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
            <div className="flex items-center gap-3 mb-7">
              <div className="w-12 h-12 rounded-2xl bg-natural-accent text-white flex items-center justify-center shadow-[0_10px_24px_rgba(90,90,64,0.35)]">
                <img src={asset("logo.png")} alt="" className="w-8 h-8 object-contain invert" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">{panelLabel} access</p>
                <p className="text-lg font-bold text-stone-900 leading-tight">Third Wave Coffee</p>
              </div>
            </div>

            <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
              Sign in to your panel.
            </h1>
            <p className="text-sm text-stone-500 mt-1.5">
              Enter your email and password. New accounts are created on first sign-in.
            </p>

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
                  <KeyRound className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                  <p className="text-xs text-emerald-800">{info}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-natural-accent text-white font-bold text-sm px-4 py-3 rounded-xl shadow-[0_14px_32px_rgba(90,90,64,0.35)] hover:brightness-110 active:scale-[0.98] transition disabled:opacity-60"
              >
                {loading ? "Working…" : "Sign in"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-stone-200/60">
              {!showReset ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowReset(true);
                    setError(null);
                    setInfo(null);
                  }}
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
                      onClick={() => resetAndCreate()}
                      disabled={loading}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition disabled:opacity-60"
                    >
                      {loading ? "Resetting…" : "Reset & create"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-stone-500 mt-5 font-medium">
          Access is granted by invitation. Contact your superadmin if you can't sign in.
        </p>
      </motion.div>
    </div>
  );
}
