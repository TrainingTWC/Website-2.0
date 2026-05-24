import { useEffect, type ReactNode } from "react";
import { Authenticated, Unauthenticated, AuthLoading, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { motion } from "motion/react";
import { Lock, LogOut } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { AdminLogin } from "./AdminLogin";

const convexApi = api as any;

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

/**
 * Wraps an admin panel: shows login if unauthenticated, runs the bootstrap
 * mutation after sign-in, blocks access if the user isn't an active admin,
 * and (optionally) gates on superadmin role.
 */
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

function AuthenticatedShell({
  panelLabel,
  requireSuperadmin,
  children,
}: {
  panelLabel: string;
  requireSuperadmin?: boolean;
  children: (me: AdminMe) => ReactNode;
}) {
  const bootstrap = useMutation(convexApi.admins.bootstrap);
  const me = useQuery(convexApi.admins.me) as AdminMe | undefined;

  // Run bootstrap once on mount — establishes admin row for the seed
  // superadmin and stamps lastSeenAt for everyone else.
  useEffect(() => {
    bootstrap().catch(() => {});
  }, [bootstrap]);

  if (me === undefined) return <LoadingScreen />;

  // Authenticated user but no admin record (and bootstrap didn't promote them)
  if (!me.admin) return <NotInvited email={me.email ?? ""} />;
  if (!me.admin.active) return <RevokedAccess email={me.email ?? ""} />;
  if (requireSuperadmin && me.admin.role !== "superadmin") {
    return <NotSuperadmin email={me.email ?? ""} role={me.admin.role} />;
  }
  // Touched-by-prop usage to silence unused warning when label not needed here
  void panelLabel;
  return <>{children(me)}</>;
}

// ─── States ────────────────────────────────────────────────────────────────
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
      body={`This area is restricted to superadmins. Your current role is "${role}".`}
      email={email}
    />
  );
}
