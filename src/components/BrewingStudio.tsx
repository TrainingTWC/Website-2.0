import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Coffee,
  Droplets,
  Flame,
  GlassWater,
  Hourglass,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Snowflake,
  Thermometer,
} from "lucide-react";
import { TIIcon } from "./TIIcon";
import { StudioMedia } from "./StudioMedia";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Types
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type Mode = "brew" | "craft";
type MethodKey = "espresso" | "v60" | "french-press" | "aeropress" | "cold-brew";
type Strength = "light" | "balanced" | "strong";

interface BrewMethod {
  key: MethodKey;
  label: string;
  defaultDose: number;
  defaultRatio: number;
  ratioRange: [number, number];
  doseRange: [number, number];
  blurb: string;
  icon: typeof Coffee;
}

interface DrinkStyle {
  key: string;
  label: string;
  icon: typeof Coffee;
  hot: boolean;
  cold: boolean;
}

interface BrewRecipe {
  title: string;
  grind: string;
  waterTempC: number;
  totalTimeSec: number;
  steps: Array<{ label: string; timeSec: number; waterG?: number; detail: string }>;
  tastingNote: string;
  tip: string;
  pairings?: { food: string; book: string; music: string };
}

interface CraftRecipe {
  title: string;
  servingNote: string;
  steps: Array<{ label: string; duration: string; detail: string }>;
  tastingNote: string;
  tip: string;
  pairings?: { food: string; book: string; music: string };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Constants
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BREW_METHODS: BrewMethod[] = [
  { key: "espresso",     label: "Espresso",     defaultDose: 18,  defaultRatio: 2,  ratioRange: [1.5, 3],  doseRange: [14, 22],   blurb: "9 bar, ~30 seconds. The classic pull.",          icon: Coffee   },
  { key: "v60",          label: "Pour Over",    defaultDose: 15,  defaultRatio: 16, ratioRange: [14, 18],  doseRange: [10, 25],   blurb: "Clarity, brightness, articulated flavor.",       icon: Droplets },
  { key: "french-press", label: "French Press", defaultDose: 30,  defaultRatio: 15, ratioRange: [12, 17],  doseRange: [20, 60],   blurb: "Full body, no filter, generous mouthfeel.",      icon: Hourglass },
  { key: "aeropress",    label: "AeroPress",    defaultDose: 14,  defaultRatio: 14, ratioRange: [10, 18],  doseRange: [11, 18],   blurb: "Versatile, forgiving, cafÃ©-strong.",             icon: Flame    },
  { key: "cold-brew",    label: "Cold Brew",    defaultDose: 100, defaultRatio: 8,  ratioRange: [6, 12],   doseRange: [60, 200],  blurb: "12-hour steep, smooth, low acidity.",            icon: Snowflake },
];

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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Component
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface BrewingStudioProps {
  productName: string;
  roastLevel?: string;
  origin?: string;
  flavorNotes: string[];
  accentHex: string;
}

export function BrewingStudio({
  productName,
  roastLevel,
  origin,
  flavorNotes,
  accentHex,
}: BrewingStudioProps) {
  const [mode, setMode] = useState<Mode>("brew");

  // â”€â”€ Brew state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [methodKey, setMethodKey] = useState<MethodKey>("v60");
  const method = useMemo(() => BREW_METHODS.find((m) => m.key === methodKey)!, [methodKey]);
  const [dose, setDose]       = useState(method.defaultDose);
  const [ratio, setRatio]     = useState(method.defaultRatio);
  const [strength, setStrength] = useState<Strength>("balanced");

  useEffect(() => {
    setDose(method.defaultDose);
    setRatio(method.defaultRatio);
  }, [method]);

  const yieldMl = Math.round(dose * ratio);

  // â”€â”€ Craft state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [drinkStyle, setDrinkStyle] = useState("latte");
  const [flavor, setFlavor] = useState("None");
  const [milk, setMilk]     = useState("Oat");
  const [temp, setTemp]     = useState<"hot" | "iced">("hot");

  // â”€â”€ AI actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const [brewRecipe,  setBrewRecipe]  = useState<BrewRecipe | null>(null);
  const [craftRecipe, setCraftRecipe] = useState<CraftRecipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => { setError(null); }, [mode]);

  const requestBrewRecipe = async () => {
    setLoading(true);
    setError(null);
    setBrewRecipe(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_PROXY_URL}/recommendations`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ kind: "brew", productName, roastLevel, origin, flavorNotes, method: methodKey, dose, ratio, strength }),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Brew request failed"); }
            const result = await res.json();
      if (result.ok) setBrewRecipe(result.recipe);
      else setError(result.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const requestCraftRecipe = async () => {
    setLoading(true);
    setError(null);
    setCraftRecipe(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_PROXY_URL}/recommendations`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ kind: "drink", productName, roastLevel, flavorNotes, drinkStyle, flavorAdd: flavor.toLowerCase(), milk: milk.toLowerCase(), temperature: temp, size: "medium" }),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Craft request failed"); }
            const result = await res.json();
      if (result.ok) setCraftRecipe(result.recipe);
      else setError(result.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // â”€â”€ Timer (brew only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const start = performance.now() - elapsed * 1000;
    const tick = () => {
      const next = Math.floor((performance.now() - start) / 1000);
      setElapsed(next);
      if (brewRecipe && next >= brewRecipe.totalTimeSec) {
        setRunning(false);
        return;
      }
      tickRef.current = requestAnimationFrame(tick);
    };
    tickRef.current = requestAnimationFrame(tick);
    return () => { if (tickRef.current !== null) cancelAnimationFrame(tickRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => { setElapsed(0); setRunning(false); }, [brewRecipe]);

  const activeStepIdx = useMemo(() => {
    if (!brewRecipe) return -1;
    let cum = 0;
    for (let i = 0; i < brewRecipe.steps.length; i++) {
      cum += brewRecipe.steps[i].timeSec;
      if (elapsed < cum) return i;
    }
    return brewRecipe.steps.length - 1;
  }, [elapsed, brewRecipe]);

  const progressPct = brewRecipe ? Math.min(100, (elapsed / brewRecipe.totalTimeSec) * 100) : 0;

  // Live cumulative water poured — interpolated within the active step
  const { flowWaterG, totalWaterG } = useMemo(() => {
    if (!brewRecipe) return { flowWaterG: 0, totalWaterG: 0 };
    const total = brewRecipe.steps.reduce((s, st) => s + (st.waterG ?? 0), 0);
    let cumTime = 0;
    let cumWater = 0;
    for (const step of brewRecipe.steps) {
      const stepEnd = cumTime + step.timeSec;
      if (elapsed >= stepEnd) {
        cumWater += step.waterG ?? 0;
        cumTime = stepEnd;
      } else {
        const frac = (elapsed - cumTime) / step.timeSec;
        cumWater += (step.waterG ?? 0) * frac;
        break;
      }
    }
    return { flowWaterG: Math.round(cumWater), totalWaterG: total };
  }, [elapsed, brewRecipe]);

  const hasOutput = mode === "brew" ? brewRecipe !== null : craftRecipe !== null;

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
      {/* Ambience background video */}
      <StudioMedia slot="ambience" slotKey="studio" className="absolute inset-0 w-full h-full object-cover opacity-[0.08] pointer-events-none select-none" />

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-6 mb-12">
        <div className="flex-1">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.35em] mb-3"
            style={{ color: accentHex, textShadow: `0 0 20px ${accentHex}88` }}
          >
            Brewing Studio
          </p>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl text-natural-text">
            {mode === "brew" ? "Dial it in." : "Craft a signature."}
          </h2>
          <p className="text-natural-text/50 mt-2 max-w-md text-sm leading-relaxed">
            {mode === "brew"
              ? "Set your parameters. Get an AI recipe tuned to this exact bean."
              : "Pick a drink, choose your additions, let AI build the recipe."}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="inline-flex bg-natural-paper border border-natural-border rounded-full p-1 self-start sm:self-auto">
          {(["brew", "craft"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] transition-all"
              style={
                mode === m
                  ? { background: accentHex, color: "#fff", boxShadow: `0 2px 18px ${accentHex}66` }
                  : { color: "#3d2c1e", opacity: 0.45 }
              }
            >
              {m === "brew" ? "Brew Guide" : "Signature Drink"}
            </button>
          ))}
        </div>
      </div>

      {/* â”€â”€ Two-panel grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5 lg:gap-8">

        {/* â”€â”€ Left: controls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <AnimatePresence mode="wait">
          {mode === "brew" ? (
            <motion.div
              key="brew-controls"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.22 }}
              className="bg-natural-paper border border-natural-border rounded-3xl p-6 sm:p-8 space-y-7"
            >
              {/* Method pills */}
              <div className="flex flex-wrap gap-2">
                {BREW_METHODS.map((m) => {
                  const Icon = m.icon;
                  const active = m.key === methodKey;
                  return (
                    <button
                      key={m.key}
                      onClick={() => setMethodKey(m.key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all ${
                        active
                          ? "text-white"
                          : "bg-natural-bg text-natural-text/55 border-natural-border hover:border-natural-text/25"
                      }`}
                      style={
                        active
                          ? { background: accentHex, borderColor: accentHex, boxShadow: `0 4px 18px ${accentHex}55` }
                          : undefined
                      }
                    >
                      <Icon className="w-3 h-3" strokeWidth={2.5} />
                      {m.label}
                    </button>
                  );
                })}
              </div>

              <p
                className="text-xs italic text-natural-text/50 border-l-2 pl-3.5 leading-relaxed"
                style={{ borderColor: `${accentHex}88` }}
              >
                {method.blurb}
              </p>

              <SliderRow label="Dose"  value={`${dose} g`}              min={method.doseRange[0]}  max={method.doseRange[1]}  step={methodKey === "cold-brew" ? 5 : 0.5} current={dose}  onChange={setDose}  accent={accentHex} />
              <SliderRow label="Ratio" value={`1 : ${ratio.toFixed(1)}`} min={method.ratioRange[0]} max={method.ratioRange[1]} step={0.1}                                 current={ratio} onChange={setRatio} accent={accentHex} />

              {/* Yield */}
              <div className="flex items-center justify-between border-t border-natural-border/50 pt-5">
                <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-natural-text/40">Target Yield</span>
                <span
                  className="font-serif font-black text-4xl tabular-nums"
                  style={{ color: accentHex, textShadow: `0 0 24px ${accentHex}66` }}
                >
                  {yieldMl}
                  <span className="text-base font-semibold ml-1.5 text-natural-text/30">ml</span>
                </span>
              </div>

              {/* Strength */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-natural-text/40 mb-3">Strength</p>
                <div className="flex gap-2">
                  {(["light", "balanced", "strong"] as Strength[]).map((s) => {
                    const on = s === strength;
                    return (
                      <button
                        key={s}
                        onClick={() => setStrength(s)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                          on ? "text-white" : "text-natural-text/50 border-natural-border bg-transparent"
                        }`}
                        style={on ? { background: accentHex, borderColor: accentHex, boxShadow: `0 2px 12px ${accentHex}55` } : undefined}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <GenerateButton loading={loading} hasResult={!!brewRecipe} mode="brew" accentHex={accentHex} onClick={requestBrewRecipe} />
              {error && <p className="text-xs text-red-500 leading-relaxed">{error}</p>}
            </motion.div>
          ) : (
            <motion.div
              key="craft-controls"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.22 }}
              className="bg-natural-paper border border-natural-border rounded-3xl p-6 sm:p-8 space-y-6"
            >
              {/* Temperature — gates drink availability */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-natural-text/40 mb-3">Temperature</p>
                <div className="flex gap-2">
                  {(["hot", "iced"] as const).map((t) => {
                    const on = t === temp;
                    return (
                      <button
                        key={t}
                        onClick={() => setTemp(t)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                          on ? "text-white" : "text-natural-text/50 border-natural-border bg-transparent"
                        }`}
                        style={on ? { background: accentHex, borderColor: accentHex, boxShadow: `0 2px 12px ${accentHex}55` } : undefined}
                      >
                        {t === "hot"
                          ? <Flame    className="w-3.5 h-3.5" strokeWidth={2.5} />
                          : <Snowflake className="w-3.5 h-3.5" strokeWidth={2.5} />
                        }
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drink style grid */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-natural-text/40 mb-3">Drink Style</p>
                <div className="grid grid-cols-4 gap-2">
                  {DRINK_STYLES.map((d) => {
                    const Icon     = d.icon;
                    const active   = d.key === drinkStyle;
                    const disabled = temp === "hot" ? !d.hot : !d.cold;
                    return (
                      <button
                        key={d.key}
                        onClick={() => !disabled && setDrinkStyle(d.key)}
                        disabled={disabled}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
                          active
                            ? "text-white"
                            : disabled
                            ? "opacity-25 cursor-not-allowed bg-transparent border-natural-border/30 text-natural-text/40"
                            : "bg-natural-bg border-natural-border text-natural-text/55 hover:border-natural-text/25"
                        }`}
                        style={active ? { background: accentHex, borderColor: accentHex, boxShadow: `0 4px 16px ${accentHex}55` } : undefined}
                      >
                        <Icon className="w-4 h-4" strokeWidth={2} />
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Flavor */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-natural-text/40 mb-3">Flavor Addition</p>
                <div className="flex flex-wrap gap-1.5">
                  {FLAVORS.map((f) => {
                    const on = f === flavor;
                    return (
                      <button
                        key={f}
                        onClick={() => setFlavor(f)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all ${
                          on ? "text-white" : "bg-natural-bg text-natural-text/55 border-natural-border hover:border-natural-text/25"
                        }`}
                        style={on ? { background: accentHex, borderColor: accentHex, boxShadow: `0 2px 10px ${accentHex}55` } : undefined}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Milk */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-natural-text/40 mb-3">Milk</p>
                <div className="flex flex-wrap gap-1.5">
                  {MILKS.map((mk) => {
                    const on = mk === milk;
                    return (
                      <button
                        key={mk}
                        onClick={() => setMilk(mk)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all ${
                          on ? "text-white" : "bg-natural-bg text-natural-text/55 border-natural-border hover:border-natural-text/25"
                        }`}
                        style={on ? { background: accentHex, borderColor: accentHex, boxShadow: `0 2px 10px ${accentHex}55` } : undefined}
                      >
                        {mk}
                      </button>
                    );
                  })}
                </div>
              </div>

              <GenerateButton loading={loading} hasResult={!!craftRecipe} mode="craft" accentHex={accentHex} onClick={requestCraftRecipe} />
              {error && <p className="text-xs text-red-500 leading-relaxed">{error}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* â”€â”€ Right: recipe output â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div
          className="rounded-3xl p-6 sm:p-8 text-white flex flex-col relative overflow-hidden"
          style={{
            minHeight: "30rem",
            background: "linear-gradient(150deg, #1e1208 0%, #110c06 55%, #090704 100%)",
          }}
        >
          {/* Ambient glow — top-right */}
          <div
            aria-hidden
            className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: accentHex }}
          />
          {/* Ambient glow — bottom-left */}
          <div
            aria-hidden
            className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full blur-3xl opacity-10 pointer-events-none"
            style={{ background: accentHex }}
          />

          <AnimatePresence mode="wait">
            {/* Empty state */}
            {!hasOutput && !loading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="m-auto text-center max-w-xs relative z-10"
              >
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5 bg-white/90 ring-1 ring-white/30"
                  style={{ boxShadow: `0 0 32px ${accentHex}55` }}
                >
                  <TIIcon className="w-9 h-9" />
                </div>
                <p className="font-serif italic text-xl leading-snug text-white/75">
                  {mode === "brew" ? "Your recipe will appear here." : "Your drink build will appear here."}
                </p>
                <p className="text-white/35 text-xs mt-3 leading-relaxed">
                  {mode === "brew"
                    ? "Set dose & ratio, then generate. Every step tuned to this bean."
                    : "Choose a style, flavor, and milk — then let us craft the build."}
                </p>
              </motion.div>
            )}

            {/* Loading */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="m-auto text-center relative z-10"
              >
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: accentHex }} />
                <p className="font-serif italic text-white/55 text-sm">
                  {mode === "brew"
                    ? "Third Intelligence is dialing in your recipe…"
                    : "Crafting your signature drink…"}
                </p>
              </motion.div>
            )}

            {/* â”€â”€ Brew recipe â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {mode === "brew" && brewRecipe && !loading && (
              <motion.div
                key="brew-recipe"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 flex-1 flex flex-col"
              >
                <div className="mb-5">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.35em] mb-2"
                    style={{ color: accentHex, textShadow: `0 0 16px ${accentHex}` }}
                  >
                    AI-Tuned Recipe
                  </p>
                  <h3 className="font-serif font-bold text-2xl sm:text-[1.75rem] leading-tight">{brewRecipe.title}</h3>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2.5 mb-5">
                  <StatChip icon={<Coffee     className="w-3.5 h-3.5" />} label="Grind" value={brewRecipe.grind.split(",")[0]}       accentHex={accentHex} />
                  <StatChip icon={<Thermometer className="w-3.5 h-3.5" />} label="Temp"  value={`${brewRecipe.waterTempC}Â°C`}          accentHex={accentHex} />
                  <StatChip icon={<Hourglass   className="w-3.5 h-3.5" />} label="Total" value={formatTime(brewRecipe.totalTimeSec)}    accentHex={accentHex} />
                </div>

                {/* Timer */}
                <div
                  className="rounded-2xl p-4 mb-5 border"
                  style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-serif tabular-nums text-3xl font-bold">
                      {formatTime(elapsed)}
                      <span className="text-white/25 text-sm font-normal ml-2">/ {formatTime(brewRecipe.totalTimeSec)}</span>
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRunning((r) => !r)}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                        style={{ background: accentHex, boxShadow: `0 2px 14px ${accentHex}88` }}
                        aria-label={running ? "Pause" : "Start"}
                      >
                        {running
                          ? <Pause className="w-3.5 h-3.5 text-white" />
                          : <Play  className="w-3.5 h-3.5 text-white ml-0.5" />
                        }
                      </button>
                      <button
                        onClick={() => { setElapsed(0); setRunning(false); }}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                        aria-label="Reset"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-white/50" />
                      </button>
                    </div>
                  </div>
                  {/* Water flow counter */}
                  {totalWaterG > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <Droplets className="w-3.5 h-3.5" style={{ color: accentHex }} />
                      <span
                        className="text-lg font-bold tabular-nums leading-none"
                        style={{ color: accentHex }}
                      >
                        {flowWaterG}g
                      </span>
                      <span className="text-xs text-white/30\">/ {totalWaterG}g poured</span>
                      {/* Water progress bar */}
                      <div className="flex-1 h-0.75 rounded-full ml-1" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: `${accentHex}80` }}
                          animate={{ width: `${totalWaterG > 0 ? (flowWaterG / totalWaterG) * 100 : 0}%` }}
                          transition={{ ease: "linear", duration: 0.2 }}
                        />
                      </div>
                    </div>
                  )}
                  {/* Time progress bar */}
                  <div className="h-0.75 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: accentHex, boxShadow: `0 0 8px ${accentHex}, 0 0 2px ${accentHex}` }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ ease: "linear", duration: 0.2 }}
                    />
                  </div>
                </div>

                {/* Steps */}
                <ol className="space-y-1.5 mb-5">
                  {brewRecipe.steps.map((step, i) => {
                    const active = i === activeStepIdx;
                    const stepSlotKey = `${methodKey.replace(/-/g, "")}.${step.label.toLowerCase().replace(/\s+/g, "")}`;
                    return (
                      <motion.li
                        key={i}
                        animate={{ opacity: active ? 1 : 0.42 }}
                        className="flex gap-3 rounded-xl p-3 transition-colors"
                        style={{
                          background: active ? `${accentHex}14` : "transparent",
                          borderLeft: `2px solid ${active ? accentHex : "transparent"}`,
                        }}
                      >
                        <span
                          className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold tabular-nums mt-0.5"
                          style={{
                            background: active ? accentHex : "rgba(255,255,255,0.07)",
                            color: active ? "#fff" : "rgba(255,255,255,0.45)",
                            boxShadow: active ? `0 0 10px ${accentHex}88` : "none",
                          }}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2 mb-0.5">
                            <p className="text-sm font-bold">{step.label}</p>
                            <span className="flex items-center gap-1.5 shrink-0 text-[11px] tabular-nums text-white/30">
                              {typeof step.waterG === "number" && step.waterG > 0 && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                  style={{
                                    background: active ? `${accentHex}33` : "rgba(255,255,255,0.06)",
                                    color: active ? accentHex : "rgba(255,255,255,0.45)",
                                  }}
                                >
                                  +{step.waterG}g
                                </span>
                              )}
                              {formatTime(step.timeSec)}
                            </span>
                          </div>
                          <p className="text-xs text-white/50 leading-relaxed">{step.detail}</p>
                          <StudioMedia slot="brew_step" slotKey={stepSlotKey} className="mt-2 w-full rounded-lg overflow-hidden aspect-video object-cover" />
                        </div>
                      </motion.li>
                    );
                  })}
                </ol>

                <div
                  className="mt-auto pt-4 border-t grid sm:grid-cols-2 gap-4"
                  style={{ borderColor: "rgba(255,255,255,0.07)" }}
                >
                  <BottomBlock label="Expect" italic>{brewRecipe.tastingNote}</BottomBlock>
                  <BottomBlock label="Pro tip">{brewRecipe.tip}</BottomBlock>
                </div>
                {brewRecipe.pairings && (
                  <PairingsBlock pairings={brewRecipe.pairings} accentHex={accentHex} />
                )}
              </motion.div>
            )}

            {/* â”€â”€ Craft recipe â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {mode === "craft" && craftRecipe && !loading && (
              <motion.div
                key="craft-recipe"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 flex-1 flex flex-col"
              >
                <div className="mb-5">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.35em] mb-2"
                    style={{ color: accentHex, textShadow: `0 0 16px ${accentHex}` }}
                  >
                    Signature Build
                  </p>
                  <h3 className="font-serif font-bold text-2xl sm:text-[1.75rem] leading-tight mb-1.5">{craftRecipe.title}</h3>
                  <p className="text-[11px] font-mono text-white/40 tracking-wide">{craftRecipe.servingNote}</p>
                </div>

                <ol className="space-y-2 mb-5 flex-1">
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

                <div
                  className="pt-4 border-t grid sm:grid-cols-2 gap-4"
                  style={{ borderColor: "rgba(255,255,255,0.07)" }}
                >
                  <BottomBlock label="Expect" italic>{craftRecipe.tastingNote}</BottomBlock>
                  <BottomBlock label="Pro tip">{craftRecipe.tip}</BottomBlock>
                </div>
                {craftRecipe.pairings && (
                  <PairingsBlock pairings={craftRecipe.pairings} accentHex={accentHex} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Helpers
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SliderRow({
  label, value, min, max, step, current, onChange, accent,
}: {
  label: string; value: string; min: number; max: number; step: number;
  current: number; onChange: (v: number) => void; accent: string;
}) {
  const pct = ((current - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-natural-text/40">{label}</span>
        <span className="font-serif font-bold text-2xl tabular-nums" style={{ color: accent }}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-0.75 rounded-full appearance-none cursor-pointer outline-none"
        style={{
          background: `linear-gradient(to right, ${accent} 0%, ${accent} ${pct}%, rgba(0,0,0,0.10) ${pct}%, rgba(0,0,0,0.10) 100%)`,
        }}
      />
      <div className="flex justify-between text-[10px] text-natural-text/30 mt-1.5 tabular-nums">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

function StatChip({ icon, label, value, accentHex }: {
  icon: ReactNode; label: string; value: string; accentHex: string;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span style={{ color: accentHex }}>{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${accentHex}cc` }}>{label}</span>
      </div>
      <p className="text-sm font-bold capitalize leading-tight truncate text-white">{value}</p>
    </div>
  );
}

function BottomBlock({ label, children, italic }: { label: string; children: string; italic?: boolean }) {
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

function PairingsBlock({ pairings, accentHex }: { pairings: { food: string; book: string; music: string }; accentHex: string }) {
  const items = [
    { label: "Food", value: pairings.food },
    { label: "Book", value: pairings.book },
    { label: "Music", value: pairings.music },
  ];
  return (
    <div className="pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/30 mb-3">Pair with</p>
      <div className="grid grid-cols-3 gap-2">
        {items.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl p-3"
            style={{ background: `${accentHex}10`, border: `1px solid ${accentHex}30` }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: accentHex }}>{label}</p>
            <p className="text-xs text-white/75 leading-snug">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GenerateButton({ loading, hasResult, mode, accentHex, onClick }: {
  loading: boolean; hasResult: boolean; mode: Mode; accentHex: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-55"
      style={{
        background: `linear-gradient(135deg, ${accentHex} 0%, ${accentHex}dd 100%)`,
        boxShadow: loading ? "none" : `0 6px 28px ${accentHex}55, 0 2px 8px ${accentHex}33`,
      }}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {mode === "brew" ? "Brewing your recipe…" : "Crafting your drink…"}
        </>
      ) : (
        <>
          <TIIcon className="w-4 h-4" />
          {hasResult
            ? (mode === "brew" ? "Regenerate recipe" : "Recreate drink")
            : (mode === "brew" ? "Generate with Third Intelligence" : "Craft this drink")
          }
        </>
      )}
    </button>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

