import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { TrendingUp, ShoppingBag, BarChart2, Clock } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  shipped: "#8B5CF6",
  delivered: "#10B981",
  cancelled: "#EF4444",
};

const RANGE_OPTIONS = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

function fmt(n: number) {
  return n.toLocaleString("en-IN");
}

// ── KPI card ────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-natural-border p-5 flex flex-col gap-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}18` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-natural-text/40 mb-1">
          {label}
        </p>
        <p className="font-serif font-bold text-2xl text-natural-text">{value}</p>
      </div>
    </div>
  );
}

// ── Revenue sparkline (pure SVG) ────────────────────────────────
function RevenueChart({
  data,
}: {
  data: { date: string; revenue: number; orderCount: number }[];
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-natural-text/30 text-sm">
        No revenue data for this period
      </div>
    );
  }

  const W = 580;
  const H = 100;
  const PAD = 10;
  const max = Math.max(...data.map((d) => d.revenue), 1);

  const pts = data.map((d, i) => {
    const x = data.length === 1 ? W / 2 : (i / (data.length - 1)) * (W - PAD * 2) + PAD;
    const y = PAD + H - (d.revenue / max) * H;
    return { x, y, d };
  });

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const polygon = [
    `${pts[0].x},${H + PAD}`,
    ...pts.map((p) => `${p.x},${p.y}`),
    `${pts[pts.length - 1].x},${H + PAD}`,
  ].join(" ");

  const firstDate = data[0].date.slice(5);
  const lastDate = data[data.length - 1].date.slice(5);
  const midDate =
    data.length > 2 ? data[Math.floor(data.length / 2)].date.slice(5) : null;

  return (
    <svg
      viewBox={`0 0 600 ${H + PAD * 2 + 16}`}
      className="w-full h-auto"
      aria-label="Daily revenue chart"
    >
      {/* area fill */}
      <polygon
        points={polygon}
        fill="#5A5A40"
        fillOpacity="0.08"
      />
      {/* line */}
      <polyline
        points={polyline}
        fill="none"
        stroke="#5A5A40"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#5A5A40" />
      ))}
      {/* x-axis labels */}
      <text x={PAD} y={H + PAD * 2 + 12} fontSize="10" fill="#9ca3af" textAnchor="start">
        {firstDate}
      </text>
      {midDate && (
        <text x={300} y={H + PAD * 2 + 12} fontSize="10" fill="#9ca3af" textAnchor="middle">
          {midDate}
        </text>
      )}
      <text x={W + PAD} y={H + PAD * 2 + 12} fontSize="10" fill="#9ca3af" textAnchor="end">
        {lastDate}
      </text>
    </svg>
  );
}

// ── Status doughnut ──────────────────────────────────────────────
function StatusDoughnut({ data }: { data: Record<string, number> | undefined }) {
  if (!data) return null;

  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 120 120" className="w-32 h-32">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="16" />
          <text x="60" y="65" textAnchor="middle" fontSize="10" fill="#9ca3af">
            No orders
          </text>
        </svg>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 50;
  let offset = 0;

  const segments = entries.map(([status, count]) => {
    const dash = (count / total) * circumference;
    const seg = { status, count, dash, offset };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 120 120" className="w-36 h-36" style={{ transform: "rotate(-90deg)" }}>
        {segments.map((seg) => (
          <circle
            key={seg.status}
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke={STATUS_COLORS[seg.status] ?? "#9ca3af"}
            strokeWidth="16"
            strokeDasharray={`${seg.dash} ${circumference}`}
            strokeDashoffset={-seg.offset}
          />
        ))}
      </svg>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {entries.map(([status, count]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: STATUS_COLORS[status] ?? "#9ca3af" }}
            />
            <span className="capitalize text-natural-text/70">{status}</span>
            <span className="font-bold text-natural-text ml-auto">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main SalesAnalytics component ───────────────────────────────
export function SalesAnalytics() {
  const [days, setDays] = useState(30);

  const overview = useQuery(api.analytics.getSalesOverview);
  const daily = useQuery(api.analytics.getDailyRevenue, { days });
  const topProducts = useQuery(api.analytics.getTopProducts);
  const statusBreakdown = useQuery(api.analytics.getOrderStatusBreakdown);

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div>
        <h3 className="font-serif font-bold text-2xl text-natural-text">Sales Overview</h3>
        <p className="text-sm text-natural-text/40 mt-0.5">Live data from all orders</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Revenue"
          value={overview ? `₹${fmt(overview.totalRevenue)}` : "—"}
          icon={<TrendingUp className="w-4 h-4" />}
          color="#10B981"
        />
        <KpiCard
          label="Total Orders"
          value={overview ? String(overview.totalOrders) : "—"}
          icon={<ShoppingBag className="w-4 h-4" />}
          color="#3B82F6"
        />
        <KpiCard
          label="Avg Order Value"
          value={
            overview
              ? `₹${fmt(Math.round(overview.avgOrderValue))}`
              : "—"
          }
          icon={<BarChart2 className="w-4 h-4" />}
          color="#8B5CF6"
        />
        <KpiCard
          label="Pending"
          value={overview ? String(overview.pendingOrders) : "—"}
          icon={<Clock className="w-4 h-4" />}
          color="#F59E0B"
        />
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-natural-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-sm text-natural-text">Daily Revenue</h4>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setDays(opt.days)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  days === opt.days
                    ? "bg-natural-accent text-white"
                    : "bg-natural-muted text-natural-text/60 hover:bg-natural-stone/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <RevenueChart data={daily ?? []} />
      </div>

      {/* Bottom row: top products + status doughnut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white rounded-2xl border border-natural-border p-5">
          <h4 className="font-bold text-sm text-natural-text mb-4">Top Products</h4>
          {!topProducts || topProducts.length === 0 ? (
            <p className="text-xs text-natural-text/40 text-center py-6">
              No order data yet
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-natural-text/40 uppercase tracking-wider text-[10px] border-b border-natural-border">
                  <th className="text-left pb-2">#</th>
                  <th className="text-left pb-2">Product</th>
                  <th className="text-right pb-2">Units</th>
                  <th className="text-right pb-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr
                    key={i}
                    className={`${i % 2 === 0 ? "bg-natural-bg/40" : ""} rounded`}
                  >
                    <td className="py-2 pl-1 text-natural-text/40 font-bold">{i + 1}</td>
                    <td className="py-2 font-medium text-natural-text max-w-[140px] truncate">
                      {p.name}
                    </td>
                    <td className="py-2 text-right font-bold">{p.qty}</td>
                    <td className="py-2 text-right font-bold">₹{fmt(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Status doughnut */}
        <div className="bg-white rounded-2xl border border-natural-border p-5">
          <h4 className="font-bold text-sm text-natural-text mb-4">Order Status</h4>
          <StatusDoughnut data={statusBreakdown} />
        </div>
      </div>
    </div>
  );
}
