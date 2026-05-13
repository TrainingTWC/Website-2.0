import { useEffect, useMemo, useRef, useState } from "react";
import { useAction } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import {
  Coffee,
  Droplets,
  Flame,
  Hourglass,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Loader2,
  Thermometer,
} from "lucide-react";
import { api } from "../../convex/_generated/api";

/**
 * Interactive brewing studio:
 *   - Pick a brew method (Espresso / V60 / French Press / Aeropress / Cold Brew)
 *   - Adjust dose + ratio sliders, yield computes live
 *   - Hit "Generate recipe" → Gemini returns a custom step-by-step recipe
 *   - Built-in timer that walks through each step
 *
 * Theming: the entire component is theme-agnostic — it renders on the neutral
 * `bg-natural-bg` page section and uses an `accentHex` prop for highlights so
 * it visually ties back to the product hero.
 */

type MethodKey = "espresso" | "v60" | "french-press" | "aeropress" | "cold-brew";

interface Method {
  key: MethodKey;
  label: string;
  defaultDose: number;
  defaultRatio: number;
  ratioRange: [number, number];
  doseRange: [number, number];
  blurb: string;
  icon: typeof Coffee;
}

const METHODS: Method[] = [
  {
    key: "espresso",
    label: "Espresso",
    defaultDose: 18,
    defaultRatio: 2,
    ratioRange: [1.5, 3],
    doseRange: [14, 22],
    blurb: "9 bar, ~30 seconds. The classic pull.",
    icon: Coffee,
  },
  {
    key: "v60",
    label: "Pour Over (V60)",
    defaultDose: 15,
    defaultRatio: 16,
    ratioRange: [14, 18],
    doseRange: [10, 25],
    blurb: "Clarity, brightness, articulated flavor.",
    icon: Droplets,
  },
  {
    key: "french-press",
    label: "French Press",
    defaultDose: 30,
    defaultRatio: 15,
    ratioRange: [12, 17],
    doseRange: [20, 60],
    blurb: "Full body, no filter, generous mouthfeel.",
    icon: Hourglass,
  },
  {
    key: "aeropress",
    label: "AeroPress",
    defaultDose: 14,
    defaultRatio: 14,
    ratioRange: [10, 18],
    doseRange: [11, 18],
    blurb: "Versatile, forgiving, café-strong.",
    icon: Flame,
  },
  {
    key: "cold-brew",
    label: "Cold Brew",
    defaultDose: 100,
    defaultRatio: 8,
    ratioRange: [6, 12],
    doseRange: [60, 200],
    blurb: "12-hour steep, smooth, low acidity.",
    icon: Droplets,
  },
];

type Strength = "light" | "balanced" | "strong";

interface Recipe {
  title: string;
  grind: string;
  waterTempC: number;
  totalTimeSec: number;
  steps: Array<{ label: string; timeSec: number; detail: string }>;
  tastingNote: string;
  tip: string;
}

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
  const [methodKey, setMethodKey] = useState<MethodKey>("v60");
  const method = useMemo(() => METHODS.find((m) => m.key === methodKey)!, [methodKey]);
  const [dose, setDose] = useState(method.defaultDose);
  const [ratio, setRatio] = useState(method.defaultRatio);
  const [strength, setStrength] = useState<Strength>("balanced");

  // Reset dose/ratio to method defaults whenever method switches.
  useEffect(() => {
    setDose(method.defaultDose);
    setRatio(method.defaultRatio);
  }, [method]);

  const yieldMl = Math.round(dose * ratio);

  // ── AI recipe generation ───────────────────────────────────────
  const generate = useAction(api.recommendations.brewingRecipe);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestRecipe = async () => {
    setLoading(true);
    setError(null);
    setRecipe(null);
    try {
      const result = await generate({
        productName,
        roastLevel,
        origin,
        flavorNotes,
        method: methodKey,
        dose,
        ratio,
        strength,
      });
      if (result.ok) {
        setRecipe(result.recipe);
      } else {
        setError(result.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ── Timer for walking through recipe steps ─────────────────────
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const start = performance.now() - elapsed * 1000;
    const tick = () => {
      const next = Math.floor((performance.now() - start) / 1000);
      setElapsed(next);
      if (recipe && next >= recipe.totalTimeSec) {
        setRunning(false);
        return;
      }
      tickRef.current = requestAnimationFrame(tick);
    };
    tickRef.current = requestAnimationFrame(tick);
    return () => {
      if (tickRef.current !== null) cancelAnimationFrame(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Reset timer whenever a new recipe arrives.
  useEffect(() => {
    setElapsed(0);
    setRunning(false);
  }, [recipe]);

  // Which step is currently active?
  const activeStepIdx = useMemo(() => {
    if (!recipe) return -1;
    let cum = 0;
    for (let i = 0; i < recipe.steps.length; i++) {
      cum += recipe.steps[i].timeSec;
      if (elapsed < cum) return i;
    }
    return recipe.steps.length - 1;
  }, [elapsed, recipe]);

  const progressPct = recipe ? Math.min(100, (elapsed / recipe.totalTimeSec) * 100) : 0;

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
            Brewing Studio
          </p>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl text-natural-text">
            Dial it in.
          </h2>
          <p className="text-natural-text/60 mt-2 max-w-lg text-sm sm:text-base">
            Pick a method, set your numbers, get an AI-crafted recipe tuned to
            this bean.
          </p>
        </div>
      </div>

      {/* Method tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {METHODS.map((m) => {
          const Icon = m.icon;
          const active = m.key === methodKey;
          return (
            <button
              key={m.key}
              onClick={() => setMethodKey(m.key)}
              className={`group flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all ${
                active
                  ? "text-white shadow-lg"
                  : "bg-natural-paper text-natural-text/70 border-natural-border hover:border-natural-text/30"
              }`}
              style={
                active
                  ? { background: accentHex, borderColor: accentHex }
                  : undefined
              }
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.4fr] gap-6 lg:gap-10">
        {/* ── Left: controls ─────────────────────────────────────── */}
        <div className="bg-natural-paper border border-natural-border rounded-3xl p-6 sm:p-8 space-y-6">
          <p className="text-xs text-natural-text/60 italic">{method.blurb}</p>

          {/* Dose slider */}
          <SliderRow
            label="Dose"
            value={`${dose} g`}
            min={method.doseRange[0]}
            max={method.doseRange[1]}
            step={methodKey === "cold-brew" ? 5 : 0.5}
            current={dose}
            onChange={setDose}
            accent={accentHex}
          />

          {/* Ratio slider */}
          <SliderRow
            label="Ratio"
            value={`1 : ${ratio.toFixed(1)}`}
            min={method.ratioRange[0]}
            max={method.ratioRange[1]}
            step={0.1}
            current={ratio}
            onChange={setRatio}
            accent={accentHex}
          />

          {/* Yield readout */}
          <div className="flex items-center justify-between border-t border-natural-border/60 pt-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-text/50">
              Target Yield
            </span>
            <span
              className="font-serif font-black text-3xl tabular-nums"
              style={{ color: accentHex }}
            >
              {yieldMl}
              <span className="text-base font-bold ml-1 text-natural-text/40">
                ml
              </span>
            </span>
          </div>

          {/* Strength pills */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-text/50 mb-3">
              Strength preference
            </p>
            <div className="flex gap-2">
              {(["light", "balanced", "strong"] as Strength[]).map((s) => {
                const on = s === strength;
                return (
                  <button
                    key={s}
                    onClick={() => setStrength(s)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                      on
                        ? "text-white"
                        : "bg-transparent text-natural-text/60 border-natural-border hover:border-natural-text/30"
                    }`}
                    style={on ? { background: accentHex, borderColor: accentHex } : undefined}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={requestRecipe}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold text-sm uppercase tracking-wider transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60 disabled:translate-y-0"
            style={{ background: accentHex }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Brewing your recipe…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {recipe ? "Regenerate recipe" : "Generate AI recipe"}
              </>
            )}
          </button>
          {error && (
            <p className="text-xs text-red-600 leading-relaxed">{error}</p>
          )}
        </div>

        {/* ── Right: recipe + timer ──────────────────────────────── */}
        <div className="bg-natural-text rounded-3xl p-6 sm:p-8 text-white min-h-[28rem] flex flex-col relative overflow-hidden">
          {/* Decorative wash */}
          <div
            aria-hidden
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-30"
            style={{ background: accentHex }}
          />

          <AnimatePresence mode="wait">
            {!recipe && !loading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="m-auto text-center max-w-sm relative z-10"
              >
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5"
                  style={{ background: `${accentHex}33`, color: accentHex }}
                >
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="font-serif italic text-2xl leading-snug text-white/90">
                  Your recipe will appear here.
                </p>
                <p className="text-white/50 text-sm mt-3">
                  Adjust dose & ratio, then tap{" "}
                  <span className="text-white/80">Generate AI recipe</span>. We'll
                  tailor it to this bean's roast and origin.
                </p>
              </motion.div>
            )}

            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="m-auto text-center relative z-10"
              >
                <Loader2
                  className="w-8 h-8 animate-spin mx-auto mb-4"
                  style={{ color: accentHex }}
                />
                <p className="font-serif italic text-white/80">
                  Third Intelligence is dialing in your recipe…
                </p>
              </motion.div>
            )}

            {recipe && !loading && (
              <motion.div
                key="recipe"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="relative z-10 flex-1 flex flex-col"
              >
                {/* Recipe header */}
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2"
                      style={{ color: accentHex }}
                    >
                      AI-tuned recipe
                    </p>
                    <h3 className="font-serif font-bold text-2xl leading-tight">
                      {recipe.title}
                    </h3>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <StatChip
                    icon={<Coffee className="w-3.5 h-3.5" />}
                    label="Grind"
                    value={recipe.grind.split(",")[0]}
                  />
                  <StatChip
                    icon={<Thermometer className="w-3.5 h-3.5" />}
                    label="Temp"
                    value={`${recipe.waterTempC}°C`}
                  />
                  <StatChip
                    icon={<Hourglass className="w-3.5 h-3.5" />}
                    label="Total"
                    value={formatTime(recipe.totalTimeSec)}
                  />
                </div>

                {/* Timer */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-serif tabular-nums text-3xl font-bold">
                      {formatTime(elapsed)}
                      <span className="text-white/40 text-base font-normal ml-2">
                        / {formatTime(recipe.totalTimeSec)}
                      </span>
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRunning((r) => !r)}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-natural-text"
                        style={{ background: accentHex }}
                        aria-label={running ? "Pause" : "Start"}
                      >
                        {running ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setElapsed(0);
                          setRunning(false);
                        }}
                        className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
                        aria-label="Reset"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full"
                      style={{ background: accentHex }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ ease: "linear", duration: 0.2 }}
                    />
                  </div>
                </div>

                {/* Steps */}
                <ol className="space-y-2 mb-5">
                  {recipe.steps.map((step, i) => {
                    const active = i === activeStepIdx;
                    return (
                      <motion.li
                        key={i}
                        animate={{
                          opacity: active ? 1 : 0.55,
                          scale: active ? 1.0 : 0.99,
                        }}
                        className="flex gap-3 rounded-xl p-3 transition-colors"
                        style={{
                          background: active ? `${accentHex}1F` : "transparent",
                          borderLeft: active
                            ? `2px solid ${accentHex}`
                            : "2px solid transparent",
                        }}
                      >
                        <span
                          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold tabular-nums"
                          style={{
                            background: active ? accentHex : "rgba(255,255,255,0.08)",
                            color: active ? "#1a1a1a" : "rgba(255,255,255,0.7)",
                          }}
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3 mb-0.5">
                            <p className="font-bold text-sm">{step.label}</p>
                            <span className="text-[11px] tabular-nums text-white/40">
                              {formatTime(step.timeSec)}
                            </span>
                          </div>
                          <p className="text-xs text-white/70 leading-relaxed">
                            {step.detail}
                          </p>
                        </div>
                      </motion.li>
                    );
                  })}
                </ol>

                {/* Tasting + tip */}
                <div className="mt-auto pt-5 border-t border-white/10 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 mb-1">
                      Expect
                    </p>
                    <p className="font-serif italic text-white/90 text-sm leading-relaxed">
                      "{recipe.tastingNote}"
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 mb-1">
                      Pro tip
                    </p>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {recipe.tip}
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

// ── helpers ────────────────────────────────────────────────────

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
  accent,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (v: number) => void;
  accent: string;
}) {
  const pct = ((current - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-text/50">
          {label}
        </span>
        <span className="font-serif font-bold text-xl tabular-nums text-natural-text">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-current outline-none"
        style={{
          background: `linear-gradient(to right, ${accent} 0%, ${accent} ${pct}%, rgba(0,0,0,0.08) ${pct}%, rgba(0,0,0,0.08) 100%)`,
        }}
      />
      <div className="flex justify-between text-[10px] text-natural-text/40 mt-1 tabular-nums">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
      <div className="flex items-center gap-1.5 text-white/40 mb-1">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p className="text-sm font-bold capitalize leading-tight truncate">{value}</p>
    </div>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
