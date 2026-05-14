import { useState } from "react";
import { useAction } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import {
  Loader2,
  Sun,
  Sunrise,
  Moon,
  CloudDrizzle,
  Coffee,
  Droplets,
  Snowflake,
  GlassWater,
  Flame,
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

interface DrinkStyle { key: string; label: string; icon: typeof Coffee; hot: boolean; cold: boolean; }
const DRINK_STYLES: DrinkStyle[] = [
  { key: "latte",      label: "Latte",      icon: Coffee,     hot: true,  cold: true  },
  { key: "cappuccino", label: "Cappuccino", icon: Coffee,     hot: true,  cold: false },
  { key: "flat-white", label: "Flat White", icon: Coffee,     hot: true,  cold: false },
  { key: "mocha",      label: "Mocha",      icon: Flame,      hot: true,  cold: true  },
  { key: "cortado",    label: "Cortado",    icon: Coffee,     hot: true,  cold: false },
  { key: "cold-tonic", label: "CB Tonic",   icon: GlassWater, hot: false, cold: true  },
  { key: "whipped",    label: "Whipped",    icon: Droplets,   hot: false, cold: true  },
  { key: "affogato",   label: "Affogato",   icon: Snowflake,  hot: false, cold: true  },
];
const FLAVORS = ["None", "Vanilla", "Caramel", "Hazelnut", "Cinnamon", "Brown Sugar", "Cardamom", "Rose"];
const MILKS   = ["Whole", "Oat", "Almond", "Coconut", "Soy", "No Milk"];

interface Forecast {
  title: string;
  headline: string;
  ritual: Array<{ label: string; detail: string }>;
  arc: Array<{ moment: string; note: string }>;
  cupCard: string;
  pairings: { food: string; book: string; music: string };
}

interface CraftRecipe {
  title: string;
  servingNote: string;
  steps: Array<{ label: string; duration: string; detail: string }>;
  tastingNote: string;
  tip: string;
  pairings?: { food: string; book: string; music: string };
}

interface Props {
  productName: string;
  roastLevel?: string;
  origin?: string;
  flavorNotes: string[];
  bagKind: BagKind;
  accentHex: string;
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

  // ── Mode toggle ──────────────────────────────────────────────────
  const [mode, setMode] = useState<"forecast" | "craft">("forecast");

  // ── Craft (Signature Drink) state ────────────────────────────────
  const [drinkStyle, setDrinkStyle] = useState("latte");
  const [flavor, setFlavor] = useState("None");
  const [milk, setMilk] = useState("Oat");
  const [temperature, setTemperature] = useState<"hot" | "iced">(isCold ? "iced" : "hot");
  const [craftSize, setCraftSize] = useState<"small" | "medium" | "large">("medium");
  const generateCraft = useAction(api.recommendations.flavoredDrink);
  const [craftRecipe, setCraftRecipe] = useState<CraftRecipe | null>(null);
  const [craftLoading, setCraftLoading] = useState(false);
  const [craftError, setCraftError] = useState<string | null>(null);

  const requestCraftRecipe = async () => {
    setCraftLoading(true);
    setCraftError(null);
    setCraftRecipe(null);
    const actualTemp = isCold ? "iced" : temperature;
    const visibleStyles = DRINK_STYLES.filter(s => actualTemp === "iced" ? s.cold : s.hot);
    const actualStyle = visibleStyles.some(s => s.key === drinkStyle) ? drinkStyle : visibleStyles[0]?.key ?? "latte";
    try {
      const result = await generateCraft({
        productName,
        roastLevel,
        flavorNotes,
        drinkStyle: actualStyle,
        flavorAdd: flavor.toLowerCase(),
        milk: milk.toLowerCase(),
        temperature: actualTemp,
        size: craftSize,
        brewMethod: isCold ? "cold-brew immersion bag" : "drip-bag pour-over",
      });
      if (result.ok) setCraftRecipe(result.recipe);
      else setCraftError(result.error);
    } catch (e) {
      setCraftError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setCraftLoading(false);
    }
  };

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
            {isCold ? "Cold-brew immersion bag" : "Drip pour-over bag"}
          </p>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl text-natural-text">
            {mode === "forecast" ? "What kind of cup is this?" : "Craft a signature drink"}
          </h2>
          <p className="text-natural-text/60 mt-2 max-w-lg text-sm sm:text-base">
            {mode === "forecast"
              ? "No grinder, no scale. Tell us the moment — Third Intelligence forecasts the ritual, the flavor arc, and the perfect companion."
              : "Pick a style, add your flavors — Third Intelligence builds a caf\u00e9-quality recipe around this bag."}
          </p>
        </div>

        {/* Mode toggle */}
        <div
          className="flex items-center p-1 rounded-full gap-1"
          style={{ background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.08)" }}
        >
          {(["forecast", "craft"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all"
              style={
                mode === m
                  ? { background: accentHex, color: "#fff", boxShadow: `0 2px 12px ${accentHex}55` }
                  : { color: "rgba(0,0,0,0.45)" }
              }
            >
              {m === "forecast" ? "Sip Forecast" : "Signature Drink"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
        {/* ── Left: inputs ───────────────────────────────────────── */}
        <div className="bg-natural-paper border border-natural-border rounded-3xl p-6 sm:p-8 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {mode === "forecast" ? (
              <motion.div key="forecast-inputs" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.2 }} className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-text/50 mb-3">Your moment</p>
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
                          style={active ? { background: accentHex, borderColor: accentHex, boxShadow: `0 4px 16px ${accentHex}44` } : undefined}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                          <span className="truncate">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-text/50 mb-3">Cup size</p>
                  <div className="flex gap-2">
                    {SIZES.map((s) => {
                      const active = s.key === cupSize;
                      return (
                        <button
                          key={s.key}
                          onClick={() => setCupSize(s.key)}
                          className={`flex-1 px-3 py-2.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all ${
                            active ? "text-white shadow-md" : "bg-natural-bg text-natural-text/70 border-natural-border hover:border-natural-text/30"
                          }`}
                          style={active ? { background: accentHex, borderColor: accentHex, boxShadow: `0 4px 16px ${accentHex}44` } : undefined}
                        >
                          {s.label}
                          <span className="block text-[10px] font-medium opacity-70 mt-0.5">{s.ml}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-text/50 mb-3">Intensity</p>
                  <div className="flex gap-2">
                    {INTENSITIES.map((i) => {
                      const active = i.key === intensity;
                      return (
                        <button
                          key={i.key}
                          onClick={() => setIntensity(i.key)}
                          className={`flex-1 px-3 py-2.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all ${
                            active ? "text-white shadow-md" : "bg-natural-bg text-natural-text/70 border-natural-border hover:border-natural-text/30"
                          }`}
                          style={active ? { background: accentHex, borderColor: accentHex, boxShadow: `0 4px 16px ${accentHex}44` } : undefined}
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
                  className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl text-white font-bold uppercase tracking-wider text-sm disabled:opacity-60 transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${accentHex} 0%, ${accentHex}dd 100%)`,
                    boxShadow: loading ? "none" : `0 6px 28px ${accentHex}55, 0 2px 8px ${accentHex}33`,
                  }}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />Forecasting…</>
                  ) : (
                    <><TIIcon className="w-4 h-4" />Generate my sip forecast</>
                  )}
                </button>
                {error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-2xl p-3">{error}</p>
                )}
              </motion.div>
            ) : (
              <motion.div key="craft-inputs" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }} className="space-y-5">
                {/* Temperature — drip-bag only */}
                {!isCold && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-text/50 mb-3">Temperature</p>
                    <div className="flex gap-2">
                      {(["hot", "iced"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTemperature(t)}
                          className={`flex-1 px-3 py-2.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all ${
                            temperature === t ? "text-white shadow-md" : "bg-natural-bg text-natural-text/70 border-natural-border"
                          }`}
                          style={temperature === t ? { background: accentHex, borderColor: accentHex, boxShadow: `0 4px 16px ${accentHex}44` } : undefined}
                        >
                          {t === "hot" ? "Hot" : "Iced"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drink style */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-text/50 mb-3">Drink style</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {DRINK_STYLES.filter(s => (isCold || temperature === "iced") ? s.cold : s.hot).map((ds) => {
                      const Icon = ds.icon;
                      const active = drinkStyle === ds.key;
                      return (
                        <button
                          key={ds.key}
                          onClick={() => setDrinkStyle(ds.key)}
                          className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
                            active ? "text-white" : "bg-natural-bg text-natural-text/60 border-natural-border"
                          }`}
                          style={active ? { background: accentHex, borderColor: accentHex, boxShadow: `0 2px 12px ${accentHex}44` } : undefined}
                        >
                          <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                          {ds.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Flavor add */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-text/50 mb-3">Flavor add</p>
                  <div className="flex flex-wrap gap-1.5">
                    {FLAVORS.map((f) => (
                      <button
                        key={f}
                        onClick={() => setFlavor(f)}
                        className={`px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-wider transition-all ${
                          flavor === f ? "text-white" : "bg-natural-bg text-natural-text/60 border-natural-border"
                        }`}
                        style={flavor === f ? { background: accentHex, borderColor: accentHex } : undefined}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Milk */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-text/50 mb-3">Milk</p>
                  <div className="flex flex-wrap gap-1.5">
                    {MILKS.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMilk(m)}
                        className={`px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-wider transition-all ${
                          milk === m ? "text-white" : "bg-natural-bg text-natural-text/60 border-natural-border"
                        }`}
                        style={milk === m ? { background: accentHex, borderColor: accentHex } : undefined}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-text/50 mb-3">Size</p>
                  <div className="flex gap-2">
                    {SIZES.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => setCraftSize(s.key)}
                        className={`flex-1 px-3 py-2.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all ${
                          craftSize === s.key ? "text-white shadow-md" : "bg-natural-bg text-natural-text/70 border-natural-border hover:border-natural-text/30"
                        }`}
                        style={craftSize === s.key ? { background: accentHex, borderColor: accentHex, boxShadow: `0 4px 16px ${accentHex}44` } : undefined}
                      >
                        {s.label}
                        <span className="block text-[10px] font-medium opacity-70 mt-0.5">{s.ml}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={requestCraftRecipe}
                  disabled={craftLoading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl text-white font-bold uppercase tracking-wider text-sm disabled:opacity-60 transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${accentHex} 0%, ${accentHex}dd 100%)`,
                    boxShadow: craftLoading ? "none" : `0 6px 28px ${accentHex}55, 0 2px 8px ${accentHex}33`,
                  }}
                >
                  {craftLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />Crafting…</>
                  ) : (
                    <><TIIcon className="w-4 h-4" />Craft my signature drink</>
                  )}
                </button>
                {craftError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-2xl p-3">{craftError}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right: forecast output ────────────────────────────── */}
        <div
          className="text-white rounded-3xl p-6 sm:p-8 min-h-105 relative overflow-hidden"
          style={{ background: "linear-gradient(150deg, #1e1208 0%, #110c06 55%, #090704 100%)" }}
        >
          {/* Ambient glow — top-right */}
          <div
            aria-hidden
            className="absolute -top-28 -right-28 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: accentHex }}
          />
          {/* Ambient glow — bottom-left */}
          <div
            aria-hidden
            className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
            style={{ background: accentHex }}
          />
          <AnimatePresence mode="wait">
            {mode === "forecast" && !forecast && !loading && (
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

            {mode === "forecast" && loading && (
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

            {mode === "forecast" && forecast && (
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
                    style={{ color: accentHex, textShadow: `0 0 16px ${accentHex}` }}
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
                            boxShadow: `0 0 10px ${accentHex}66`,
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
                <div className="pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.10)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mb-3">
                    Pair with
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Food",  value: forecast.pairings.food  },
                      { label: "Book",  value: forecast.pairings.book  },
                      { label: "Music", value: forecast.pairings.music },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="rounded-xl p-3"
                        style={{ background: `${accentHex}10`, border: `1px solid ${accentHex}30` }}
                      >
                        <p
                          className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
                          style={{ color: accentHex }}
                        >
                          {label}
                        </p>
                        <p className="text-xs text-white/75 leading-snug">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Craft: empty ────────────────────────────────────── */}
            {mode === "craft" && !craftRecipe && !craftLoading && (
              <motion.div
                key="craft-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-white/90 ring-1 ring-white/30"
                  style={{ boxShadow: `0 0 28px ${accentHex}55` }}
                >
                  <TIIcon className="w-9 h-9" />
                </div>
                <p className="text-white/60 text-sm max-w-xs leading-relaxed">
                  Choose your style and flavors — we'll craft the recipe around this specific bag.
                </p>
              </motion.div>
            )}

            {/* ── Craft: loading ──────────────────────────────────── */}
            {mode === "craft" && craftLoading && (
              <motion.div
                key="craft-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center"
              >
                <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: accentHex }} strokeWidth={2} />
                <p className="text-white/60 text-xs uppercase tracking-[0.3em]">Crafting your drink…</p>
              </motion.div>
            )}

            {/* ── Craft: recipe ───────────────────────────────────── */}
            {mode === "craft" && craftRecipe && !craftLoading && (
              <motion.div
                key="craft-recipe"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-5"
              >
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.35em] mb-2"
                    style={{ color: accentHex, textShadow: `0 0 16px ${accentHex}` }}
                  >
                    Signature Build
                  </p>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-tight mb-1">
                    {craftRecipe.title}
                  </h3>
                  <p className="text-[11px] font-mono text-white/40 tracking-wide">{craftRecipe.servingNote}</p>
                </div>

                <ol className="space-y-2">
                  {craftRecipe.steps.map((step, i) => (
                    <li
                      key={i}
                      className="flex gap-3 rounded-xl p-3"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <span
                        className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold mt-0.5"
                        style={{ background: accentHex, color: "#fff", boxShadow: `0 0 10px ${accentHex}66` }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2 mb-0.5">
                          <p className="text-sm font-bold">{step.label}</p>
                          <span className="text-[11px] text-white/30 tabular-nums shrink-0">{step.duration}</span>
                        </div>
                        <p className="text-xs text-white/50 leading-relaxed">{step.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="pt-4 border-t grid sm:grid-cols-2 gap-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <SFBottomBlock label="Expect" italic>{craftRecipe.tastingNote}</SFBottomBlock>
                  <SFBottomBlock label="Pro tip">{craftRecipe.tip}</SFBottomBlock>
                </div>
                {craftRecipe.pairings && (
                  <SFPairingsBlock pairings={craftRecipe.pairings} accentHex={accentHex} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function SFBottomBlock({ label, children, italic }: { label: string; children: string; italic?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/30 mb-1.5">{label}</p>
      {italic
        ? <p className="font-serif italic text-white/75 text-sm leading-relaxed">"{children}"</p>
        : <p className="text-white/65 text-sm leading-relaxed">{children}</p>
      }
    </div>
  );
}

function SFPairingsBlock({ pairings, accentHex }: { pairings: { food: string; book: string; music: string }; accentHex: string }) {
  return (
    <div className="pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/30 mb-3">Pair with</p>
      <div className="grid grid-cols-3 gap-2">
        {(["food", "book", "music"] as const).map((key) => (
          <div key={key} className="rounded-xl p-3" style={{ background: `${accentHex}10`, border: `1px solid ${accentHex}30` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: accentHex }}>{key}</p>
            <p className="text-xs text-white/75 leading-snug">{pairings[key]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
