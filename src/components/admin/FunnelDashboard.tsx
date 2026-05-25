"use client";
import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  TrendingDown,
  ShoppingCart,
  AlertTriangle,
  Activity,
  Users,
  Smartphone,
  CreditCard,
  Zap,
} from "lucide-react";

const RANGE_OPTIONS = [
  { label: "24H", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
];

function fmt(n: number): string {
  return n.toLocaleString("en-IN");
}
function pct(x: number): string {
  if (!isFinite(x) || isNaN(x)) return "0%";
  return `${(x * 100).toFixed(1)}%`;
}
function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60_000) return "just now";
  if (d < 3_600_000) return `${Math.round(d / 60_000)} min ago`;
  if (d < 86_400_000) return `${Math.round(d / 3_600_000)} h ago`;
  return `${Math.round(d / 86_400_000)} d ago`;
}

// ── KPI card ─────────────────────────────────────────────────────────────
function Kpi({
  label,
  value,
  sub,
  icon,
  tone = "olive",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  tone?: "olive" | "amber" | "red" | "blue" | "green";
}) {
  const colors: Record<string, string> = {
    olive: "#5A5A40",
    amber: "#D97706",
    red: "#DC2626",
    blue: "#2563EB",
    green: "#059669",
  };
  const c = colors[tone];
  return (
    <div className="bg-white rounded-2xl border border-natural-border p-5 flex flex-col gap-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${c}18` }}
      >
        <span style={{ color: c }}>{icon}</span>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-natural-text/40 mb-1">
          {label}
        </p>
        <p className="font-serif font-bold text-2xl text-natural-text">{value}</p>
        {sub && <p className="text-xs text-natural-text/50 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── Funnel bars ──────────────────────────────────────────────────────────
function FunnelBars({ data }: { data: { stage: string; count: number }[] }) {
  const top = Math.max(1, data[0]?.count ?? 1);
  return (
    <div className="space-y-3">
      {data.map((row, i) => {
        const widthPct = (row.count / top) * 100;
        const conversionFromTop = top > 0 ? row.count / top : 0;
        const dropFromPrev =
          i === 0 || data[i - 1].count === 0
            ? 0
            : 1 - row.count / data[i - 1].count;
        return (
          <div key={row.stage}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-natural-text">{row.stage}</span>
              <span className="text-natural-text/60">
                {fmt(row.count)} <span className="text-natural-text/40">·</span>{" "}
                {pct(conversionFromTop)}
                {i > 0 && dropFromPrev > 0 && (
                  <span className="ml-2 text-rose-600">
                    −{pct(dropFromPrev)}
                  </span>
                )}
              </span>
            </div>
            <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-natural-accent rounded-full transition-all"
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Trend line (pure SVG) ────────────────────────────────────────────────
function TrendChart({
  data,
}: {
  data: { date: string; sessions: number; carts: number; orders: number }[];
}) {
  if (!data || data.length === 0) return null;
  const W = 600;
  const H = 140;
  const PAD = 12;
  const maxS = Math.max(...data.map((d) => d.sessions), 1);

  const lineFor = (key: "sessions" | "carts" | "orders") =>
    data
      .map((d, i) => {
        const x = data.length === 1 ? W / 2 : (i / (data.length - 1)) * (W - PAD * 2) + PAD;
        const y = PAD + H - (d[key] / maxS) * H;
        return `${x},${y}`;
      })
      .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H + PAD * 2}`} className="w-full h-40">
      <polyline points={lineFor("sessions")} fill="none" stroke="#5A5A40" strokeWidth={2} />
      <polyline points={lineFor("carts")} fill="none" stroke="#D97706" strokeWidth={2} />
      <polyline points={lineFor("orders")} fill="none" stroke="#059669" strokeWidth={2} />
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  Main component
// ════════════════════════════════════════════════════════════════════════
export function FunnelDashboard() {
  const [range, setRange] = useState(7);

  const overview = useQuery(api.funnel.getFunnelOverview, { days: range });
  const dropouts = useQuery(api.funnel.getDropoutHotspots, { days: range });
  const abandoned = useQuery(api.funnel.getAbandonedCarts, { days: range, limit: 10 });
  const paymentFunnel = useQuery(api.funnel.getPaymentFunnel, { days: range });
  const devices = useQuery(api.funnel.getDeviceBreakdown, { days: range });
  const friction = useQuery(api.funnel.getFrictionEvents, { days: range });
  const errors = useQuery(api.funnel.getRecentClientErrors, { days: range, limit: 10 });
  const trend = useQuery(api.funnel.getDailyTrend, { days: Math.max(14, range) });

  const loading = overview === undefined;

  const deviceMobile = useMemo(
    () => devices?.find((d) => d.device === "mobile"),
    [devices]
  );
  const deviceDesktop = useMemo(
    () => devices?.find((d) => d.device === "desktop"),
    [devices]
  );

  return (
    <div className="space-y-6">
      {/* Header + range */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-natural-text">Funnel & CRM</h2>
          <p className="text-xs text-natural-text/50 mt-1">
            Cart-to-delivered behaviour — abandonment, friction, dropout hotspots, payment failures.
          </p>
        </div>
        <div className="flex bg-stone-100 rounded-xl p-1">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                range === r.days
                  ? "bg-white text-natural-text shadow-sm"
                  : "text-natural-text/50 hover:text-natural-text"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="Sessions"
          value={loading ? "—" : fmt(overview!.sessions)}
          icon={<Users className="w-4 h-4" />}
          tone="blue"
        />
        <Kpi
          label="Conversion"
          value={loading ? "—" : pct(overview!.rates.conversionRate)}
          sub={loading ? "" : `${pct(overview!.rates.atcRate)} add-to-cart`}
          icon={<Activity className="w-4 h-4" />}
          tone="green"
        />
        <Kpi
          label="Cart abandonment"
          value={loading ? "—" : pct(overview!.rates.cartAbandonRate)}
          sub={loading ? "" : `${fmt(overview!.abandoned.count)} carts left behind`}
          icon={<ShoppingCart className="w-4 h-4" />}
          tone="amber"
        />
        <Kpi
          label="Lost cart value"
          value={loading ? "—" : inr(overview!.abandoned.value)}
          sub={loading ? "" : "recoverable revenue"}
          icon={<TrendingDown className="w-4 h-4" />}
          tone="red"
        />
      </div>

      {/* Funnel + Trend */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-natural-border p-6">
          <h3 className="font-bold text-base text-natural-text mb-4">Conversion funnel</h3>
          {loading ? (
            <p className="text-sm text-natural-text/40">Loading…</p>
          ) : (
            <FunnelBars data={overview!.funnel} />
          )}
        </div>
        <div className="bg-white rounded-2xl border border-natural-border p-6">
          <h3 className="font-bold text-base text-natural-text mb-2">Daily trend</h3>
          <div className="flex gap-4 text-[11px] mb-3">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-natural-accent" /> sessions</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> carts</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> orders</span>
          </div>
          {trend && trend.length > 0 ? (
            <TrendChart data={trend} />
          ) : (
            <p className="text-sm text-natural-text/40">No data yet — once shoppers visit, daily counts will appear here.</p>
          )}
        </div>
      </div>

      {/* Dropout hotspots + Abandoned carts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-natural-border p-6">
          <h3 className="font-bold text-base text-natural-text mb-1">Where shoppers drop off</h3>
          <p className="text-[11px] text-natural-text/40 mb-4">Most-common last event before abandonment.</p>
          {dropouts && dropouts.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {dropouts.map((d) => (
                <li key={d.name} className="flex items-center justify-between border-b border-stone-100 pb-2 last:border-0">
                  <div>
                    <p className="font-bold text-natural-text">{d.name}</p>
                    {d.route && <p className="text-[11px] text-natural-text/50">{d.route}</p>}
                  </div>
                  <span className="text-natural-text/70 tabular-nums">{fmt(d.count)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-natural-text/40">No dropouts in this window.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-natural-border p-6">
          <h3 className="font-bold text-base text-natural-text mb-1">Abandoned carts (recoverable)</h3>
          <p className="text-[11px] text-natural-text/40 mb-4">Sorted by lost value. Contact captured = eligible for recovery email.</p>
          {abandoned && abandoned.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {abandoned.map((c) => (
                <li key={c._id} className="flex items-center justify-between border-b border-stone-100 pb-2 last:border-0">
                  <div>
                    <p className="font-bold text-natural-text">{inr(c.subtotal)}</p>
                    <p className="text-[11px] text-natural-text/50">
                      {c.itemCount} item{c.itemCount === 1 ? "" : "s"} · {timeAgo(c.updatedAt)} · last: {c.lastEventName ?? "—"}
                    </p>
                  </div>
                  {c.hasContact ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
                      recoverable
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-500 px-2 py-1 rounded">
                      anon
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-natural-text/40">No abandoned carts in this window. 🎉</p>
          )}
        </div>
      </div>

      {/* Payment funnel + Device mix */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-natural-border p-6">
          <h3 className="font-bold text-base text-natural-text mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Payment funnel
          </h3>
          {paymentFunnel ? (
            <>
              <FunnelBars data={paymentFunnel.funnel} />
              {paymentFunnel.failureReasons.length > 0 && (
                <div className="mt-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-natural-text/40 mb-2">
                    Failure reasons
                  </p>
                  <ul className="text-xs space-y-1">
                    {paymentFunnel.failureReasons.slice(0, 5).map((r) => (
                      <li key={r.reason} className="flex justify-between text-natural-text/70">
                        <span>{r.reason}</span>
                        <span className="tabular-nums">{r.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {paymentFunnel.methodMix.length > 0 && (
                <div className="mt-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-natural-text/40 mb-2">
                    Method mix
                  </p>
                  <ul className="text-xs space-y-1">
                    {paymentFunnel.methodMix.map((m) => (
                      <li key={m.method} className="flex justify-between text-natural-text/70">
                        <span>{m.method}</span>
                        <span className="tabular-nums">{m.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-natural-text/40">Loading…</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-natural-border p-6">
          <h3 className="font-bold text-base text-natural-text mb-4 flex items-center gap-2">
            <Smartphone className="w-4 h-4" /> Conversion by device
          </h3>
          {devices && devices.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-natural-text/40 text-left">
                  <th className="pb-2">Device</th>
                  <th className="pb-2">Sessions</th>
                  <th className="pb-2">Orders</th>
                  <th className="pb-2">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.device} className="border-t border-stone-100">
                    <td className="py-2 font-bold text-natural-text">{d.device}</td>
                    <td className="py-2 tabular-nums">{fmt(d.sessions)}</td>
                    <td className="py-2 tabular-nums">{fmt(d.orders)}</td>
                    <td className="py-2 tabular-nums">{pct(d.conversionRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-natural-text/40">No device data yet.</p>
          )}
          {deviceMobile && deviceDesktop && deviceMobile.sessions > 0 && deviceDesktop.sessions > 0 && (
            <p className="mt-4 text-xs text-natural-text/50">
              Mobile − desktop conversion gap:{" "}
              <strong className={deviceMobile.conversionRate < deviceDesktop.conversionRate ? "text-rose-600" : "text-emerald-600"}>
                {pct(deviceMobile.conversionRate - deviceDesktop.conversionRate)}
              </strong>
            </p>
          )}
        </div>
      </div>

      {/* Friction + Errors */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-natural-border p-6">
          <h3 className="font-bold text-base text-natural-text mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Friction signals
          </h3>
          {friction ? (
            <ul className="space-y-2 text-sm">
              {friction.map((f) => (
                <li key={f.name} className="flex justify-between border-b border-stone-100 pb-2 last:border-0">
                  <span className="text-natural-text">{f.name.replaceAll("_", " ")}</span>
                  <span className="tabular-nums font-bold text-natural-text">{fmt(f.count)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-natural-text/40">Loading…</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-natural-border p-6">
          <h3 className="font-bold text-base text-natural-text mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Recent client errors
          </h3>
          {errors && errors.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {errors.map((e) => (
                <li key={e._id} className="border-b border-stone-100 pb-2 last:border-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-mono text-[11px] text-rose-700 truncate flex-1">{e.message}</p>
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                      {e.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-natural-text/40 mt-0.5">
                    {e.route ?? "—"} · {timeAgo(e.ts)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-natural-text/40">No errors in this window. ✓</p>
          )}
        </div>
      </div>
    </div>
  );
}
