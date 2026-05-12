import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Coffee, Sparkles, Brain, Target, Database } from "lucide-react";
import type { Product } from "../../types";
import { asset } from "../../lib/asset";

/**
 * Third Intelligence Kiosk Pipeline.
 *
 * A multi-stage decision visualization that runs while the AI recommendation
 * is being generated. Designed to feel like watching the model think:
 *
 *   1. INGEST   — the six raw answers fly in as data tokens
 *   2. PARSE    — each answer is extracted into a flavor / behavior trait
 *   3. MATCH    — beams fire from traits across the catalog grid;
 *                 product tiles light up with rising match scores
 *   4. REVEAL   — top matches lift forward; everything else falls away
 *
 * Stages are time-driven (~6.5s total). The parent owns the actual API
 * call; this component only owns the visual journey.
 */

interface KioskPipelineProps {
  answers: Record<string, string>;
  products: Product[];
  onComplete?: () => void;
}

// ───────────────────────────────────────────────────────────────
// Mappings from raw answers → human-readable traits
// ───────────────────────────────────────────────────────────────
const ANSWER_LABEL: Record<string, string> = {
  morning: "Dawn ritual",
  afternoon: "Midday reset",
  evening: "Evening comfort",
  anytime: "Anytime drinker",
  black: "Black, pure",
  milk: "Silky & milky",
  cold: "Cold & chilled",
  sweet: "Sweet & crafted",
  calm: "The Anchor",
  intense: "The Igniter",
  creative: "The Creator",
  curious: "The Seeker",
  creative_work: "Ideas & art",
  tech_work: "Code & systems",
  social_work: "People & stories",
  physical_work: "On the move",
  bold: "Bold & dark",
  sweet_flavor: "Sweet & smooth",
  fruity: "Bright & fruity",
  earthy: "Earthy & complex",
  easy: "Effortless brew",
  ritual: "Ritual brew",
  cold_brew: "Cold brew life",
  cafe: "Café-first",
};

const QUESTION_LABEL: Record<string, string> = {
  time: "TIME",
  style: "STYLE",
  nature: "NATURE",
  job: "DAY",
  flavor: "FLAVOR",
  brew: "BREW",
};

const TRAIT_FOR: Record<string, string> = {
  morning: "Energy ↑",
  afternoon: "Focus ↑",
  evening: "Comfort ↑",
  anytime: "Versatile",
  black: "Pure roast",
  milk: "Body forward",
  cold: "Cold profile",
  sweet: "Smooth finish",
  calm: "Balanced",
  intense: "Bold",
  creative: "Layered",
  curious: "Exploratory",
  creative_work: "Aromatic",
  tech_work: "Sustained",
  social_work: "Approachable",
  physical_work: "Strong",
  bold: "Dark roast",
  sweet_flavor: "Caramel notes",
  fruity: "Bright acidity",
  earthy: "Earthy depth",
  easy: "Convenience",
  ritual: "Specialty",
  cold_brew: "Cold-suited",
  cafe: "Premium tier",
};

type Phase = "ingest" | "parse" | "match" | "reveal";

const PHASE_META: Record<Phase, { idx: number; title: string; sub: string; icon: typeof Brain }> = {
  ingest: { idx: 1, title: "Ingest", sub: "Reading your signals", icon: Database },
  parse: { idx: 2, title: "Parse", sub: "Distilling your essence", icon: Brain },
  match: { idx: 3, title: "Match", sub: "Scoring the catalog", icon: Target },
  reveal: { idx: 4, title: "Reveal", sub: "Locking in your matches", icon: Sparkles },
};

// Simple deterministic scoring so the visualization feels coherent.
// The real recommendation comes from the action; this is just for the show.
function scoreProduct(product: Product, traits: string[]): number {
  const haystack = (
    product.name +
    " " +
    product.description +
    " " +
    product.tags.join(" ") +
    " " +
    product.flavorNotes.join(" ") +
    " " +
    (product.roastLevel ?? "")
  ).toLowerCase();
  let score = 30;
  for (const t of traits) {
    const tokens = t.toLowerCase().split(/[^a-z]+/).filter(Boolean);
    for (const tok of tokens) {
      if (tok.length >= 4 && haystack.includes(tok)) score += 10;
    }
  }
  // small deterministic jitter so equal scores break ties
  score += (product._id.charCodeAt(0) % 9);
  return Math.min(99, score);
}

export function KioskPipeline({ answers, products, onComplete }: KioskPipelineProps) {
  const [phase, setPhase] = useState<Phase>("ingest");

  const tokens = useMemo(
    () =>
      Object.entries(answers).map(([qId, value]) => ({
        qId,
        qLabel: QUESTION_LABEL[qId] ?? qId.toUpperCase(),
        value,
        label: ANSWER_LABEL[value] ?? value,
        trait: TRAIT_FOR[value] ?? "Signal",
      })),
    [answers]
  );

  const scored = useMemo(() => {
    const traits = tokens.map((t) => t.trait);
    return products
      .map((p) => ({ p, score: scoreProduct(p, traits) }))
      .sort((a, b) => b.score - a.score);
  }, [tokens, products]);

  // Phase machine
  useEffect(() => {
    const seq: { phase: Phase; ms: number }[] = [
      { phase: "ingest", ms: 1500 },
      { phase: "parse", ms: 1700 },
      { phase: "match", ms: 2300 },
      { phase: "reveal", ms: 900 },
    ];
    let cancelled = false;
    let accum = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < seq.length; i++) {
      accum += seq[i - 1].ms;
      timers.push(
        setTimeout(() => {
          if (!cancelled) setPhase(seq[i].phase);
        }, accum)
      );
    }
    timers.push(
      setTimeout(() => {
        if (!cancelled) onComplete?.();
      }, accum + seq[seq.length - 1].ms)
    );
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-full max-w-6xl mx-auto"
    >
      {/* ── Status header ─────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <img src={asset("third-intelligence-icon.png")} alt="" className="w-full h-full object-contain drop-shadow-md" />
          <motion.div
            animate={{ opacity: [0.0, 0.5, 0.0], scale: [0.9, 1.4, 0.9] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-natural-accent/20 blur-md -z-10"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] tracking-[0.35em] font-bold uppercase text-natural-accent">
            Third Intelligence
          </span>
          <span className="text-natural-text/45 text-[10px] tracking-wide">
            Decision engine running…
          </span>
        </div>
      </div>

      {/* ── Phase stepper ─────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 mb-10 px-4">
        {(["ingest", "parse", "match", "reveal"] as Phase[]).map((ph, i) => {
          const meta = PHASE_META[ph];
          const active = ph === phase;
          const done = PHASE_META[phase].idx > meta.idx;
          const Icon = meta.icon;
          return (
            <div key={ph} className="flex items-center gap-3 sm:gap-6">
              <motion.div
                animate={{
                  scale: active ? 1.08 : 1,
                  opacity: active || done ? 1 : 0.4,
                }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className={`relative w-9 h-9 rounded-full border flex items-center justify-center ${
                    active
                      ? "bg-natural-text text-white border-natural-text shadow-lg shadow-natural-text/20"
                      : done
                      ? "bg-natural-accent text-white border-natural-accent"
                      : "bg-natural-paper border-natural-border text-natural-text/40"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {active && (
                    <motion.div
                      className="absolute inset-0 rounded-full border border-natural-text/50"
                      animate={{ scale: [1, 1.8], opacity: [0.7, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                </div>
                <span
                  className={`text-[9px] font-bold tracking-[0.25em] uppercase ${
                    active ? "text-natural-text" : "text-natural-text/40"
                  }`}
                >
                  {meta.title}
                </span>
              </motion.div>
              {i < 3 && (
                <div className="hidden sm:flex h-px w-6 sm:w-12 bg-natural-stone/60 relative overflow-hidden">
                  {done && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.6 }}
                      className="absolute inset-y-0 left-0 bg-natural-accent"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Phase subtitle ────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35 }}
          className="text-center text-natural-text/55 text-sm italic mb-10"
        >
          {PHASE_META[phase].sub}…
        </motion.p>
      </AnimatePresence>

      {/* ── Main stage ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1.1fr] gap-8 lg:gap-6 items-start px-4">
        {/* LEFT: signals / traits column */}
        <div className="space-y-2.5">
          <p className="text-[9px] tracking-[0.3em] uppercase font-bold text-natural-text/40 mb-3">
            Your Signals
          </p>
          {tokens.map((t, i) => (
            <SignalRow
              key={t.qId}
              idx={i}
              qLabel={t.qLabel}
              label={t.label}
              trait={t.trait}
              phase={phase}
            />
          ))}
        </div>

        {/* CENTER: connector beams (visible on lg) */}
        <div className="hidden lg:flex flex-col items-center justify-center self-stretch min-h-[300px] relative">
          <Beams phase={phase} />
        </div>

        {/* RIGHT: catalog match grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] tracking-[0.3em] uppercase font-bold text-natural-text/40">
              Catalog · {products.length}
            </p>
            <p className="text-[9px] tracking-[0.3em] uppercase font-bold text-natural-accent">
              Matching
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1.5">
            {scored.map(({ p, score }, idx) => (
              <CatalogTile
                key={p._id}
                product={p}
                score={score}
                rank={idx}
                phase={phase}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ───────────────────────────────────────────────────────────────
// Signal row — animates through 3 sub-states based on phase
// ───────────────────────────────────────────────────────────────
function SignalRow({
  idx,
  qLabel,
  label,
  trait,
  phase,
}: {
  idx: number;
  qLabel: string;
  label: string;
  trait: string;
  phase: Phase;
}) {
  const reveal = phase !== "ingest" || idx === 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={reveal ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
      transition={{ delay: idx * 0.18, type: "spring", stiffness: 160, damping: 20 }}
      className="relative flex items-center gap-3 bg-natural-paper/80 backdrop-blur-sm border border-natural-border rounded-2xl px-3 py-2.5 overflow-hidden"
    >
      {/* Scan beam */}
      {phase === "parse" && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.2, delay: idx * 0.12, ease: "easeInOut" }}
          className="absolute inset-y-0 w-1/3 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(90,90,64,0.18), transparent)",
          }}
        />
      )}
      <span className="text-[8px] font-mono tracking-widest text-natural-text/35 w-10">
        {qLabel}
      </span>
      <span className="text-natural-text text-xs font-bold leading-snug flex-1 truncate">
        {label}
      </span>
      <AnimatePresence>
        {(phase === "parse" || phase === "match" || phase === "reveal") && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8, x: 8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: idx * 0.12, type: "spring", stiffness: 200 }}
            className="text-[9px] font-bold tracking-wider uppercase bg-natural-text text-white px-2 py-1 rounded-full whitespace-nowrap"
          >
            {trait}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ───────────────────────────────────────────────────────────────
// Beams — pulsing wires that animate the data flow
// ───────────────────────────────────────────────────────────────
function Beams({ phase }: { phase: Phase }) {
  if (phase === "ingest") return null;
  const beamCount = 6;
  return (
    <svg viewBox="0 0 100 300" preserveAspectRatio="none" className="w-32 h-full">
      <defs>
        <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(90,90,64,0)" />
          <stop offset="50%" stopColor="rgba(90,90,64,0.6)" />
          <stop offset="100%" stopColor="rgba(90,90,64,0)" />
        </linearGradient>
      </defs>
      {Array.from({ length: beamCount }).map((_, i) => {
        const y = (i + 0.5) * (300 / beamCount);
        return (
          <g key={i}>
            <path
              d={`M 0 ${y} C 50 ${y} 50 ${y + 8} 100 ${y + 8}`}
              fill="none"
              stroke="rgba(217,209,199,0.6)"
              strokeWidth="1"
            />
            {phase !== "ingest" && (
              <motion.circle
                r="2.4"
                fill="rgb(90,90,64)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 1.4,
                  delay: i * 0.18 + (phase === "match" ? 0 : 0),
                  repeat: phase === "match" ? Infinity : 0,
                  ease: "easeInOut",
                }}
              >
                <animateMotion
                  dur="1.4s"
                  repeatCount={phase === "match" ? "indefinite" : "1"}
                  begin={`${i * 0.18}s`}
                  path={`M 0 ${y} C 50 ${y} 50 ${y + 8} 100 ${y + 8}`}
                />
              </motion.circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ───────────────────────────────────────────────────────────────
// Catalog tile — pulses, lights up, shows score
// ───────────────────────────────────────────────────────────────
function CatalogTile({
  product,
  score,
  rank,
  phase,
}: {
  product: Product;
  score: number;
  rank: number;
  phase: Phase;
}) {
  const isTop = rank < 3;
  const isMatching = phase === "match" || phase === "reveal";
  const dim = phase === "reveal" && !isTop;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{
        opacity: dim ? 0.18 : phase === "ingest" ? 0.35 : 1,
        scale: phase === "reveal" && isTop ? 1.08 : 1,
        y: phase === "reveal" && isTop ? -4 : 0,
      }}
      transition={{ delay: rank * 0.025, type: "spring", stiffness: 180, damping: 22 }}
      className={`relative aspect-square rounded-lg overflow-hidden border ${
        isTop && phase === "reveal"
          ? "border-natural-accent shadow-lg shadow-natural-accent/30"
          : "border-natural-border"
      } bg-natural-muted`}
    >
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Coffee className="w-4 h-4 text-natural-text/30" />
        </div>
      )}

      {/* Scan overlay while matching */}
      {isMatching && !dim && (
        <motion.div
          initial={{ y: "-100%" }}
          animate={{ y: "100%" }}
          transition={{
            duration: 1.6,
            delay: rank * 0.04,
            repeat: phase === "match" ? Infinity : 0,
            ease: "linear",
          }}
          className="absolute inset-x-0 h-1/3 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent, rgba(90,90,64,0.4), transparent)",
          }}
        />
      )}

      {/* Score badge */}
      {(phase === "match" || phase === "reveal") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: rank * 0.03 }}
          className={`absolute bottom-1 right-1 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
            isTop
              ? "bg-natural-accent text-white"
              : "bg-natural-text/60 text-white"
          }`}
        >
          {Math.round(score)}
        </motion.div>
      )}

      {/* Top crown */}
      {phase === "reveal" && isTop && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: rank * 0.1, type: "spring", stiffness: 240 }}
          className="absolute top-1 left-1 w-4 h-4 rounded-full bg-natural-accent text-white flex items-center justify-center text-[8px] font-bold"
        >
          {rank + 1}
        </motion.div>
      )}
    </motion.div>
  );
}
