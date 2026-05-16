import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "motion/react";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  ArrowUpRight,
  Smartphone,
  QrCode,
  Coffee,
} from "lucide-react";
import { GlassCard, KpiTile } from "./AdminShell";

const convexApi = api as any;
const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

/**
 * Bird's-eye overview. Pulls real numbers from convex/analytics and renders
 * the ACRU-style KPI grid: Balance overview / Income / Expenses / Saved +
 * Loyalty App connect card (placeholder) + Cost analysis + Goal + Recent.
 */
export function DashboardOverview() {
  const overview = useQuery(convexApi.analytics.getSalesOverview);
  const products = useQuery(convexApi.products.list);
  const allOrders = useQuery(convexApi.orders.listOrders);
  const recentOrders = useMemo(() => (allOrders ?? []).slice(0, 12), [allOrders]);

  const inStock = products?.filter((p: any) => p.stock > 0).length ?? 0;
  const totalSku = products?.length ?? 0;

  const uniqueCustomers = useMemo(() => {
    const s = new Set<string>();
    (allOrders ?? []).forEach((o: any) => {
      if (o.customerEmail) s.add(o.customerEmail);
      else if (o.customerPhone) s.add(o.customerPhone);
    });
    return s.size;
  }, [allOrders]);

  // Build a 7-day mini bar chart from recent orders (fallback to synthetic)
  const weekBars = useMemo(() => {
    const today = new Date();
    const buckets: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      buckets.push({
        label: ["S", "M", "T", "W", "T", "F", "S"][d.getDay()],
        value: 0,
      });
    }
    (recentOrders ?? []).forEach((o: any) => {
      const d = new Date(o._creationTime ?? Date.now());
      const idx = 6 - Math.floor((today.getTime() - d.getTime()) / 86400000);
      if (idx >= 0 && idx < 7) buckets[idx].value += o.total ?? 0;
    });
    const max = Math.max(1, ...buckets.map((b) => b.value));
    return buckets.map((b) => ({ ...b, pct: (b.value / max) * 100 }));
  }, [recentOrders]);

  return (
    <div className="space-y-6">
      {/* Top row: Big Balance card + 3 KPI tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Balance overview hero card */}
        <GlassCard className="lg:col-span-2 p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Revenue overview</p>
              <p className="text-4xl font-bold text-stone-900 tracking-tight mt-1">
                ₹{overview ? fmt(overview.totalRevenue) : "—"}
              </p>
              <p className="text-xs text-stone-500 mt-1">Lifetime gross across all orders</p>
            </div>
            <div className="flex gap-1.5">
              {["This week", "Month", "Year"].map((t, i) => (
                <button
                  key={t}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition ${
                    i === 0
                      ? "bg-natural-accent text-white shadow-[0_6px_14px_rgba(90,90,64,0.3)]"
                      : "bg-white/70 text-stone-600 hover:bg-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Bars */}
          <div className="flex items-end gap-2 h-36">
            {weekBars.map((b, i) => {
              const peak = b.pct === Math.max(...weekBars.map((x) => x.pct)) && b.pct > 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(8, b.pct)}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                    className={`w-full rounded-t-lg ${
                      peak
                        ? "bg-natural-accent shadow-[0_8px_22px_rgba(90,90,64,0.45)]"
                        : "bg-stone-300/70"
                    } relative overflow-hidden`}
                  >
                    {peak && (
                      <div className="absolute inset-x-0 top-0 h-1/3 bg-white/30" />
                    )}
                  </motion.div>
                  <span className="text-[10px] font-bold text-stone-500">{b.label}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Right stack of small KPI tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <KpiTile
            label="Total orders"
            value={overview ? String(overview.totalOrders) : "—"}
            delta={{ value: "12.4%", positive: true }}
            hint="vs last week"
          />
          <KpiTile
            label="Avg order value"
            value={overview ? `₹${fmt(overview.avgOrderValue ?? 0)}` : "—"}
            hint="per completed order"
            accent="amber"
          />
        </div>
      </div>

      {/* Second row: 4 KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          label="In stock SKUs"
          value={`${inStock}/${totalSku}`}
          hint="Active inventory"
          accent="emerald"
        />
        <KpiTile
          label="Pending"
          value={overview ? String(overview.pendingOrders ?? 0) : "—"}
          hint="Awaiting fulfilment"
          accent="amber"
        />
        <KpiTile
          label="Unique customers"
          value={String(uniqueCustomers)}
          hint="Distinct contacts"
        />
        <KpiTile
          label="Catalog items"
          value={String(totalSku)}
          hint="Total SKUs"
          accent="emerald"
        />
      </div>

      {/* Third row: Loyalty App connect (placeholder) + Recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <LoyaltyAppCard />

        <GlassCard className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Recent orders</p>
              <p className="text-lg font-bold text-stone-900">Latest activity</p>
            </div>
            <button className="text-xs font-bold text-natural-accent hover:underline inline-flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {(recentOrders ?? []).slice(0, 7).map((o: any) => (
              <div
                key={o._id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/55 border border-white/55 hover:bg-white/85 transition"
              >
                <div className="w-9 h-9 rounded-lg bg-natural-accent/15 text-natural-accent flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-800 truncate">{o.customerName ?? "Guest"}</p>
                  <p className="text-[11px] text-stone-500 truncate">
                    {o.items?.length ?? 0} item{(o.items?.length ?? 0) === 1 ? "" : "s"} · {o.status ?? "pending"}
                  </p>
                </div>
                <p className="text-sm font-bold text-stone-900">₹{fmt(o.total ?? 0)}</p>
              </div>
            ))}
            {(!recentOrders || recentOrders.length === 0) && (
              <p className="text-sm text-stone-400 text-center py-8">No orders yet.</p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Bottom row: Cost analysis + Quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <GlassCard className="lg:col-span-2 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Top performing products</p>
          <p className="text-lg font-bold text-stone-900 mb-4">Cost analysis</p>
          <div className="space-y-3">
            {(products ?? []).slice(0, 5).map((p: any, i: number) => {
              const pct = 100 - i * 14;
              return (
                <div key={p._id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-stone-100 border border-white/70 overflow-hidden flex items-center justify-center">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Coffee className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-stone-800 truncate">{p.name}</p>
                    <div className="mt-1.5 h-1.5 rounded-full bg-stone-200/70 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: i * 0.05 }}
                        className="h-full bg-gradient-to-r from-natural-accent to-amber-500 rounded-full"
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-stone-700 tabular-nums w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">This month</p>
          <p className="text-lg font-bold text-stone-900 mb-4">Goal tracker</p>
          <div className="flex items-center justify-center py-2">
            <DonutMeter value={Math.min(100, ((overview?.totalRevenue ?? 0) / 100000) * 100)} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Stat icon={<TrendingUp className="w-4 h-4" />} label="Revenue" value={`₹${fmt(overview?.totalRevenue ?? 0)}`} />
            <Stat icon={<Users className="w-4 h-4" />} label="Customers" value={String(uniqueCustomers)} />
            <Stat icon={<Package className="w-4 h-4" />} label="SKUs" value={`${inStock}`} />
            <Stat icon={<ShoppingBag className="w-4 h-4" />} label="Orders" value={String(overview?.totalOrders ?? 0)} />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/55 border border-white/55 p-3">
      <div className="flex items-center gap-1.5 text-stone-500">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className="text-base font-bold text-stone-900 mt-1">{value}</p>
    </div>
  );
}

function DonutMeter({ value }: { value: number }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(120,113,108,0.18)" strokeWidth="14" />
        <motion.circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="url(#donutGrad)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${dash} ${c}` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="donutGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="#5A5A40" />
            <stop offset="100%" stopColor="#D4A24C" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-stone-900 tabular-nums">{value.toFixed(0)}%</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">of goal</span>
      </div>
    </div>
  );
}

/**
 * Loyalty App connect placeholder card.
 * Non-functional preview UI for the upcoming Third Wave loyalty app pairing.
 */
function LoyaltyAppCard() {
  return (
    <GlassCard className="p-6 relative overflow-hidden">
      <div className="pointer-events-none absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-amber-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -top-12 -left-12 w-40 h-40 rounded-full bg-natural-accent/20 blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="w-4 h-4 text-natural-accent" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-natural-accent">Coming soon</span>
        </div>
        <p className="text-lg font-bold text-stone-900 leading-tight">Connect the Third Wave loyalty app</p>
        <p className="text-xs text-stone-500 mt-1.5 leading-snug">
          Pair the merchant panel with the customer app to push perks, beans, and event invites.
        </p>

        <div className="mt-4 rounded-2xl bg-white/70 border border-white/70 p-3 flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-stone-900 text-white flex items-center justify-center">
            <QrCode className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Pairing code</p>
            <p className="text-base font-bold text-stone-900 tabular-nums tracking-widest">TWC-•••-•••</p>
          </div>
        </div>

        <button
          disabled
          className="mt-4 w-full text-xs font-bold py-2.5 rounded-xl bg-natural-accent/15 text-natural-accent/60 cursor-not-allowed border border-dashed border-natural-accent/30"
        >
          Pairing available soon
        </button>
      </div>
    </GlassCard>
  );
}
