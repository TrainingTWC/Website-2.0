import { useState } from "react";
import { useAction } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import {
  Sparkles,
  Loader2,
  Sun,
  Sunrise,
  Moon,
  CloudDrizzle,
  Coffee,
  Music,
  Utensils,
  BookOpen,
  Activity,
  Droplets,
  Snowflake,
} from "lucide-react";
import { api } from "../../convex/_generated/api";

/**
 * Sip Forecast — the unique AI experience for easy coffee bags.
 *
 * Coffee bags don't need grinders, scales, or pressure profiles. They're
 * "drop and steep" (cold-brew) or "single-pour" (drip-bag). So instead of a
 * brewing calculator, this surface treats every cup as a weather forecast:
 *   - Pick a moment (mood / time of day)
 *   - Pick cup size + intensity
 *   - Mistral returns a poetic "sip forecast" with a tailored ritual, a
 *     three-phase flavor arc, a mood-matched cup card, and a pairing suggestion.
 *
 * Theme-agnostic: renders on the neutral page surface and uses `accentHex` for
 * highlights so it ties back to the hero theme.
 */

type BagKind = "drip-bag" | "cold-brew";

interface MomentChip {
  key: string;
  label: string;
  icon: typeof Sun;
}

const MOMENTS: MomentChip[] = [
  { key: "morning-calm", label: "Morning calm", icon: Sunrise },
  { key: "midday-focus", label: "Midday focus", icon: Sun },
  { key: "afternoon-reset", label: "Afternoon reset", icon: CloudDrizzle },
  { key: "late-night", label: "Late-night quiet", icon: Moon },
];

const SIZES: Array<{ key: "small" | "medium" | "large"; label: string; ml: string }> = [
  { key: "small", label: "Small", ml: "180ml" },
  { key: "medium", label: "Medium", ml: "300ml" },
  { key: "large", label: "Large", ml: "450ml" },
];

const INTENSITIES: Array<{ key: "gentle" | "balanced" | "bold"; label: string }> = [
  { key: "gentle", label: "Gentle" },
  { key: "balanced", label: "Balanced" },
  { key: "bold", label: "Bold" },
];

interface Forecast {
  title: string;
  headline: string;
  ritual: Array<{ label: string; detail: string }>;
  arc: Array<{ moment: string; note: string }>;
  cupCard: string;
  pairing: { kind: string; text: string };
}

interface Props {
  productName: string;
  roastLevel?: string;
  origin?: string;
  flavorNotes: string[];
  bagKind: BagKind;
  accentHex: string;
}

function PairingIcon({ kind }: { kind: string }) {
  const k = kind.toLowerCase();
  if (k.includes("music")) return <Music className="w-4 h-4" strokeWidth={2.2} />;
  if (k.includes("food")) return <Utensils className="w-4 h-4" strokeWidth={2.2} />;
  if (k.includes("read") || k.includes("book"))
    return <BookOpen className="w-4 h-4" strokeWidth={2.2} />;
  if (k.includes("activity")) return <Activity className="w-4 h-4" strokeWidth={2.2} />;
  return <Sparkles className="w-4 h-4" strokeWidth={2.2} />;
}

export function SipForecast({
  productName,
  roastLevel,
  origin,
  flavorNotes,
  bagKind,
  accentHex,
}: Props) {
  const [moment, setMoment] = useState<string>(MOMENTS[0].key);
  const [cupSize, setCupSize] = useState<"small" | "medium" | "large">("medium");
  const [intensity, setIntensity] = useState<"gentle" | "balanced" | "bold">("balanced");

  const generate = useAction(api.recommendations.sipForecast);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestForecast = async () => {
    setLoading(true);
    setError(null);
    setForecast(null);
    try {
      const result = await generate({
        productName,
        roastLevel,
        origin,
        flavorNotes,
        bagKind,
        moment: MOMENTS.find((m) => m.key === moment)?.label ?? moment,
        cupSize,
        intensity,
      });
      if (result.ok) setForecast(result.forecast);
      else setError(result.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const isCold = bagKind === "cold-brew";

  return (
    <section
      className="relative max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24"
      style={{ ["--accent" as string]: accentHex }}
    >
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.3em] mb-3"
            style={{ color: accentHex }}
          >
            Sip Forecast
          </p>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl text-natural-text">
            What kind of cup is this?
          </h2>
          <p className="text-natural-text/60 mt-2 max-w-lg text-sm sm:text-base">
            No grinder, no scale. Tell us the moment — Third Intelligence
            forecasts the ritual, the flavor arc, and the perfect companion.
          </p>
        </div>

        <div
          className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full border text-[11px] font-bold uppercase tracking-wider"
          style={{ borderColor: accentHex, color: accentHex }}
        >
          {isCold ? (
            <Snowflake className="w-3.5 h-3.5" strokeWidth={2.5} />
          ) : (
            <Droplets className="w-3.5 h-3.5" strokeWidth={2.5} />
          )}
          {isCold ? "Cold-brew immersion bag" : "Drip pour-over bag"}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
        {/* ── Left: inputs ───────────────────────────────────────── */}
        <div className="bg-natural-paper border border-natural-border rounded-3xl p-6 sm:p-8 space-y-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-text/50 mb-3">
              Your moment
            </p>
            <div className="grid grid-cols-2 gap-2">
              {MOMENTS.map((m) => {
                const Icon = m.icon;
                const active = m.key === moment;
                return (
                  <button
                    key={m.key}
                    onClick={() => setMoment(m.key)}
                    className={`flex items-center gap-2 px-3.5 py-3 rounded-2xl border text-xs font-bold uppercase tracking-wider transition-all text-left ${
                      active
                        ? "text-white shadow-md"
                        : "bg-natural-bg text-natural-text/70 border-natural-border hover:border-natural-text/30"
                    }`}
                    style={
                      active
                        ? { background: accentHex, borderColor: accentHex }
                        : undefined
                    }
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-text/50 mb-3">
              Cup size
            </p>
            <div className="flex gap-2">
              {SIZES.map((s) => {
                const active = s.key === cupSize;
                return (
                  <button
                    key={s.key}
                    onClick={() => setCupSize(s.key)}
                    className={`flex-1 px-3 py-2.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all ${
                      active
                        ? "text-white shadow-md"
                        : "bg-natural-bg text-natural-text/70 border-natural-border hover:border-natural-text/30"
                    }`}
                    style={
                      active
                        ? { background: accentHex, borderColor: accentHex }
                        : undefined
                    }
                  >
                    {s.label}
                    <span className="block text-[10px] font-medium opacity-70 mt-0.5">
                      {s.ml}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-text/50 mb-3">
              Intensity
            </p>
            <div className="flex gap-2">
              {INTENSITIES.map((i) => {
                const active = i.key === intensity;
                return (
                  <button
                    key={i.key}
                    onClick={() => setIntensity(i.key)}
                    className={`flex-1 px-3 py-2.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all ${
                      active
                        ? "text-white shadow-md"
                        : "bg-natural-bg text-natural-text/70 border-natural-border hover:border-natural-text/30"
                    }`}
                    style={
                      active
                        ? { background: accentHex, borderColor: accentHex }
                        : undefined
                    }
                  >
                    {i.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={requestForecast}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-full text-white font-bold uppercase tracking-wider text-xs shadow-lg disabled:opacity-60 transition-all hover:shadow-xl"
            style={{ background: accentHex }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                Forecasting…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" strokeWidth={2.5} />
                Generate my sip forecast
              </>
            )}
          </button>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-2xl p-3">
              {error}
            </p>
          )}
        </div>

        {/* ── Right: forecast output ────────────────────────────── */}
        <div className="bg-natural-text text-white rounded-3xl p-6 sm:p-8 min-h-[420px] relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!forecast && !loading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                  style={{ background: `${accentHex}33` }}
                >
                  <Coffee className="w-6 h-6" style={{ color: accentHex }} strokeWidth={2} />
                </div>
                <p className="text-white/60 text-sm max-w-xs leading-relaxed">
                  Pick a moment and we'll forecast exactly how this cup is
                  going to land.
                </p>
              </motion.div>
            )}

            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center"
              >
                <Loader2
                  className="w-8 h-8 animate-spin mb-3"
                  style={{ color: accentHex }}
                  strokeWidth={2}
                />
                <p className="text-white/60 text-xs uppercase tracking-[0.3em]">
                  Reading the cup…
                </p>
              </motion.div>
            )}

            {forecast && (
              <motion.div
                key="forecast"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* Title + headline */}
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2"
                    style={{ color: accentHex }}
                  >
                    Today's forecast
                  </p>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-tight mb-3">
                    {forecast.title}
                  </h3>
                  <p className="text-xs font-mono text-white/70 tracking-wide">
                    {forecast.headline}
                  </p>
                </div>

                {/* Cup card */}
                <div
                  className="rounded-2xl p-4 border"
                  style={{
                    borderColor: `${accentHex}55`,
                    background: `${accentHex}10`,
                  }}
                >
                  <p className="text-sm leading-relaxed text-white/90 italic">
                    "{forecast.cupCard}"
                  </p>
                </div>

                {/* Ritual */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mb-3">
                    The ritual
                  </p>
                  <ol className="space-y-2">
                    {forecast.ritual.map((step, i) => (
                      <li
                        key={i}
                        className="flex gap-3 items-start text-sm leading-relaxed"
                      >
                        <span
                          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5"
                          style={{
                            background: accentHex,
                            color: "#fff",
                          }}
                        >
                          {i + 1}
                        </span>
                        <span>
                          <span className="font-bold">{step.label}.</span>{" "}
                          <span className="text-white/75">{step.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Flavor arc */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mb-3">
                    Flavor arc
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {forecast.arc.map((a, i) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-white/10 p-3"
                      >
                        <p
                          className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
                          style={{ color: accentHex }}
                        >
                          {a.moment}
                        </p>
                        <p className="text-xs text-white/75 leading-snug">
                          {a.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pairing */}
                <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${accentHex}25`, color: accentHex }}
                  >
                    <PairingIcon kind={forecast.pairing.kind} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">
                      Pair with
                    </p>
                    <p className="text-sm text-white/90 truncate">
                      {forecast.pairing.text}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
