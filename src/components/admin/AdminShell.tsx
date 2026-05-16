import { useState, useMemo, useRef, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  Search,
  Bell,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
  Sparkles,
  X,
} from "lucide-react";
import { asset } from "../../lib/asset";

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: string | number;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export interface AdminShellProps {
  brand: string;
  panelLabel: string;
  panelAccent?: "olive" | "espresso";
  navGroups: NavGroup[];
  activeId: string;
  onNavigate: (id: string) => void;
  user?: { name: string; email: string; role?: string };
  notifications?: { id: string; icon: ReactNode; title: string; body: string; time: string; unread?: boolean }[];
  workspaceTitle: string;
  workspaceSubtitle?: string;
  workspaceActions?: ReactNode;
  /** Controlled collapsed state. If omitted, AdminShell manages it internally. */
  collapsed?: boolean;
  onCollapsedChange?: (v: boolean) => void;
  children: ReactNode;
}

/**
 * Premium glassmorphism admin shell — sidebar + topbar + content surface.
 * Inspired by the ACRU finance dashboard reference, but in our brand palette
 * (olive `#5A5A40`, paper, stone, gold).
 *
 * Layers (back→front) for true Apple-style depth:
 *   1. base bg + radial highlights
 *   2. blurred orbs (color halos)
 *   3. glass panels (border-white/55 + bg-white/65 + backdrop-blur-xl)
 *   4. inner light gradients
 *   5. crisp content
 */
export function AdminShell({
  brand,
  panelLabel,
  panelAccent = "olive",
  navGroups,
  activeId,
  onNavigate,
  user,
  notifications = [],
  workspaceTitle,
  workspaceSubtitle,
  workspaceActions,
  collapsed: collapsedProp,
  onCollapsedChange,
  children,
}: AdminShellProps) {
  const [collapsedInternal, setCollapsedInternal] = useState(false);
  const collapsed = collapsedProp !== undefined ? collapsedProp : collapsedInternal;
  function setCollapsed(v: boolean) {
    setCollapsedInternal(v);
    onCollapsedChange?.(v);
  }
  const [query, setQuery] = useState("");
  const [openPopover, setOpenPopover] = useState<null | "bell" | "settings" | "add" | "search">(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const { signOut } = useAuthActions();

  // Close popovers on outside click / Esc
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(e.target as Node)) setOpenPopover(null);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenPopover(null);
    }
    if (openPopover) {
      window.addEventListener("mousedown", handleClick);
      window.addEventListener("keydown", handleKey);
    }
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [openPopover]);

  // Flat list of nav items for global search
  const flatNav = useMemo(
    () => navGroups.flatMap((g) => g.items.map((it) => ({ ...it, group: g.label }))),
    [navGroups]
  );
  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return flatNav
      .filter((it) => it.label.toLowerCase().includes(q) || (it.group ?? "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [flatNav, query]);

  const accentBg = panelAccent === "espresso" ? "bg-[#3a2418]" : "bg-natural-accent";
  const orbA = panelAccent === "espresso" ? "bg-amber-400/25" : "bg-amber-300/30";
  const orbB = panelAccent === "espresso" ? "bg-rose-300/15" : "bg-emerald-300/20";

  return (
    <div className="relative min-h-screen w-full bg-[linear-gradient(180deg,#F4EFE6_0%,#E9E1D2_100%)] text-stone-800 overflow-hidden">
      {/* ── Atmospheric color orbs (the "depth" of the reference) ─────────── */}
      <div className={`pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-[120px] ${orbA}`} />
      <div className={`pointer-events-none absolute top-1/3 -right-40 w-[480px] h-[480px] rounded-full blur-[120px] ${orbB}`} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.6)_0%,rgba(255,255,255,0)_45%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 flex min-h-screen">
        {/* ───────────────────────────────────────────────────────────────────
            Sidebar (glass)
           ─────────────────────────────────────────────────────────────────── */}
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? 76 : 264 }}
          transition={{ type: "tween", ease: [0.4, 0, 0.2, 1], duration: 0.22 }}
          className="sticky top-0 h-screen p-4 hidden md:flex flex-col"
        >
          <div className="relative flex flex-col h-full rounded-[1.8rem] border border-white/55 bg-white/55 backdrop-blur-2xl shadow-[0_24px_60px_rgba(20,20,20,0.08)] overflow-hidden">
            {/* sidebar inner highlight */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0)_30%)]" />

            {/* Brand */}
            <div className={`relative pt-5 pb-4 flex items-center ${collapsed ? "justify-center" : "px-5 gap-3"}`}>
              <div className={`shrink-0 w-9 h-9 rounded-xl ${accentBg} text-white flex items-center justify-center shadow-[0_8px_18px_rgba(90,90,64,0.35)]`}>
                <img src={asset("logo.png")} alt="" className="w-6 h-6 object-contain invert" />
              </div>
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.div
                    key="brand"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col leading-none"
                  >
                    <span className="text-[15px] font-bold tracking-tight text-stone-900">{brand}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 mt-0.5">{panelLabel}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Nav */}
            <nav className="relative flex-1 overflow-y-auto px-3 py-2 space-y-4">
              {navGroups.map((group, gi) => (
                <div key={gi}>
                  {group.label && !collapsed && (
                    <p className="px-3 mb-1 text-[10px] font-bold tracking-[0.18em] uppercase text-stone-400">{group.label}</p>
                  )}
                  {group.label && collapsed && <div className="mb-1 mx-3 h-px bg-stone-200/70" />}
                  <div className="space-y-0.5">
                    {group.items.map((it) => {
                      const active = it.id === activeId;
                      return (
                        <button
                          key={it.id}
                          onClick={() => onNavigate(it.id)}
                          title={collapsed ? it.label : undefined}
                          className={`group relative w-full flex items-center py-2.5 rounded-xl text-sm font-medium transition-all ${
                            collapsed ? "justify-center px-2" : "gap-3 px-3"
                          } ${
                            active
                              ? "bg-white/85 text-stone-900 shadow-[0_8px_20px_rgba(15,15,15,0.06)] border border-white"
                              : "text-stone-600 hover:text-stone-900 hover:bg-white/55"
                          }`}
                        >
                          {active && (
                            <span className={`absolute ${ collapsed ? "left-0 right-0 bottom-0 h-0.5 w-5 mx-auto rounded-t-full" : "left-0 top-2 bottom-2 w-1 rounded-r-full"} ${accentBg}`} />
                          )}
                          <span className={`shrink-0 ${ active ? "text-stone-900" : "text-stone-500 group-hover:text-stone-700"}`}>{it.icon}</span>
                          <AnimatePresence initial={false}>
                            {!collapsed && (
                              <motion.span
                                key="lbl"
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -4 }}
                                transition={{ duration: 0.12 }}
                                className="flex-1 text-left truncate"
                              >
                                {it.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                          {!collapsed && typeof it.badge !== "undefined" && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              active ? `${accentBg} text-white` : "bg-stone-200 text-stone-600"
                            }`}>
                              {it.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Upgrade / pro card */}
            {!collapsed && (
              <div className="relative mx-3 mb-3 mt-2 rounded-2xl p-4 bg-gradient-to-br from-[#5A5A40] to-[#3a3a28] text-white shadow-[0_18px_36px_rgba(50,50,40,0.35)] overflow-hidden">
                <div className="pointer-events-none absolute -top-8 -right-8 w-28 h-28 rounded-full bg-amber-300/30 blur-2xl" />
                <Shield className="w-5 h-5 mb-2 text-amber-200" />
                <p className="text-sm font-bold leading-tight">Premium controls</p>
                <p className="text-[11px] text-white/70 mt-1 leading-snug">Deeper analytics &amp; admin access lives in Super Admin.</p>
              </div>
            )}

            {/* Collapse toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`relative mx-3 mb-3 flex items-center text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500 hover:text-stone-800 py-2 rounded-xl hover:bg-white/55 transition ${
                collapsed ? "justify-center px-2" : "gap-2 px-3"
              }`}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {!collapsed && "Collapse"}
            </button>
          </div>
        </motion.aside>

        {/* ───────────────────────────────────────────────────────────────────
            Main column
           ─────────────────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col p-4 pl-0 md:pl-2">
          {/* Topbar */}
          <header className="relative rounded-[1.4rem] border border-white/55 bg-white/55 backdrop-blur-2xl shadow-[0_20px_50px_rgba(20,20,20,0.07)] px-4 py-2.5 flex items-center gap-3">
            <div className="pointer-events-none absolute inset-0 rounded-[1.4rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0)_55%)]" />

            {/* Search */}
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpenPopover(e.target.value ? "search" : null);
                }}
                onFocus={() => query && setOpenPopover("search")}
                placeholder="Quick search…"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/70 border border-white/70 text-sm placeholder:text-stone-400 outline-none focus:ring-2 ring-natural-accent/20"
              />
              <AnimatePresence>
                {openPopover === "search" && searchHits.length > 0 && (
                  <motion.div
                    ref={popoverRef}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-white/70 bg-white/95 backdrop-blur-xl shadow-[0_24px_60px_rgba(20,20,20,0.18)] overflow-hidden z-50"
                  >
                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400 border-b border-stone-100">
                      Jump to
                    </div>
                    {searchHits.map((hit) => (
                      <button
                        key={hit.id}
                        onClick={() => {
                          onNavigate(hit.id);
                          setQuery("");
                          setOpenPopover(null);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-stone-100 transition"
                      >
                        <span className="text-stone-500">{hit.icon}</span>
                        <span className="flex-1 text-sm text-stone-800">{hit.label}</span>
                        {hit.group && (
                          <span className="text-[10px] uppercase tracking-wider text-stone-400">{hit.group}</span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative flex items-center gap-1.5 ml-auto">
              {/* Notifications */}
              <div className="relative">
                <IconBtn ariaLabel="Notifications" onClick={() => setOpenPopover(openPopover === "bell" ? null : "bell")}>
                  <Bell className="w-4 h-4" />
                  {notifications.some((n) => n.unread) && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
                  )}
                </IconBtn>
                <AnimatePresence>
                  {openPopover === "bell" && (
                    <Popover popoverRef={popoverRef} onClose={() => setOpenPopover(null)} title="Notifications">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <div className="w-10 h-10 mx-auto rounded-full bg-stone-100 flex items-center justify-center mb-3">
                            <Bell className="w-4 h-4 text-stone-400" />
                          </div>
                          <p className="text-sm font-bold text-stone-800">You're all caught up.</p>
                          <p className="text-xs text-stone-500 mt-1">New orders, low-stock alerts and team activity will show up here.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-stone-100">
                          {notifications.map((n) => (
                            <div key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-stone-50 transition ${n.unread ? "bg-amber-50/50" : ""}`}>
                              <div className="mt-0.5 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0 text-stone-500">
                                {n.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-stone-800">{n.title}</p>
                                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{n.body}</p>
                              </div>
                              <span className="text-[10px] text-stone-400 shrink-0">{n.time}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Popover>
                  )}
                </AnimatePresence>
              </div>

              {/* Settings */}
              <div className="relative">
                <IconBtn
                  ariaLabel="Settings"
                  onClick={() => {
                    // Try navigating to a "settings" tab if the dashboard exposes one,
                    // otherwise open a quick popover.
                    const hasSettingsTab = navGroups.some((g) => g.items.some((it) => it.id === "settings"));
                    if (hasSettingsTab) {
                      onNavigate("settings");
                    } else {
                      setOpenPopover(openPopover === "settings" ? null : "settings");
                    }
                  }}
                >
                  <Settings className="w-4 h-4" />
                </IconBtn>
                <AnimatePresence>
                  {openPopover === "settings" && (
                    <Popover popoverRef={popoverRef} onClose={() => setOpenPopover(null)} title="Quick settings">
                      <div className="p-2 text-sm">
                        <button
                          onClick={() => {
                            setCollapsed(!collapsed);
                            setOpenPopover(null);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 transition"
                        >
                          {collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        </button>
                        <button
                          onClick={() => {
                            document.documentElement.requestFullscreen?.();
                            setOpenPopover(null);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 transition"
                        >
                          Enter fullscreen
                        </button>
                        <div className="my-1 border-t border-stone-100" />
                        <button
                          onClick={() => signOut()}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 transition"
                        >
                          Sign out
                        </button>
                      </div>
                    </Popover>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => signOut()}
                aria-label="Sign out"
                title="Sign out"
                className="w-9 h-9 rounded-xl bg-white/65 border border-white/70 text-stone-600 hover:text-rose-600 hover:bg-white flex items-center justify-center transition"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {user && (
                <div className="hidden sm:flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-white/65 border border-white/70">
                  <div className={`w-8 h-8 rounded-full ${accentBg} text-white flex items-center justify-center text-xs font-bold`}>
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[12px] font-bold text-stone-800">{user.name}</span>
                    <span className="text-[10px] text-stone-500">{user.role ?? user.email}</span>
                  </div>
                </div>
              )}

              {/* Add widget / quick action */}
              <div className="relative">
                <button
                  onClick={() => setOpenPopover(openPopover === "add" ? null : "add")}
                  className={`hidden sm:inline-flex items-center gap-1.5 ${accentBg} text-white text-xs font-bold px-3 py-2 rounded-xl shadow-[0_10px_24px_rgba(90,90,64,0.35)] hover:brightness-110 transition`}
                >
                  <Plus className="w-3.5 h-3.5" /> Quick action
                </button>
                <AnimatePresence>
                  {openPopover === "add" && (
                    <Popover popoverRef={popoverRef} onClose={() => setOpenPopover(null)} title="Quick actions" align="right">
                      <div className="p-2 text-sm">
                        {flatNav.slice(0, 6).map((it) => (
                          <button
                            key={it.id}
                            onClick={() => {
                              onNavigate(it.id);
                              setOpenPopover(null);
                            }}
                            className="w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg hover:bg-stone-100 transition"
                          >
                            <span className="text-stone-500">{it.icon}</span>
                            <span className="flex-1 text-stone-800">{it.label}</span>
                          </button>
                        ))}
                        <div className="my-1 border-t border-stone-100" />
                        <button
                          onClick={() => {
                            window.open("/", "_blank");
                            setOpenPopover(null);
                          }}
                          className="w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg hover:bg-stone-100 transition"
                        >
                          <Sparkles className="w-4 h-4 text-stone-500" />
                          <span className="flex-1 text-stone-800">Open storefront</span>
                        </button>
                      </div>
                    </Popover>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* Workspace surface */}
          <main className="relative mt-4 flex-1 rounded-[1.8rem] border border-white/55 bg-white/55 backdrop-blur-2xl shadow-[0_24px_80px_rgba(20,20,20,0.08)] overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0)_18%)]" />

            {/* Page heading */}
            <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4 px-6 md:px-8 pt-7 pb-5 border-b border-white/55">
              <div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-stone-900">{workspaceTitle}</h1>
                {workspaceSubtitle && (
                  <p className="mt-1 text-sm text-stone-500 max-w-2xl">{workspaceSubtitle}</p>
                )}
              </div>
              {workspaceActions && (
                <div className="flex flex-wrap items-center gap-2">{workspaceActions}</div>
              )}
            </div>

            {/* Slot */}
            <div className="relative p-5 md:p-7">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────
function IconBtn({
  children,
  ariaLabel,
  onClick,
}: {
  children: ReactNode;
  ariaLabel: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="relative w-9 h-9 rounded-xl bg-white/65 border border-white/70 text-stone-600 hover:text-stone-900 hover:bg-white flex items-center justify-center transition"
    >
      {children}
    </button>
  );
}

function Popover({
  children,
  title,
  onClose,
  popoverRef,
  align = "right",
}: {
  children: ReactNode;
  title?: string;
  onClose: () => void;
  popoverRef: React.MutableRefObject<HTMLDivElement | null>;
  align?: "left" | "right";
}) {
  return (
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: 4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.98 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
      className={`absolute top-full mt-2 ${align === "right" ? "right-0" : "left-0"} w-72 rounded-2xl border border-white/70 bg-white/95 backdrop-blur-xl shadow-[0_24px_60px_rgba(20,20,20,0.18)] overflow-hidden z-50`}
    >
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">{title}</p>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {children}
    </motion.div>
  );
}

// ─── Reusable glass card primitives ─────────────────────────────────────────
export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border border-white/55 bg-white/65 backdrop-blur-xl shadow-[0_14px_42px_rgba(20,20,20,0.06)] overflow-hidden ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.6)_0%,rgba(255,255,255,0)_25%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function KpiTile({
  label,
  value,
  delta,
  hint,
  accent = "olive",
}: {
  label: string;
  value: string;
  delta?: { value: string; positive?: boolean };
  hint?: string;
  accent?: "olive" | "amber" | "emerald" | "rose";
}) {
  const dot = {
    olive: "bg-natural-accent",
    amber: "bg-amber-400",
    emerald: "bg-emerald-400",
    rose: "bg-rose-400",
  }[accent];
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</p>
        <span className={`w-2 h-2 rounded-full ${dot}`} />
      </div>
      <p className="text-3xl md:text-[2rem] font-bold tracking-tight text-stone-900 mt-2 leading-none">{value}</p>
      {(delta || hint) && (
        <div className="mt-2 flex items-center gap-2">
          {delta && (
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                delta.positive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {delta.positive ? "↑" : "↓"} {delta.value}
            </span>
          )}
          {hint && <span className="text-[11px] text-stone-500">{hint}</span>}
        </div>
      )}
    </GlassCard>
  );
}
