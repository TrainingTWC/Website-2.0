import { useState, type FormEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Users,
  ScrollText,
  Shield,
  TrendingUp,
  UserPlus,
  Mail,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Crown,
  Eye,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { AdminShell, GlassCard, KpiTile, type NavGroup } from "./AdminShell";
import { DashboardOverview } from "./DashboardOverview";
import { SalesAnalytics } from "./SalesAnalytics";
import type { AdminMe } from "./AdminAuthGate";

const convexApi = api as any;

type Role = "superadmin" | "admin" | "editor" | "viewer";
type Perms = {
  overview: boolean;
  inventory: boolean;
  orders: boolean;
  analytics: boolean;
  editorial: boolean;
  home: boolean;
  rules: boolean;
  customers: boolean;
  settings: boolean;
};

const ROLE_META: Record<Role, { label: string; icon: any; tone: string }> = {
  superadmin: { label: "Superadmin", icon: Crown, tone: "bg-amber-100 text-amber-700 border-amber-200" },
  admin: { label: "Admin", icon: ShieldCheck, tone: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  editor: { label: "Editor", icon: ScrollText, tone: "bg-sky-100 text-sky-700 border-sky-200" },
  viewer: { label: "Viewer", icon: Eye, tone: "bg-stone-100 text-stone-700 border-stone-200" },
};

export function SuperAdminDashboard({ me }: { me: AdminMe }) {
  const [activeTab, setActiveTab] = useState<"overview" | "admins" | "audit" | "analytics">("overview");

  const navGroups: NavGroup[] = [
    {
      label: "Command",
      items: [
        { id: "overview", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: "analytics", label: "Deep Analytics", icon: <TrendingUp className="w-4 h-4" /> },
      ],
    },
    {
      label: "Governance",
      items: [
        { id: "admins", label: "Admins", icon: <Users className="w-4 h-4" /> },
        { id: "audit", label: "Audit Log", icon: <ScrollText className="w-4 h-4" /> },
      ],
    },
  ];

  const titles: Record<typeof activeTab, { title: string; subtitle: string }> = {
    overview: { title: "Super Admin", subtitle: "Top-level controls, governance, and full visibility into the storefront." },
    admins: { title: "Admins & Permissions", subtitle: "Invite teammates, set roles, control which sections they can access." },
    audit: { title: "Audit Log", subtitle: "Every admin action — invites, revocations, configuration changes." },
    analytics: { title: "Deep Analytics", subtitle: "Sales performance, conversion, and behavioural insights." },
  };
  const meta = titles[activeTab];

  return (
    <AdminShell
      brand="Third Wave"
      panelLabel="Super Admin"
      panelAccent="espresso"
      navGroups={navGroups}
      activeId={activeTab}
      onNavigate={(id) => setActiveTab(id as typeof activeTab)}
      user={{
        name: me.name ?? "Superadmin",
        email: me.email ?? "",
        role: "Superadmin",
      }}
      workspaceTitle={meta.title}
      workspaceSubtitle={meta.subtitle}
    >
      {activeTab === "overview" && <SuperOverview />}
      {activeTab === "admins" && <AdminsManager />}
      {activeTab === "audit" && <AuditLogViewer />}
      {activeTab === "analytics" && <SalesAnalytics />}
    </AdminShell>
  );
}

// ─── Super overview ─────────────────────────────────────────────────────────
function SuperOverview() {
  const admins = useQuery(convexApi.admins.list) as any[] | undefined;
  const auditLog = useQuery(convexApi.admins.auditList, { limit: 8 }) as any[] | undefined;
  const activeAdmins = admins?.filter((a) => a.active).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Total admins" value={String(admins?.length ?? "—")} hint="Across all roles" accent="amber" />
        <KpiTile label="Active" value={String(activeAdmins)} hint="With panel access" accent="emerald" />
        <KpiTile
          label="Superadmins"
          value={String(admins?.filter((a) => a.role === "superadmin").length ?? 0)}
          hint="Full control"
          accent="amber"
        />
        <KpiTile
          label="Recent actions"
          value={String(auditLog?.length ?? 0)}
          hint="Last 8 events"
        />
      </div>

      <DashboardOverview />

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Latest governance events</p>
            <p className="text-lg font-bold text-stone-900">Audit trail</p>
          </div>
        </div>
        <div className="space-y-1.5">
          {(auditLog ?? []).slice(0, 6).map((row) => (
            <AuditRow key={row._id} row={row} />
          ))}
          {(!auditLog || auditLog.length === 0) && (
            <p className="text-sm text-stone-400 text-center py-6">No audit events yet.</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Admins manager ─────────────────────────────────────────────────────────
function AdminsManager() {
  const admins = useQuery(convexApi.admins.list) as any[] | undefined;
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-600">
          {admins?.length ?? 0} admin{(admins?.length ?? 0) === 1 ? "" : "s"} ·{" "}
          {admins?.filter((a) => a.active).length ?? 0} active
        </p>
        <button
          onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-1.5 bg-natural-accent text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-[0_10px_24px_rgba(90,90,64,0.35)] hover:brightness-110 transition"
        >
          <UserPlus className="w-3.5 h-3.5" /> Invite admin
        </button>
      </div>

      <div className="space-y-3">
        {(admins ?? []).map((a) => (
          <AdminRow key={a._id} admin={a} />
        ))}
        {admins?.length === 0 && (
          <GlassCard className="p-10 text-center">
            <Users className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-sm text-stone-500 mt-2">No admins yet. Invite your first teammate.</p>
          </GlassCard>
        )}
      </div>

      <AnimatePresence>
        {showInvite && <InviteAdminModal onClose={() => setShowInvite(false)} />}
      </AnimatePresence>
    </div>
  );
}

function AdminRow({ admin }: { admin: any }) {
  const update = useMutation(convexApi.admins.update);
  const revoke = useMutation(convexApi.admins.revoke);
  const [open, setOpen] = useState(false);
  const RoleIcon = ROLE_META[admin.role as Role].icon;

  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-natural-accent text-white flex items-center justify-center font-bold">
          {(admin.name ?? admin.email).slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-stone-900 truncate">{admin.name ?? admin.email}</p>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full border ${
                ROLE_META[admin.role as Role].tone
              }`}
            >
              <RoleIcon className="w-3 h-3" />
              {ROLE_META[admin.role as Role].label}
            </span>
            {!admin.active && (
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                Revoked
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 truncate mt-0.5">{admin.email}</p>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
          <Clock className="w-3 h-3" />
          Invited {new Date(admin.invitedAt).toLocaleDateString()}
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="w-9 h-9 rounded-xl hover:bg-white/70 flex items-center justify-center text-stone-500"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/70 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Role selector */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500 mb-2">Role</p>
                <div className="flex flex-wrap gap-1.5">
                  {(["admin", "editor", "viewer"] as Role[]).map((r) => (
                    <button
                      key={r}
                      disabled={admin.role === "superadmin"}
                      onClick={() => update({ id: admin._id, role: r })}
                      className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition ${
                        admin.role === r
                          ? "bg-natural-accent text-white border-natural-accent"
                          : "bg-white/70 text-stone-700 border-white/70 hover:border-natural-accent/30"
                      } disabled:opacity-50`}
                    >
                      {ROLE_META[r].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500 mb-2">Section access</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.entries(admin.permissions as Perms).map(([k, v]) => (
                    <button
                      key={k}
                      disabled={admin.role === "superadmin"}
                      onClick={() =>
                        update({
                          id: admin._id,
                          permissions: { ...admin.permissions, [k]: !v },
                        })
                      }
                      className={`text-[11px] font-bold px-2 py-1.5 rounded-lg border transition flex items-center gap-1 ${
                        v
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-stone-100 text-stone-500 border-stone-200"
                      } disabled:opacity-50`}
                    >
                      {v ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2">
                {admin.role !== "superadmin" && admin.active && (
                  <button
                    onClick={() => {
                      if (confirm(`Revoke access for ${admin.email}?`)) revoke({ id: admin._id });
                    }}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 transition"
                  >
                    Revoke access
                  </button>
                )}
                {admin.role !== "superadmin" && !admin.active && (
                  <button
                    onClick={() => update({ id: admin._id, active: true })}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
                  >
                    Reinstate
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

function InviteAdminModal({ onClose }: { onClose: () => void }) {
  const invite = useMutation(convexApi.admins.invite);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("admin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await invite({ email: email.trim().toLowerCase(), role });
      onClose();
    } catch (err: any) {
      setError(err?.data?.message ?? err?.message ?? "Failed to invite.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md rounded-3xl border border-white/55 bg-white/85 backdrop-blur-2xl shadow-[0_30px_80px_rgba(20,20,20,0.2)] p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-natural-accent text-white flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Grant access</p>
            <p className="text-base font-bold text-stone-900">Invite an admin</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@thirdwavecoffee.in"
              className="w-full pl-10 pr-3 py-3 rounded-xl bg-white border border-stone-200 text-sm placeholder:text-stone-400 outline-none focus:ring-2 ring-natural-accent/25"
            />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500 mb-2">Role</p>
            <div className="grid grid-cols-3 gap-2">
              {(["admin", "editor", "viewer"] as const).map((r) => {
                const Meta = ROLE_META[r];
                const Icon = Meta.icon;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`p-3 rounded-xl border text-left transition ${
                      role === r
                        ? "bg-natural-accent text-white border-natural-accent shadow-[0_10px_24px_rgba(90,90,64,0.3)]"
                        : "bg-white border-stone-200 text-stone-700 hover:border-natural-accent/30"
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <p className="text-xs font-bold">{Meta.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-stone-500 leading-relaxed">
            The user must first create an account at the sign-in screen using the same email. Then this invite will activate their admin access.
          </p>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm font-bold px-3 py-2.5 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 text-sm font-bold px-3 py-2.5 rounded-xl bg-natural-accent text-white hover:brightness-110 transition disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send invite"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Audit log viewer ───────────────────────────────────────────────────────
function AuditLogViewer() {
  const rows = useQuery(convexApi.admins.auditList, { limit: 200 }) as any[] | undefined;
  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-natural-accent" />
        <p className="text-sm font-bold text-stone-900">Recent activity</p>
        <span className="ml-auto text-[11px] text-stone-500">
          {rows?.length ?? 0} event{rows?.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
        {(rows ?? []).map((r) => (
          <AuditRow key={r._id} row={r} />
        ))}
        {rows?.length === 0 && (
          <p className="text-sm text-stone-400 text-center py-10">No audit events yet.</p>
        )}
      </div>
    </GlassCard>
  );
}

function AuditRow({ row }: { row: any }) {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-white/55 border border-white/55">
      <div className="w-8 h-8 rounded-lg bg-natural-accent/15 text-natural-accent flex items-center justify-center shrink-0">
        <Shield className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-stone-800">
          {row.action} <span className="text-stone-400 font-normal">·</span>{" "}
          <span className="text-xs font-normal text-stone-500">{row.adminEmail}</span>
        </p>
        {row.metadata && (
          <p className="text-[11px] text-stone-500 font-mono truncate">{row.metadata}</p>
        )}
      </div>
      <span className="text-[10px] text-stone-400 font-mono shrink-0">
        {new Date(row.timestamp).toLocaleString()}
      </span>
    </div>
  );
}
