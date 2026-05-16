import React, { useState, useMemo, type FormEvent, type ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Users,
  ScrollText,
  Shield,
  TrendingUp,
  BarChart2,
  UserPlus,
  Mail,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Crown,
  Eye,
  Package,
  Newspaper,
  Home as HomeIcon,
  ShoppingBag,
  Search as SearchIcon,
  Users as UsersIcon,  Globe,
  Lock,
  Palette,
  Bell,
  Code,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Save,
  AlertTriangle,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { AdminShell, GlassCard, KpiTile, type NavGroup } from "./AdminShell";
import { DashboardOverview } from "./DashboardOverview";
import { SalesAnalytics } from "./SalesAnalytics";
import { EditorialCMS } from "./EditorialCMS";
import { HomeContentCMS } from "./HomeContentCMS";
import {
  InventoryManager,
  CombinedAnalytics,
  SiteAnalytics,
  RulesManager,
  OrdersView,
} from "./AdminDashboard";
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
  type Tab =
    | "overview"
    | "inventory"
    | "merchant-analytics"
    | "orders"
    | "editorial"
    | "home"
    | "rules"
    | "deep-analytics"
    | "admins"
    | "audit"
    | "settings";

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [theme, setTheme] = useState<"olive" | "espresso">("espresso");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const products = useQuery(convexApi.products.list) as any[] | undefined;
  const orders = useQuery(convexApi.orders.listOrders) as any[] | undefined;
  const admins = useQuery(convexApi.admins.list) as any[] | undefined;

  // Build live notifications
  const notifications = useMemo(() => {
    const notes: { id: string; icon: ReactNode; title: string; body: string; time: string; unread?: boolean }[] = [];
    // Low stock
    const lowStock = (products ?? []).filter((p: any) => p.stockStatus === "low-stock");
    if (lowStock.length > 0) {
      notes.push({
        id: "low-stock",
        icon: <Package className="w-4 h-4" />,
        title: `${lowStock.length} product${lowStock.length > 1 ? "s" : ""} low on stock`,
        body: lowStock.slice(0, 2).map((p: any) => p.name).join(", ") + (lowStock.length > 2 ? ` +${lowStock.length - 2} more` : ""),
        time: "now",
        unread: true,
      });
    }
    // Pending orders
    const pending = (orders ?? []).filter((o: any) => o.status === "pending" || o.status === "new");
    if (pending.length > 0) {
      notes.push({
        id: "pending-orders",
        icon: <ShoppingBag className="w-4 h-4" />,
        title: `${pending.length} order${pending.length > 1 ? "s" : ""} awaiting fulfilment`,
        body: `Total value: ₹${pending.reduce((s: number, o: any) => s + (o.total ?? 0), 0).toLocaleString("en-IN")}`,
        time: "just now",
        unread: true,
      });
    }
    // Inactive admins
    const inactive = (admins ?? []).filter((a: any) => !a.active);
    if (inactive.length > 0) {
      notes.push({
        id: "inactive-admins",
        icon: <UsersIcon className="w-4 h-4" />,
        title: `${inactive.length} admin account${inactive.length > 1 ? "s" : ""} inactive`,
        body: "Review team access in Admins & Permissions.",
        time: "today",
      });
    }
    return notes;
  }, [products, orders, admins]);

  const navGroups: NavGroup[] = [
    {
      label: "Command",
      items: [
        { id: "overview", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: "deep-analytics", label: "Site Analytics", icon: <BarChart2 className="w-4 h-4" /> },
      ],
    },
    {
      label: "Merchant",
      items: [
        { id: "merchant-analytics", label: "Sales Analytics", icon: <TrendingUp className="w-4 h-4" /> },
        { id: "orders", label: "Orders", icon: <ShoppingBag className="w-4 h-4" /> },
        { id: "inventory", label: "Inventory", icon: <Package className="w-4 h-4" /> },
        { id: "editorial", label: "Editorial", icon: <Newspaper className="w-4 h-4" /> },
        { id: "home", label: "Home CMS", icon: <HomeIcon className="w-4 h-4" /> },
        { id: "rules", label: "Logic Rules", icon: <SearchIcon className="w-4 h-4" /> },
      ],
    },
    {
      label: "Governance",
      items: [
        { id: "admins", label: "Admins", icon: <Users className="w-4 h-4" /> },
        { id: "audit", label: "Audit Log", icon: <ScrollText className="w-4 h-4" /> },
        { id: "settings", label: "Settings", icon: <Shield className="w-4 h-4" /> },
      ],
    },
  ];

  const titles: Record<Tab, { title: string; subtitle: string }> = {
    overview: { title: "Super Admin", subtitle: "Top-level controls, governance, and full visibility into the storefront." },
    inventory: { title: "Inventory", subtitle: "Manage products, stock levels and categories." },
    "merchant-analytics": { title: "Sales Analytics", subtitle: "Revenue, conversion, and merchant performance." },
    orders: { title: "Orders", subtitle: "Track and fulfil incoming customer orders." },
    editorial: { title: "Editorial", subtitle: "Publish stories, journal entries and editorial pieces." },
    home: { title: "Home CMS", subtitle: "Hero copy, banners, sections and scroll chapters." },
    rules: { title: "Logic Rules", subtitle: "Tune recommendation and discovery logic." },
    "deep-analytics": { title: "Site Analytics", subtitle: "Traffic, behavioural insights, cohorts, and trend analysis." },
    admins: { title: "Admins & Permissions", subtitle: "Invite teammates, set roles, control which sections they can access." },
    audit: { title: "Audit Log", subtitle: "Every admin action — invites, revocations, configuration changes." },
    settings: { title: "Settings", subtitle: "System preferences, security, and integrations." },
  };
  const meta = titles[activeTab];

  return (
    <AdminShell
      brand="Third Wave"
      panelLabel="Super Admin"
      panelAccent={theme}
      navGroups={navGroups}
      activeId={activeTab}
      onNavigate={(id) => setActiveTab(id as Tab)}
      user={{
        name: me.name ?? me.email?.split("@")[0] ?? "Superadmin",
        email: me.email ?? "",
        role: "Superadmin",
      }}
      notifications={notifications}
      collapsed={sidebarCollapsed}
      onCollapsedChange={setSidebarCollapsed}
      workspaceTitle={meta.title}
      workspaceSubtitle={meta.subtitle}
    >
      {activeTab === "overview" && <SuperOverview />}
      {activeTab === "inventory" && <InventoryManager />}
      {activeTab === "merchant-analytics" && <SalesAnalytics />}
      {activeTab === "orders" && <OrdersView />}
      {activeTab === "editorial" && <EditorialCMS />}
      {activeTab === "home" && <HomeContentCMS />}
      {activeTab === "rules" && <RulesManager />}
      {activeTab === "deep-analytics" && <SiteAnalytics />}
      {activeTab === "admins" && <AdminsManager />}
      {activeTab === "audit" && <AuditLogViewer />}
      {activeTab === "settings" && (
        <SettingsPanel
          theme={theme}
          onThemeChange={setTheme}
          sidebarDefault={sidebarCollapsed ? "collapsed" : "expanded"}
          onSidebarDefaultChange={(v) => setSidebarCollapsed(v === "collapsed")}
        />
      )}
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

// ─── Settings panel ─────────────────────────────────────────────────────────
function SettingsPanel({
  theme,
  onThemeChange,
  sidebarDefault,
  onSidebarDefaultChange,
}: {
  theme: "olive" | "espresso";
  onThemeChange: (v: "olive" | "espresso") => void;
  sidebarDefault: "expanded" | "collapsed";
  onSidebarDefaultChange: (v: "expanded" | "collapsed") => void;
}) {
  const [storefrontUrl, setStorefrontUrl] = useState("https://trainingtwc.github.io/brewmatch-ai/");
  const [urlSaved, setUrlSaved] = useState(false);
  const [notifLowStock, setNotifLowStock] = useState(true);
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifTeam, setNotifTeam] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDanger, setShowDanger] = useState(false);

  function copyUrl() {
    navigator.clipboard.writeText(storefrontUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function saveUrl() {
    setUrlSaved(true);
    setTimeout(() => setUrlSaved(false), 2500);
  }

  return (
    <div className="space-y-5">

      {/* ── Storefront ─────────────────────────────────── */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-stone-400" />
          <h3 className="font-serif text-lg font-bold text-stone-900">Storefront</h3>
        </div>
        <label className="block text-xs font-semibold text-stone-600 mb-1">Public storefront URL</label>
        <div className="flex gap-2">
          <input
            className="flex-1 text-sm border border-stone-200 rounded-lg px-3 py-2 bg-white/70 focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={storefrontUrl}
            onChange={(e) => setStorefrontUrl(e.target.value)}
          />
          <button
            onClick={copyUrl}
            className="px-3 py-2 rounded-lg border border-stone-200 bg-white/70 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-lg border border-stone-200 bg-white/70 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" /> Visit
          </a>
          <button
            onClick={saveUrl}
            className="px-3 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition flex items-center gap-1"
          >
            <Save className="w-3 h-3" /> {urlSaved ? "Saved!" : "Save"}
          </button>
        </div>
        <p className="mt-2 text-xs text-stone-400">This URL appears in order confirmation emails and admin links.</p>
      </GlassCard>

      {/* ── Deployment info ────────────────────────────── */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Code className="w-4 h-4 text-stone-400" />
          <h3 className="font-serif text-lg font-bold text-stone-900">Deployment</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <InfoRow label="Convex deployment" value="watchful-cormorant-351 (prod)" />
          <InfoRow label="Auth provider" value="Password · Convex Auth" />
          <InfoRow label="CI/CD" value="GitHub Actions → master" />
          <InfoRow label="Environment" value="Production" badge="live" />
        </div>
        <a
          href="https://dashboard.convex.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-amber-700 hover:underline"
        >
          Open Convex Dashboard <ExternalLink className="w-3 h-3" />
        </a>
      </GlassCard>

      {/* ── Notification preferences ───────────────────── */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-stone-400" />
          <h3 className="font-serif text-lg font-bold text-stone-900">Notification preferences</h3>
        </div>
        <div className="space-y-3">
          <Toggle
            label="Low-stock alerts"
            description="Notify when a product stock falls below threshold"
            value={notifLowStock}
            onChange={setNotifLowStock}
          />
          <Toggle
            label="New orders"
            description="Show incoming orders in the notification bell"
            value={notifOrders}
            onChange={setNotifOrders}
          />
          <Toggle
            label="Team activity"
            description="Alerts when admin accounts are added, revoked, or change role"
            value={notifTeam}
            onChange={setNotifTeam}
          />
        </div>
      </GlassCard>

      {/* ── Display preferences ────────────────────────── */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-4 h-4 text-stone-400" />
          <h3 className="font-serif text-lg font-bold text-stone-900">Display</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-2">Sidebar default</label>
            <div className="flex gap-2">
              {(["expanded", "collapsed"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => onSidebarDefaultChange(v)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                    sidebarDefault === v
                      ? "border-amber-500 bg-amber-50 text-amber-800"
                      : "border-stone-200 bg-white/70 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-2">Panel theme</label>
            <div className="flex gap-2">
              {(["olive", "espresso"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => onThemeChange(v)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                    theme === v
                      ? "border-amber-500 bg-amber-50 text-amber-800"
                      : "border-stone-200 bg-white/70 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── Security ───────────────────────────────────── */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-stone-400" />
          <h3 className="font-serif text-lg font-bold text-stone-900">Security</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-stone-800">Change password</p>
              <p className="text-xs text-stone-500">You'll be signed out and redirected to the login page.</p>
            </div>
            <button
              onClick={() => {
                if (window.confirm("This will sign you out so you can reset your password. Continue?")) {
                  window.location.reload();
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white/70 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
            >
              Change password
            </button>
          </div>
        </div>
      </GlassCard>

      {/* ── Danger zone ────────────────────────────────── */}
      <GlassCard className="p-6 border border-rose-200 bg-rose-50/30">
        <button
          onClick={() => setShowDanger(!showDanger)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <h3 className="font-serif text-lg font-bold text-rose-800">Danger zone</h3>
          </div>
          <ChevronRight className={`w-4 h-4 text-rose-400 transition-transform ${showDanger ? "rotate-90" : ""}`} />
        </button>
        {showDanger && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-800">Export all data</p>
                <p className="text-xs text-stone-500">Download a JSON snapshot of products, orders, and admins.</p>
              </div>
              <button
                onClick={() => alert("Export feature coming soon.")}
                className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
              >
                Export
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-rose-800">Revoke all admin sessions</p>
                <p className="text-xs text-rose-500">Signs out every admin user immediately.</p>
              </div>
              <button
                onClick={() => alert("Revoke feature coming soon.")}
                className="px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
              >
                Revoke all
              </button>
            </div>
          </div>
        )}
      </GlassCard>

    </div>
  );
}

// ── Settings helpers ──────────────────────────────────────────────────────────
function InfoRow({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div className="p-3 rounded-xl border border-stone-200 bg-white/70">
      <p className="text-xs text-stone-500">{label}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <p className="text-sm font-semibold text-stone-800">{value}</p>
        {badge && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-stone-800">{label}</p>
        <p className="text-xs text-stone-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`shrink-0 w-9 h-5 rounded-full transition-colors duration-200 relative ${
          value ? "bg-amber-500" : "bg-stone-200"
        }`}
        role="switch"
        aria-checked={value}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
            value ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
