import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Coffee,
  ShoppingCart,
  Star,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import ReactMarkdown from "react-markdown";
import { asset } from "../../lib/asset";
import type { Product, RecommendationResult } from "../../types";

interface TIQuestion {
  id: string;
  question: string;
  subtitle: string;
  options: { label: string; sub: string; value: string }[];
}

const QUESTIONS: TIQuestion[] = [
  {
    id: "time",
    question: "When does coffee find you?",
    subtitle: "Your ritual shapes your match",
    options: [
      { label: "Dawn ritual", sub: "Before the world wakes up", value: "morning" },
      { label: "Midday reset", sub: "Sharpen the afternoon", value: "afternoon" },
      { label: "Evening comfort", sub: "A slow, warm wind-down", value: "evening" },
      { label: "Whenever I need it", sub: "I follow no schedule", value: "anytime" },
    ],
  },
  {
    id: "style",
    question: "How do you take your coffee?",
    subtitle: "Your preference reveals your spirit",
    options: [
      { label: "Black, pure", sub: "Nothing between me and the beans", value: "black" },
      { label: "Silky & milky", sub: "Smooth, creamy, comforting", value: "milk" },
      { label: "Cold & chilled", sub: "Ready to go, no heat needed", value: "cold" },
      { label: "Sweet & crafted", sub: "A little art in the cup", value: "sweet" },
    ],
  },
  {
    id: "nature",
    question: "What is your nature?",
    subtitle: "Your energy shapes your cup",
    options: [
      { label: "The Anchor", sub: "Calm, grounded, steady", value: "calm" },
      { label: "The Igniter", sub: "Driven, ambitious, unstoppable", value: "intense" },
      { label: "The Creator", sub: "Imaginative, fluid, expressive", value: "creative" },
      { label: "The Seeker", sub: "Curious, exploring, open", value: "curious" },
    ],
  },
  {
    id: "job",
    question: "What pulls you through the day?",
    subtitle: "Your world shapes your taste",
    options: [
      { label: "Ideas & art", sub: "I create for a living", value: "creative_work" },
      { label: "Code & systems", sub: "I build and solve problems", value: "tech_work" },
      { label: "People & stories", sub: "I connect, lead, and inspire", value: "social_work" },
      { label: "Always on the move", sub: "Physical, hands-on, relentless", value: "physical_work" },
    ],
  },
  {
    id: "flavor",
    question: "What flavor calls to you?",
    subtitle: "Trust your first instinct",
    options: [
      { label: "Bold & dark", sub: "Roasted, rich, powerful", value: "bold" },
      { label: "Sweet & smooth", sub: "Caramel, chocolate, warm", value: "sweet_flavor" },
      { label: "Bright & fruity", sub: "Berry, citrus, vibrant", value: "fruity" },
      { label: "Earthy & complex", sub: "Layered, mysterious, deep", value: "earthy" },
    ],
  },
  {
    id: "brew",
    question: "How do you like to brew?",
    subtitle: "Ritual or convenience — no judgment",
    options: [
      { label: "Keep it easy", sub: "Bags, pods, quick brew", value: "easy" },
      { label: "I love the ritual", sub: "Pour-over, French press", value: "ritual" },
      { label: "Cold brew life", sub: "Ready in the fridge", value: "cold_brew" },
      { label: "Café all the way", sub: "I rarely brew at home", value: "cafe" },
    ],
  },
];

interface DiscoveryWidgetProps {
  onClose: () => void;
}

export function DiscoveryWidget({ onClose }: DiscoveryWidgetProps) {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] =
    useState<RecommendationResult | null>(null);
  const [direction, setDirection] = useState(1);

  const products = useQuery(api.products.list);
  const getRecommendation = useAction(api.recommendations.getRecommendation);
  const createSession = useMutation(api.sessions.create);

  const q = QUESTIONS[step];
  const hasAnswer = !!answers[q?.id];

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  };

  const nextStep = () => {
    if (!hasAnswer && !note.trim()) return;
    if (step < QUESTIONS.length - 1) {
      setDirection(1);
      setStep(step + 1);
    } else {
      handleRecommend();
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleRecommend = async () => {
    setLoading(true);
    try {
      const productSnapshot = (products ?? []).map((p) => ({
        _id: p._id,
        name: p.name,
        type: p.type,
        roastLevel: p.roastLevel,
        tags: p.tags,
        description: p.description,
        flavorNotes: p.flavorNotes,
        price: p.price,
        origin: p.origin,
        category: p.category,
      }));
      const finalAnswers = note.trim() ? { ...answers, freeform: note.trim() } : answers;
      const rec = await getRecommendation({ answers: finalAnswers, products: productSnapshot });
      setRecommendation(rec);
      await createSession({
        answers: finalAnswers,
        recommendations: rec.primaryProductIds,
        completed: true,
        converted: false,
      });
    } catch {
      setRecommendation({
        primaryProductIds: [],
        crossSellProductIds: [],
        explanation: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(-1);
    setDirection(1);
    setAnswers({});
    setNote("");
    setRecommendation(null);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-110 overflow-hidden font-sans bg-natural-bg">
          {/* ── Top bar ─────────────────────────────────────────── */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 sm:px-8 py-4 border-b border-natural-border/60 bg-natural-paper/70 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <img
                  src={asset("third-intelligence-icon.png")}
                  alt=""
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-[9px] tracking-[0.3em] uppercase text-natural-accent">
                  Third Intelligence
                </span>
                <span className="text-natural-text/40 text-[10px] tracking-wide">
                  Your match, distilled
                </span>
              </div>
            </div>
            <button
              onClick={reset}
              className="p-2.5 rounded-full bg-natural-paper hover:bg-natural-muted border border-natural-border text-natural-text/60 hover:text-natural-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Main content — flex-col mobile | grid desktop ── */}
          <div className="absolute inset-0 pt-[4.25rem] flex flex-col lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] min-h-0">
            {/* LEFT — controls */}
            <div className="relative flex flex-col flex-1 min-h-0 px-6 sm:px-10 py-5 overflow-y-auto scrollbar-hide">
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <ProcessingView />
                </div>
              ) : recommendation ? (
                <RecommendationView
                  recommendation={recommendation}
                  products={products ?? []}
                  onReset={reset}
                />
              ) : step === -1 ? (
                <IntroView
                  note={note}
                  onNote={setNote}
                  onSubmit={handleRecommend}
                  onStartQuestions={() => { setDirection(1); setStep(0); }}
                />
              ) : (
                <QuestionView
                  q={q}
                  step={step}
                  direction={direction}
                  answers={answers}
                  note={note}
                  onNote={setNote}
                  hasAnswer={hasAnswer}
                  onAnswer={handleAnswer}
                  onNext={nextStep}
                  onPrev={prevStep}
                />
              )}
            </div>

            {/* RIGHT — product panel: horizontal strip on mobile (h-44), compact grid on desktop */}
            <div className="relative flex shrink-0 h-44 lg:h-auto min-h-0 border-t lg:border-t-0 lg:border-l border-natural-border/60 bg-natural-paper/60 lg:bg-linear-to-br lg:from-natural-paper/60 lg:via-natural-paper/20 lg:to-transparent">
              <ProductShortlist
                answers={answers}
                note={note}
                step={step}
                loading={loading}
                recommendation={recommendation}
                products={products ?? []}
              />
            </div>
          </div>
        </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Intro view — freeform entry, bypasses the questionnaire
// ─────────────────────────────────────────────────────────────
function IntroView({
  note,
  onNote,
  onSubmit,
  onStartQuestions,
}: {
  note: string;
  onNote: (v: string) => void;
  onSubmit: () => void;
  onStartQuestions: () => void;
}) {
  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && note.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center gap-8"
    >
      <div className="space-y-2">
        <p className="text-natural-accent text-[10px] font-bold tracking-[0.35em] uppercase">
          Third Intelligence
        </p>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-natural-text leading-[1.05] tracking-tight">
          What's your coffee moment?
        </h2>
        <p className="text-natural-text/45 text-sm italic">
          Describe it in your own words — we'll find the match.
        </p>
      </div>

      <div className="space-y-3">
        <textarea
          value={note}
          onChange={(e) => onNote(e.target.value)}
          onKeyDown={handleKey}
          autoFocus
          placeholder="e.g. I want something bold for cold mornings, I drink it black and I like earthy, intense flavours…"
          rows={4}
          className="w-full resize-none rounded-2xl border border-natural-border bg-natural-paper p-4 text-sm text-natural-text placeholder:text-natural-text/30 focus:outline-none focus:border-natural-accent transition-colors"
        />
        <button
          onClick={onSubmit}
          disabled={!note.trim()}
          className={`w-full py-4 rounded-full font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${
            note.trim()
              ? "bg-natural-text text-white shadow-lg shadow-natural-text/20 hover:bg-natural-accent"
              : "bg-natural-muted text-natural-text/30 cursor-not-allowed"
          }`}
        >
          Distil My Match <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={onStartQuestions}
        className="text-natural-text/40 hover:text-natural-text text-xs font-bold tracking-[0.2em] uppercase transition-colors flex items-center justify-center gap-1.5"
      >
        Answer a few questions instead <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Question view — with 3D tilt cards
// ─────────────────────────────────────────────────────────────
function QuestionView({
  q,
  step,
  direction,
  answers,
  note,
  onNote,
  hasAnswer,
  onAnswer,
  onNext,
  onPrev,
}: {
  q: TIQuestion;
  step: number;
  direction: number;
  answers: Record<string, string>;
  note: string;
  onNote: (v: string) => void;
  hasAnswer: boolean;
  onAnswer: (v: string) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <div className="w-full max-w-xl mx-auto flex-1 flex flex-col">
      {/* Progress dots */}
      <div className="flex items-center justify-start gap-2 mb-6">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === step ? 28 : 6,
              opacity: i <= step ? 1 : 0.25,
              backgroundColor:
                i <= step
                  ? "var(--color-natural-accent)"
                  : "var(--color-natural-stone)",
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: direction * 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -20 }}
          transition={{ duration: 0.25 }}
          className="flex-1 flex flex-col gap-5"
        >
          <div className="space-y-1">
            <p className="text-natural-accent text-[10px] font-bold tracking-[0.35em] uppercase">
              Question {step + 1} of {QUESTIONS.length}
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-natural-text leading-[1.05] tracking-tight">
              {q.question}
            </h2>
            <p className="text-natural-text/45 text-sm italic">{q.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options.map((opt) => (
              <OptionCard
                key={opt.value}
                opt={opt}
                selected={answers[q.id] === opt.value}
                onSelect={() => onAnswer(opt.value)}
              />
            ))}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-natural-text/40">
              <Sparkles className="w-3 h-3" /> Or tell us anything
            </label>
            <textarea
              value={note}
              onChange={(e) => onNote(e.target.value)}
              placeholder="e.g. I want something smoky for the monsoon mornings…"
              rows={2}
              className="w-full resize-none rounded-2xl border border-natural-border bg-natural-paper p-3 text-sm text-natural-text placeholder:text-natural-text/30 focus:outline-none focus:border-natural-accent transition-colors"
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation — always pinned to bottom of left panel */}
      <div className="flex items-center justify-between pt-6 mt-auto">
        <button
          onClick={onPrev}
          className={`flex items-center gap-2 text-natural-text/50 hover:text-natural-text text-xs font-bold tracking-[0.2em] uppercase transition-colors ${
            step === 0 ? "opacity-0 pointer-events-none" : ""
          }`}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!hasAnswer && !note.trim()}
          className={`px-8 py-3.5 rounded-full font-bold text-sm tracking-wide transition-all flex items-center gap-2 ${
            hasAnswer || note.trim()
              ? "bg-natural-text text-white shadow-lg shadow-natural-text/20 hover:bg-natural-accent"
              : "bg-natural-muted text-natural-text/30 cursor-not-allowed"
          }`}
        >
          {step === QUESTIONS.length - 1 ? "Brew My Match" : "Continue"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Flat, fast option card (no 3D tilt, no per-mouse-move re-renders)
// ─────────────────────────────────────────────────────────────
function OptionCard({
  opt,
  selected,
  onSelect,
}: {
  opt: { label: string; sub: string; value: string };
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`relative p-4 rounded-2xl text-left border transition-all duration-200 ${
        selected
          ? "bg-natural-paper border-natural-accent shadow-md shadow-natural-accent/15"
          : "bg-natural-paper/70 border-natural-border hover:border-natural-accent/40 hover:bg-natural-paper"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <p
          className={`font-serif font-bold text-base leading-snug ${
            selected ? "text-natural-text" : "text-natural-text/85"
          }`}
        >
          {opt.label}
        </p>
        {selected && (
          <div className="shrink-0 w-5 h-5 rounded-full bg-natural-accent flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      <p
        className={`text-xs leading-relaxed ${
          selected ? "text-natural-text/60" : "text-natural-text/40"
        }`}
      >
        {opt.sub}
      </p>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Processing view — coffee-ritual orbital animation
// ─────────────────────────────────────────────────────────────
function ProcessingView() {
  const messages = [
    "Reading your essence…",
    "Mapping your flavor profile…",
    "Consulting the intelligence…",
    "Brewing your match…",
  ];
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % messages.length), 1800);
    return () => clearInterval(t);
  }, [messages.length]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center gap-14 text-center"
    >
      {/* Orbital animation */}
      <div className="relative w-44 h-44">
        {/* Outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-natural-accent/30 border-t-natural-accent/80"
        />
        {/* Middle ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-6 rounded-full border border-natural-text/15 border-t-natural-text/50"
        />
        {/* Inner glow */}
        <div className="absolute inset-12 rounded-full flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-full bg-natural-accent/30 blur-md"
          />
          <div className="absolute w-10 h-10 rounded-full bg-natural-paper border border-natural-border shadow-lg flex items-center justify-center">
            <Coffee className="w-4 h-4 text-natural-accent" />
          </div>
        </div>
        {/* Orbiting dot outer */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-natural-accent shadow-[0_0_14px_rgba(90,90,64,0.7)]" />
        </motion.div>
        {/* Orbiting dot inner */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-6"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-natural-text shadow-[0_0_10px_rgba(44,24,16,0.6)]" />
        </motion.div>
      </div>
      <div className="space-y-2.5">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
            className="text-natural-text font-serif font-bold text-2xl tracking-tight"
          >
            {messages[msgIdx]}
          </motion.p>
        </AnimatePresence>
        <p className="text-natural-text/40 text-[10px] tracking-[0.35em] uppercase">
          Third Intelligence at work
        </p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Recommendation view — premium results
// ─────────────────────────────────────────────────────────────
function RecommendationView({
  recommendation,
  products,
  onReset,
}: {
  recommendation: RecommendationResult;
  products: Product[];
  onReset: () => void;
}) {
  const getProduct = (id: string) => products.find((p) => p._id === id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl overflow-y-auto max-h-full space-y-6 pb-6 pr-1 scrollbar-hide"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-center space-y-2"
      >
        <p className="text-natural-accent text-[10px] font-bold tracking-[0.35em] uppercase">
          Your match has been found
        </p>
        <h2 className="text-4xl font-serif font-bold text-natural-text tracking-tight">
          Made for you
        </h2>
      </motion.div>

      {/* AI explanation card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="bg-natural-paper border border-natural-border rounded-3xl p-7 shadow-sm"
      >
        <div className="flex items-center gap-2 text-natural-accent mb-3">
          <Sparkles className="w-4 h-4" />
          <span className="font-bold uppercase tracking-[0.25em] text-[10px]">
            The Intelligence Says
          </span>
        </div>
        <div className="text-natural-text/80 text-base leading-relaxed font-medium italic">
          <ReactMarkdown>{recommendation.explanation}</ReactMarkdown>
        </div>
      </motion.div>

      {/* Primary matches */}
      <div className="space-y-4">
        <p className="text-natural-text/40 text-[10px] font-bold tracking-[0.3em] uppercase">
          Primary Match
        </p>
        {recommendation.primaryProductIds.map((id, idx) => {
          const p = getProduct(id);
          if (!p) return null;
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + idx * 0.12, type: "spring", stiffness: 150, damping: 20 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="flex items-center gap-5 bg-natural-paper border border-natural-border rounded-3xl p-5 hover:shadow-xl hover:border-natural-accent/30 transition-all group"
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-natural-muted">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Coffee className="w-7 h-7 text-natural-text/20" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-serif font-bold text-natural-text text-base leading-snug">
                  {p.name}
                </h4>
                <p className="text-natural-text/50 text-xs line-clamp-1 mt-1">
                  {p.description}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-natural-accent font-bold text-base">
                    ₹{p.price.toLocaleString("en-IN")}
                  </span>
                  {p.origin && (
                    <span className="text-natural-text/40 text-xs flex items-center gap-0.5 font-medium">
                      <MapPin className="w-3 h-3" /> {p.origin}
                    </span>
                  )}
                  {p.rating && (
                    <span className="text-natural-text/40 text-xs flex items-center gap-0.5 font-medium">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {p.rating}
                    </span>
                  )}
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="shrink-0 w-11 h-11 rounded-full bg-natural-text hover:bg-natural-accent text-white flex items-center justify-center transition-colors shadow-lg"
              >
                <ShoppingCart className="w-4 h-4" />
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Cross-sell */}
      {recommendation.crossSellProductIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="space-y-4"
        >
          <p className="text-natural-text/40 text-[10px] font-bold tracking-[0.3em] uppercase">
            Complete Your Experience
          </p>
          <div className="grid grid-cols-2 gap-4">
            {recommendation.crossSellProductIds.map((id, idx) => {
              const p = getProduct(id);
              if (!p) return null;
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + idx * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-natural-paper border border-natural-border rounded-3xl p-4 space-y-3 hover:shadow-lg hover:border-natural-accent/30 transition-all"
                >
                  <div className="h-28 rounded-2xl overflow-hidden bg-natural-muted">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Coffee className="w-6 h-6 text-natural-text/20" />
                      </div>
                    )}
                  </div>
                  <p className="font-serif font-bold text-natural-text text-sm leading-snug">
                    {p.name}
                  </p>
                  <p className="text-natural-accent font-bold text-sm">
                    ₹{p.price.toLocaleString("en-IN")}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      <button
        onClick={onReset}
        className="w-full py-4 text-natural-text/40 hover:text-natural-text text-xs font-bold tracking-[0.25em] uppercase transition-colors"
      >
        Start over
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// ProductShortlist — live grid of products on the right pane.
// Filters products as the user answers. Cards remaining in the
// shortlist stay vivid; eliminated cards dim and shrink.
// ─────────────────────────────────────────────────────────────
function shortlistProducts(
  products: Product[],
  answers: Record<string, string>,
  note: string
): Set<string> {
  const noteLower = note.toLowerCase();
  return new Set(
    products
      .filter((p) => {
        const tags = (p.tags ?? []).map((t) => t.toLowerCase());
        const text = [
          p.name,
          p.description,
          p.category,
          p.roastLevel,
          (p.flavorNotes ?? []).join(" "),
          tags.join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        // ── style: black / milk / cold / sweet
        if (answers.style === "black") {
          // Black drinkers don't want sweetened/flavoured/instant lattes
          if (/latte|frapp|mocha|sweet|sugar|caramel/.test(text)) return false;
        }
        if (answers.style === "cold") {
          // Prefer cold-friendly: cold brew bags, easy bags, instant
          // Drop heavy ritual-only beans-roast specifics? keep beans but bias
          if (/french press only|pour over only/.test(text)) return false;
        }
        if (answers.style === "milk") {
          // Drop very light/fruity citrus single origins that don't take milk well
          if (p.roastLevel === "light" && /citrus|tea-like|floral/.test(text))
            return false;
        }

        // ── brew: easy / ritual / cold_brew / cafe
        if (answers.brew === "easy") {
          // Keep only easy-brew formats: bags, instant, pods
          if (p.type === "beans" && !/instant|easy|drip bag|pour bag/.test(text))
            return false;
        }
        if (answers.brew === "ritual") {
          // Ritual drinkers want whole beans / pour-over / french press
          if (p.type === "bags" && !/whole bean/.test(text)) return false;
        }
        if (answers.brew === "cold_brew") {
          if (p.type === "beans" && p.roastLevel === "light") return false;
        }
        if (answers.brew === "cafe") {
          // Cafe-first crowd: lean towards merch + sample/gift kits
          if (p.type === "beans" && p.category !== "gift") {
            // keep popular high-rated beans only
            if ((p.rating ?? 0) < 4.5) return false;
          }
        }

        // ── flavor: bold / sweet_flavor / fruity / earthy
        if (answers.flavor === "bold") {
          if (p.roastLevel === "light") return false;
        }
        if (answers.flavor === "fruity") {
          if (p.roastLevel === "dark") return false;
        }
        if (answers.flavor === "sweet_flavor") {
          if (p.roastLevel === "light" && /citrus|tea-like/.test(text)) return false;
        }
        if (answers.flavor === "earthy") {
          if (p.roastLevel === "light") return false;
        }

        // ── time: evening prefers decaf/low-caffeine
        if (answers.time === "evening") {
          if (/intense|extra caffeine|high caffeine/.test(text)) return false;
        }

        // ── nature: igniter prefers bold
        if (answers.nature === "intense") {
          if (p.roastLevel === "light") return false;
        }
        if (answers.nature === "calm") {
          if (/intense|bold blast/.test(text)) return false;
        }

        // ── freeform note: drop products clearly mismatched
        if (noteLower) {
          if (/no milk|black only/.test(noteLower) && /latte|frapp|mocha/.test(text))
            return false;
          if (/decaf/.test(noteLower) && !/decaf/.test(text) && p.type === "beans")
            return false;
          if (/iced|cold|chilled/.test(noteLower) && p.type === "beans" && p.roastLevel === "light")
            return false;
          if (/strong|bold|dark/.test(noteLower) && p.roastLevel === "light") return false;
          if (/light|fruity|bright/.test(noteLower) && p.roastLevel === "dark") return false;
        }

        return true;
      })
      .map((p) => p._id)
  );
}

// Returns top 2 products per category from the shortlisted set, sorted by rating.
function topPerCategory(products: Product[], shortlistedIds: Set<string>): Product[] {
  const filtered = products.filter((p) => shortlistedIds.has(p._id));
  const byCat = new Map<string, Product[]>();
  for (const p of filtered) {
    const key = p.category || p.type;
    if (!byCat.has(key)) byCat.set(key, []);
    byCat.get(key)!.push(p);
  }
  const result: Product[] = [];
  for (const [, group] of byCat) {
    group.sort((a, b) => {
      const r = (b.rating ?? 0) - (a.rating ?? 0);
      return r !== 0 ? r : (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
    });
    result.push(...group.slice(0, 2));
  }
  return result;
}

// Score shortlisted products by relevance to user answers — higher = better match.
function rankProducts(
  products: Product[],
  answers: Record<string, string>,
  note: string
): Array<{ product: Product; score: number }> {
  const noteLower = note.toLowerCase();
  return products
    .map((p) => {
      let score = (p.rating ?? 4) * 2;
      const text = [
        p.name, p.description, p.category, p.roastLevel,
        (p.flavorNotes ?? []).join(" "), (p.tags ?? []).join(" "),
      ].filter(Boolean).join(" ").toLowerCase();

      if (answers.flavor === "bold"         && (p.roastLevel === "dark" || /bold|strong|intense/.test(text))) score += 8;
      if (answers.flavor === "fruity"       && (p.roastLevel === "light" || /fruit|berry|citrus|bright/.test(text))) score += 8;
      if (answers.flavor === "sweet_flavor" && /caramel|chocolate|sweet|honey|nutty/.test(text)) score += 7;
      if (answers.flavor === "earthy"       && /earth|wood|smoky|malt|spice/.test(text)) score += 7;

      if (answers.brew === "easy"       && p.type === "bags") score += 8;
      if (answers.brew === "ritual"     && p.type === "beans") score += 6;
      if (answers.brew === "cold_brew"  && /cold brew/.test(text)) score += 10;

      if (answers.style === "black" && !/latte|frapp|mocha/.test(text)) score += 4;
      if (answers.style === "cold"  && /cold|iced|chill/.test(text)) score += 6;
      if (answers.style === "milk"  && p.roastLevel !== "light") score += 3;

      if (answers.nature === "intense"  && (p.roastLevel === "dark" || /bold|strong/.test(text))) score += 5;
      if (answers.nature === "calm"     && p.roastLevel === "light") score += 4;
      if (answers.nature === "creative" && /single origin|micro.?lot/.test(text)) score += 3;

      if (answers.time === "morning" && (p.roastLevel === "medium" || p.roastLevel === "dark")) score += 3;
      if (answers.time === "evening" && !/intense|extra caffeine/.test(text)) score += 3;

      if (noteLower) {
        if (/strong|bold|dark/.test(noteLower)   && (p.roastLevel === "dark" || /strong/.test(text))) score += 10;
        if (/light|fruity|bright/.test(noteLower) && p.roastLevel === "light") score += 10;
        if (/cold|iced|chill/.test(noteLower)    && /cold/.test(text)) score += 10;
        if (/milk|latte/.test(noteLower)          && p.roastLevel !== "light") score += 6;
        if (/easy|quick|bag/.test(noteLower)      && p.type === "bags") score += 8;
        if (/origin|single/.test(noteLower)       && /single origin/.test(text)) score += 8;
      }
      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score);
}

function ProductShortlist({
  answers,
  note,
  step,
  loading,
  recommendation,
  products,
}: {
  answers: Record<string, string>;
  note: string;
  step: number;
  loading: boolean;
  recommendation: RecommendationResult | null;
  products: Product[];
}) {
  const shortlist = shortlistProducts(products, answers, note);
  const primaryIds = new Set(recommendation?.primaryProductIds ?? []);
  const isFinal = !!recommendation;
  const rawProducts = isFinal
    ? products.filter((p) => primaryIds.has(p._id))
    : rankProducts(products.filter((p) => shortlist.has(p._id)), answers, note).map((r) => r.product);
  const displayProducts = rawProducts.map((p, i) => ({ product: p, rank: i + 1 }));
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="relative w-full h-full flex flex-col min-h-0">
      {/* Header strip */}
      <div className="shrink-0 px-6 sm:px-8 py-4 border-b border-natural-border/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-natural-text/55">
            {isFinal ? "Your match" : loading ? "Brewing" : "Best picks"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-serif font-black text-natural-text tabular-nums">
            {displayProducts.length}
          </span>
          <span className="text-natural-text/40 text-xs font-medium">
            {isFinal ? "matched" : "curated"}
          </span>
          {!isFinal && answeredCount > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-natural-accent/10 text-natural-accent text-[9px] font-bold tracking-[0.2em] uppercase">
              {answeredCount} {answeredCount === 1 ? "answer" : "answers"}
            </span>
          )}
        </div>
      </div>

      {/* Product grid */}
      <div className="flex-1 min-h-0 overflow-hidden px-3 sm:px-4 py-3">
        {products.length === 0 ? (
          <div className="flex items-center justify-center h-full text-natural-text/40 text-sm">
            <Coffee className="w-4 h-4 mr-2 animate-pulse" /> Loading our collection…
          </div>
        ) : (
          <>
            {/* Mobile: horizontal scroll strip */}
            <div
              className="lg:hidden flex gap-2 h-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [overscroll-behavior-x:contain]"
              style={{ WebkitOverflowScrolling: "touch" as any, touchAction: "pan-x" }}
              data-lenis-prevent
            >
              <AnimatePresence mode="popLayout">
                {displayProducts.slice(0, 8).map(({ product: p, rank }) => {
                  const isPrimary = primaryIds.has(p._id);
                  return (
                    <motion.div
                      key={p._id}
                      layout
                      initial={{ opacity: 0, scale: 0.88 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.88 }}
                      transition={{ duration: 0.3 }}
                      className={`relative flex-shrink-0 w-24 h-full rounded-xl overflow-hidden border ${
                        isPrimary ? "border-natural-accent ring-2 ring-natural-accent/40" : "border-natural-border"
                      }`}
                    >
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-natural-muted flex items-center justify-center">
                          <Coffee className="w-5 h-5 text-natural-text/20" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-linear-to-t from-black/75 to-transparent">
                        <p className="text-white font-serif font-bold text-[9px] leading-tight line-clamp-2">{p.name}</p>
                        <p className="text-white/70 text-[9px] mt-0.5">₹{p.price.toLocaleString("en-IN")}</p>
                      </div>
                      <div className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black shadow-md ${
                        rank === 1 ? "bg-amber-400 text-amber-900" : rank === 2 ? "bg-slate-300 text-slate-800" : rank === 3 ? "bg-orange-500 text-white" : "bg-black/55 text-white"
                      }`}>{rank}</div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Desktop: 2-col × 3-row compact grid, fills panel height */}
            <div className="hidden lg:grid grid-cols-2 grid-rows-3 gap-2 h-full">
              <AnimatePresence mode="popLayout">
                {displayProducts.slice(0, 6).map(({ product: p, rank }) => {
                  const isPrimary = primaryIds.has(p._id);
                  return (
                    <motion.div
                      key={p._id}
                      layout
                      initial={{ opacity: 0, scale: 0.88 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.88 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className={`relative rounded-xl overflow-hidden border bg-natural-paper ${
                        isPrimary
                          ? "border-natural-accent shadow-lg shadow-natural-accent/20 ring-2 ring-natural-accent/30"
                          : "border-natural-border"
                      }`}
                    >
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-natural-muted flex items-center justify-center">
                          <Coffee className="w-6 h-6 text-natural-text/20" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-linear-to-t from-black/70 via-black/30 to-transparent">
                        <p className="text-white font-serif font-bold text-[11px] leading-tight line-clamp-1">{p.name}</p>
                        <p className="text-white/75 text-[10px] mt-0.5">₹{p.price.toLocaleString("en-IN")}</p>
                      </div>
                      <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-md ${
                        rank === 1 ? "bg-amber-400 text-amber-900" : rank === 2 ? "bg-slate-300 text-slate-800" : rank === 3 ? "bg-orange-500 text-white" : "bg-black/55 text-white"
                      }`}>{rank}</div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Progress hint */}
      <div className="shrink-0 px-6 sm:px-8 py-3 border-t border-natural-border/50 text-center">
        <p className="text-natural-text/40 text-[10px] tracking-[0.3em] uppercase font-bold">
          {isFinal
            ? "Match revealed"
            : loading
            ? "Reading your taste…"
            : `Curating · step ${step + 1}/${QUESTIONS.length}`}
        </p>
      </div>
    </div>
  );
}
