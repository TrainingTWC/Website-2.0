import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from "motion/react";
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

// Pseudo-random particle field (warm coffee tones — floating bean motes)
const PARTICLES = Array.from({ length: 38 }, (_, i) => ({
  id: i,
  x: (i * 73.7 + 17.3) % 100,
  y: (i * 47.1 + 31.9) % 100,
  size: ((i % 4) + 2) * 0.9,
  opacity: 0.08 + ((i * 0.09) % 0.18),
  delay: (i * 0.13) % 6,
  duration: 6 + ((i * 0.21) % 6),
  depth: (i % 3) + 1, // 1=far, 3=near — drives parallax intensity
}));

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
  open?: boolean;
  onClose?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Mouse-parallax hook — returns smoothed motion values [-1, 1]
// ─────────────────────────────────────────────────────────────
function useMouseParallax() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 60, damping: 20, mass: 0.6 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mx.set(x);
      my.set(y);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [mx, my]);

  return { x: sx, y: sy };
}

export function DiscoveryWidget({ open, onClose }: DiscoveryWidgetProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] =
    useState<RecommendationResult | null>(null);
  const [direction, setDirection] = useState(1);

  const { x: mouseX, y: mouseY } = useMouseParallax();

  // Parallax transforms for ambient layers
  const orb1X = useTransform(mouseX, [-1, 1], [-30, 30]);
  const orb1Y = useTransform(mouseY, [-1, 1], [-20, 20]);
  const orb2X = useTransform(mouseX, [-1, 1], [25, -25]);
  const orb2Y = useTransform(mouseY, [-1, 1], [15, -15]);
  const orb3X = useTransform(mouseX, [-1, 1], [-15, 15]);
  const orb3Y = useTransform(mouseY, [-1, 1], [-10, 10]);

  useEffect(() => {
    if (open !== undefined) setIsOpen(open);
  }, [open]);

  const products = useQuery(api.products.list);
  const getRecommendation = useAction(api.recommendations.getRecommendation);
  const createSession = useMutation(api.sessions.create);

  const q = QUESTIONS[step];
  const hasAnswer = !!answers[q?.id];

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  };

  const nextStep = () => {
    if (!hasAnswer) return;
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
    setStep(0);
    setDirection(1);
    setAnswers({});
    setNote("");
    setRecommendation(null);
    setLoading(false);
    setIsOpen(false);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-110 overflow-hidden font-sans"
          style={{
            background:
              "radial-gradient(ellipse at 20% 10%, #F5F2ED 0%, #EFEAE1 35%, #E6DECF 70%, #DDD1BC 100%)",
          }}
        >
          {/* ── Layer 1 (far) — soft ambient orbs with parallax ── */}
          <motion.div
            style={{ x: orb1X, y: orb1Y }}
            className="absolute top-[10%] left-[5%] w-150 h-150 rounded-full blur-[120px] pointer-events-none"
          >
            <div className="w-full h-full rounded-full bg-natural-accent/15" />
          </motion.div>
          <motion.div
            style={{ x: orb2X, y: orb2Y }}
            className="absolute bottom-[5%] right-[8%] w-125 h-125 rounded-full blur-[100px] pointer-events-none"
          >
            <div className="w-full h-full rounded-full bg-[#8B6F47]/15" />
          </motion.div>
          <motion.div
            style={{ x: orb3X, y: orb3Y }}
            className="absolute top-[55%] left-[55%] w-100 h-100 rounded-full blur-[90px] pointer-events-none"
          >
            <div className="w-full h-full rounded-full bg-[#3E5C76]/10" />
          </motion.div>

          {/* ── Layer 2 — floating particle field with depth-based parallax ── */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {PARTICLES.map((p) => {
              const intensity = p.depth * 12;
              return (
                <FloatingParticle
                  key={p.id}
                  particle={p}
                  mouseX={mouseX}
                  mouseY={mouseY}
                  intensity={intensity}
                />
              );
            })}
          </div>

          {/* ── Layer 3 — subtle paper grain texture ── */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30 mix-blend-multiply"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.17 0 0 0 0 0.09 0 0 0 0 0.06 0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />

          {/* ── Top bar — premium glass ── */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-6"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <img
                  src={asset("third-intelligence-icon.png")}
                  alt=""
                  className="w-full h-full object-contain drop-shadow-md"
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
            <motion.button
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onClick={reset}
              className="p-2.5 rounded-full bg-natural-paper/70 hover:bg-natural-paper border border-natural-border shadow-sm text-natural-text/60 hover:text-natural-text backdrop-blur-md"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </motion.div>

          {/* ── Main content — split: controls (left) | curation canvas (right) ── */}
          <div className="relative z-10 h-full pt-20 grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            {/* LEFT — controls (40%) */}
            <div className="relative flex flex-col px-6 sm:px-10 pb-8 overflow-y-auto scrollbar-hide">
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
                  mouseX={mouseX}
                  mouseY={mouseY}
                />
              )}
            </div>

            {/* RIGHT — live curation canvas (60%) */}
            <div className="relative hidden lg:block border-l border-natural-border/60 bg-linear-to-br from-natural-paper/40 via-natural-paper/10 to-transparent overflow-hidden">
              <CurationCanvas
                answers={answers}
                note={note}
                step={step}
                loading={loading}
                recommendation={recommendation}
                products={products ?? []}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
// Floating particle — drifts vertically + parallax follows mouse
// ─────────────────────────────────────────────────────────────
function FloatingParticle({
  particle,
  mouseX,
  mouseY,
  intensity,
}: {
  particle: (typeof PARTICLES)[number];
  mouseX: import("motion/react").MotionValue<number>;
  mouseY: import("motion/react").MotionValue<number>;
  intensity: number;
}) {
  const px = useTransform(mouseX, [-1, 1], [-intensity, intensity]);
  const py = useTransform(mouseY, [-1, 1], [-intensity, intensity]);
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${particle.x}%`,
        top: `${particle.y}%`,
        width: particle.size,
        height: particle.size,
        x: px,
        y: py,
        backgroundColor: "rgba(44, 24, 16, 0.5)",
      }}
      animate={{
        y: [0, -25, 0],
        opacity: [particle.opacity, particle.opacity * 0.3, particle.opacity],
      }}
      transition={{
        duration: particle.duration,
        repeat: Infinity,
        delay: particle.delay,
        ease: "easeInOut",
      }}
    />
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
  mouseX,
  mouseY,
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
  mouseX: import("motion/react").MotionValue<number>;
  mouseY: import("motion/react").MotionValue<number>;
}) {
  // Subtle 3D rotation on the whole card stack following mouse
  const stackRotateY = useTransform(mouseX, [-1, 1], [-2, 2]);
  const stackRotateX = useTransform(mouseY, [-1, 1], [1.5, -1.5]);

  return (
    <motion.div
      style={{ rotateX: stackRotateX, rotateY: stackRotateY, transformPerspective: 1200 }}
      className="w-full max-w-xl mx-auto preserve-3d flex-1 flex flex-col justify-center py-6"
    >
      {/* Progress dots */}
      <div className="flex items-center justify-start gap-2 mb-8">
        {QUESTIONS.map((_, i) => (
          <motion.div
            key={i}
            animate={{
              width: i === step ? 28 : 6,
              opacity: i <= step ? 1 : 0.25,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="h-1.5 rounded-full"
            style={{
              backgroundColor: i <= step ? "var(--color-natural-accent)" : "var(--color-natural-stone)",
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: direction * 30, rotateY: direction * 6 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          exit={{ opacity: 0, x: direction * -30, rotateY: direction * -6 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6 preserve-3d"
        >
          <div className="space-y-2">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-natural-accent text-[10px] font-bold tracking-[0.35em] uppercase"
            >
              Question {step + 1} of {QUESTIONS.length}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.55 }}
              className="text-3xl sm:text-4xl font-serif font-bold text-natural-text leading-[1.05] tracking-tight"
            >
              {q.question}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-natural-text/45 text-sm italic"
            >
              {q.subtitle}
            </motion.p>
          </div>

          {/* 4 option cards — single column on narrow, two cols when wide */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options.map((opt, idx) => (
              <TiltOption
                key={opt.value}
                idx={idx}
                opt={opt}
                selected={answers[q.id] === opt.value}
                onSelect={() => onAnswer(opt.value)}
              />
            ))}
          </div>

          {/* Freeform note — tell us anything */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-natural-text/40">
              <Sparkles className="w-3 h-3" /> Or tell us anything
            </label>
            <textarea
              value={note}
              onChange={(e) => onNote(e.target.value)}
              placeholder="e.g. I want something smoky for the monsoon mornings…"
              rows={2}
              className="w-full resize-none rounded-2xl border border-natural-border/70 bg-natural-paper/60 backdrop-blur-sm p-3 text-sm text-natural-text placeholder:text-natural-text/30 focus:outline-none focus:border-natural-accent focus:bg-natural-paper transition-all"
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <motion.button
          onClick={onPrev}
          whileHover={step > 0 ? { x: -3 } : {}}
          className={`flex items-center gap-2 text-natural-text/50 hover:text-natural-text text-xs font-bold tracking-[0.2em] uppercase transition-colors ${
            step === 0 ? "opacity-0 pointer-events-none" : ""
          }`}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </motion.button>
        <motion.button
          onClick={onNext}
          disabled={!hasAnswer && !note.trim()}
          whileHover={hasAnswer || note.trim() ? { scale: 1.04, y: -2 } : {}}
          whileTap={hasAnswer || note.trim() ? { scale: 0.97 } : {}}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`px-8 py-3.5 rounded-full font-bold text-sm tracking-wide transition-all flex items-center gap-2 ${
            hasAnswer || note.trim()
              ? "bg-natural-text text-white shadow-xl shadow-natural-text/20 hover:bg-natural-accent"
              : "bg-natural-muted text-natural-text/30 cursor-not-allowed"
          }`}
        >
          {step === QUESTIONS.length - 1 ? "Brew My Match" : "Continue"}
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3D-tilt option card (hover-following perspective)
// ─────────────────────────────────────────────────────────────
function TiltOption({
  idx,
  opt,
  selected,
  onSelect,
}: {
  idx: number;
  opt: { label: string; sub: string; value: string };
  selected: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 200, damping: 20 });
  const sy = useSpring(my, { stiffness: 200, damping: 20 });
  const rotateY = useTransform(sx, [-1, 1], [-8, 8]);
  const rotateX = useTransform(sy, [-1, 1], [6, -6]);
  const glowX = useTransform(sx, [-1, 1], ["0%", "100%"]);
  const glowY = useTransform(sy, [-1, 1], ["0%", "100%"]);
  const glow = useMotionTemplate`radial-gradient(400px circle at ${glowX} ${glowY}, rgba(90,90,64,0.18), transparent 50%)`;

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const handleLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.button
      ref={ref}
      initial={{ opacity: 0, y: 20, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 0.35 + idx * 0.08, type: "spring", stiffness: 150, damping: 18 }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
      }}
      className={`relative p-6 rounded-3xl text-left border transition-all duration-300 overflow-hidden preserve-3d ${
        selected
          ? "bg-natural-paper border-natural-accent shadow-xl shadow-natural-accent/15"
          : "bg-natural-paper/60 border-natural-border hover:border-natural-accent/40 hover:bg-natural-paper backdrop-blur-sm"
      }`}
    >
      {/* Hover glow following cursor */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: glow, opacity: selected ? 0.5 : 1 }}
      />
      <div className="relative z-10" style={{ transform: "translateZ(20px)" }}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <p
            className={`font-serif font-bold text-base leading-snug ${
              selected ? "text-natural-text" : "text-natural-text/85"
            }`}
          >
            {opt.label}
          </p>
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="shrink-0 w-5 h-5 rounded-full bg-natural-accent flex items-center justify-center"
              >
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p
          className={`text-xs leading-relaxed ${
            selected ? "text-natural-text/60" : "text-natural-text/40"
          }`}
        >
          {opt.sub}
        </p>
      </div>
    </motion.button>
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
      className="w-full max-w-2xl overflow-y-auto max-h-[80vh] space-y-7 pb-6 pr-2 scrollbar-hide"
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
// CurationCanvas — the right-side live "build your coffee" stage.
// As the user answers, the cup colour, foam, ice, accent shift, and
// floating attribute chips swirl around the cup. Once we have a
// recommendation, the canvas locks onto the chosen product.
// ─────────────────────────────────────────────────────────────
function CurationCanvas({
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
  // Derive visual attributes from answers
  const style = answers.style;
  const time = answers.time;
  const flavor = answers.flavor;
  const brew = answers.brew;
  const nature = answers.nature;

  // Liquid colour — black/milk/cold/sweet
  const liquidGradient =
    style === "milk"
      ? "linear-gradient(180deg, #C4A07A 0%, #8A6740 60%, #5C4326 100%)"
      : style === "cold"
      ? "linear-gradient(180deg, #4A3326 0%, #2C1810 100%)"
      : style === "sweet"
      ? "linear-gradient(180deg, #B07A4F 0%, #6B3F22 60%, #3E2412 100%)"
      : "linear-gradient(180deg, #3A2418 0%, #1F1209 100%)";

  // Sky/background tint — time of day
  const skyGradient =
    time === "morning"
      ? "linear-gradient(180deg, #F8E8D0 0%, #F0DAB8 100%)"
      : time === "afternoon"
      ? "linear-gradient(180deg, #FAEED5 0%, #E8D2A8 100%)"
      : time === "evening"
      ? "linear-gradient(180deg, #2F1F18 0%, #4A2F22 100%)"
      : "linear-gradient(180deg, #F1E7D5 0%, #DCC7A0 100%)";

  // Accent ring around cup — based on nature
  const accentRing =
    nature === "intense"
      ? "rgba(180, 60, 30, 0.6)"
      : nature === "creative"
      ? "rgba(180, 130, 60, 0.55)"
      : nature === "curious"
      ? "rgba(90, 130, 110, 0.55)"
      : "rgba(120, 100, 80, 0.55)";

  const hasMilk = style === "milk" || style === "sweet";
  const hasIce = style === "cold";

  // Build floating chips from answers
  const chipMap: Record<string, string> = {
    morning: "Dawn ritual",
    afternoon: "Midday reset",
    evening: "Evening warmth",
    anytime: "Always on",
    black: "Pure black",
    milk: "Silky milk",
    cold: "Iced",
    sweet: "Crafted sweet",
    calm: "Anchor",
    intense: "Igniter",
    creative: "Creator",
    curious: "Seeker",
    creative_work: "Ideas & art",
    tech_work: "Code & systems",
    social_work: "People & stories",
    physical_work: "On the move",
    bold: "Bold & dark",
    sweet_flavor: "Caramel sweet",
    fruity: "Bright & fruity",
    earthy: "Earthy & deep",
    easy: "Quick brew",
    ritual: "Slow ritual",
    cold_brew: "Cold brew",
    cafe: "Cafe-first",
  };
  const chips = Object.values(answers)
    .map((v) => chipMap[v])
    .filter(Boolean);

  const firstProduct =
    recommendation && products.find((p) => p._id === recommendation.primaryProductIds[0]);

  // Progress through the build (0 → 1)
  const progress = Math.min(1, Object.keys(answers).length / 6);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Sky / time-of-day background */}
      <motion.div
        animate={{ background: skyGradient }}
        transition={{ duration: 1.2 }}
        className="absolute inset-0"
        style={{ background: skyGradient }}
      />

      {/* Soft radial glow behind cup */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 65%, rgba(255,240,210,0.4) 0%, transparent 60%)",
        }}
      />

      {/* Step label */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        <span className="h-px w-10 bg-current opacity-30" />
        <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-natural-text/55">
          {recommendation
            ? "Your match"
            : loading
            ? "Brewing"
            : `Curating · step ${step + 1}/${QUESTIONS.length}`}
        </span>
        <span className="h-px w-10 bg-current opacity-30" />
      </div>

      {/* Progress bar */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 w-40 h-0.5 bg-natural-text/10 rounded-full overflow-hidden z-10">
        <motion.div
          className="h-full bg-natural-accent"
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        />
      </div>

      {/* If recommendation, swap the cup for the actual product image */}
      <AnimatePresence mode="wait">
        {firstProduct ? (
          <motion.div
            key="product"
            initial={{ opacity: 0, scale: 0.7, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="relative w-[70%] max-w-md aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border border-natural-border">
              {firstProduct.imageUrl ? (
                <img
                  src={firstProduct.imageUrl}
                  alt={firstProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-natural-muted" />
              )}
              <div className="absolute inset-x-0 bottom-0 p-6 bg-linear-to-t from-black/70 via-black/30 to-transparent text-white">
                <p className="text-[10px] font-bold tracking-[0.35em] uppercase opacity-80">
                  Your Cup
                </p>
                <h3 className="font-serif font-black text-2xl leading-tight mt-1">
                  {firstProduct.name}
                </h3>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <CoffeeCupGraphic
              liquidGradient={liquidGradient}
              accentRing={accentRing}
              hasMilk={hasMilk}
              hasIce={hasIce}
              dark={time === "evening"}
              flavor={flavor}
              brew={brew}
              loading={loading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating attribute chips orbiting the cup */}
      <div className="absolute inset-0 pointer-events-none">
        <AnimatePresence>
          {chips.map((label, i) => {
            // Distribute chips around the cup on an ellipse
            const angle = (i / Math.max(chips.length, 1)) * Math.PI * 2 - Math.PI / 2;
            const rx = 38; // pct
            const ry = 32; // pct
            const left = 50 + Math.cos(angle) * rx;
            const top = 55 + Math.sin(angle) * ry;
            return (
              <motion.div
                key={label + i}
                initial={{ opacity: 0, scale: 0.6, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{
                  delay: i * 0.06,
                  type: "spring",
                  stiffness: 200,
                  damping: 18,
                }}
                style={{
                  position: "absolute",
                  left: `${left}%`,
                  top: `${top}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 3 + (i % 3),
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="px-3 py-1.5 rounded-full bg-natural-paper/85 backdrop-blur-sm border border-natural-border shadow-lg text-[10px] font-bold tracking-wider uppercase text-natural-text whitespace-nowrap"
                >
                  <span className="inline-block w-1 h-1 rounded-full bg-natural-accent mr-1.5 align-middle" />
                  {label}
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Freeform note bubble — bottom right */}
      <AnimatePresence>
        {note.trim() && !recommendation && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="absolute bottom-6 right-6 max-w-xs"
          >
            <div className="relative px-4 py-3 rounded-2xl rounded-br-sm bg-natural-text text-white shadow-2xl">
              <p className="text-[9px] font-bold tracking-[0.3em] uppercase opacity-60 mb-1">
                Your note
              </p>
              <p className="text-sm italic leading-snug">"{note}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CoffeeCupGraphic — animated cup that fills, takes on milk/ice
// ─────────────────────────────────────────────────────────────
function CoffeeCupGraphic({
  liquidGradient,
  accentRing,
  hasMilk,
  hasIce,
  dark,
  flavor,
  brew,
  loading,
}: {
  liquidGradient: string;
  accentRing: string;
  hasMilk: boolean;
  hasIce: boolean;
  dark: boolean;
  flavor?: string;
  brew?: string;
  loading: boolean;
}) {
  return (
    <div className="relative w-[58%] max-w-sm aspect-square flex items-center justify-center">
      {/* Accent ring (nature) */}
      <motion.div
        className="absolute inset-0 rounded-full blur-2xl"
        animate={{
          backgroundColor: accentRing,
          scale: loading ? [1, 1.15, 1] : 1,
        }}
        transition={{
          backgroundColor: { duration: 1 },
          scale: { duration: 2, repeat: loading ? Infinity : 0 },
        }}
        style={{ opacity: 0.6 }}
      />

      {/* Saucer */}
      <div
        className={`absolute bottom-[18%] left-1/2 -translate-x-1/2 w-[88%] h-6 rounded-full shadow-2xl ${
          dark ? "bg-[#1A1108]" : "bg-natural-paper"
        }`}
        style={{
          boxShadow: dark
            ? "0 30px 50px rgba(0,0,0,0.5)"
            : "0 30px 50px rgba(80,60,40,0.25)",
        }}
      />

      {/* Cup body */}
      <div
        className={`absolute bottom-[24%] left-1/2 -translate-x-1/2 w-[60%] aspect-square rounded-b-full rounded-t-2xl overflow-hidden border-2 ${
          dark ? "bg-[#22160E] border-[#3A2418]" : "bg-natural-paper border-natural-border"
        }`}
        style={{
          boxShadow: dark
            ? "inset 0 -20px 30px rgba(0,0,0,0.4)"
            : "inset 0 -20px 30px rgba(80,60,40,0.15)",
        }}
      >
        {/* Liquid level */}
        <motion.div
          className="absolute inset-x-0 bottom-0"
          initial={{ height: "0%" }}
          animate={{ height: "78%" }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: liquidGradient }}
        >
          {/* Surface ripple */}
          <motion.div
            className="absolute inset-x-0 top-0 h-2 opacity-50"
            animate={{ x: [0, 6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,250,235,0.4), transparent)",
            }}
          />

          {/* Milk foam crema */}
          {hasMilk && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute inset-x-0 top-0 h-5 bg-linear-to-b from-[#F8EBD5] to-[#E5C7A0]"
              style={{ borderRadius: "50% 50% 0 0 / 100% 100% 0 0" }}
            />
          )}

          {/* Ice cubes */}
          {hasIce && (
            <div className="absolute inset-x-0 top-1 flex justify-center gap-1 px-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 0.8 }}
                  transition={{ delay: 0.4 + i * 0.1, type: "spring" }}
                  className="w-5 h-5 rounded-md bg-white/40 border border-white/60 backdrop-blur-sm"
                />
              ))}
            </div>
          )}

          {/* Steam plumes — only for hot drinks */}
          {!hasIce && (
            <div className="absolute -top-20 inset-x-0 flex justify-center gap-3 pointer-events-none">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 rounded-full"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: ["0px", "60px", "0px"],
                    opacity: [0, 0.5, 0],
                    y: [0, -20, -40],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: "easeOut",
                  }}
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,240,220,0.6) 0%, transparent 100%)",
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Cup handle */}
      <div
        className={`absolute bottom-[34%] right-[18%] w-7 h-12 rounded-full border-2 ${
          dark ? "border-[#3A2418]" : "border-natural-border"
        }`}
        style={{ borderLeftColor: "transparent" }}
      />

      {/* Floating flavor pellets — petals/beans rising into the cup */}
      {flavor && (
        <div className="absolute inset-0 pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 bottom-[60%] w-2 h-2 rounded-full"
              style={{
                backgroundColor:
                  flavor === "fruity"
                    ? "#C44E5E"
                    : flavor === "sweet_flavor"
                    ? "#C99A6A"
                    : flavor === "earthy"
                    ? "#6B5039"
                    : "#3A2418",
              }}
              animate={{
                y: [0, -40, -80],
                x: [0, (i % 2 === 0 ? 1 : -1) * 12, 0],
                opacity: [0, 1, 0],
                scale: [0.6, 1, 0.4],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                delay: i * 0.7,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Brew tool badge — bottom hint */}
      {brew && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-natural-text/85 backdrop-blur-sm text-white text-[9px] font-bold tracking-[0.3em] uppercase"
        >
          {brew === "easy"
            ? "Quick brew"
            : brew === "ritual"
            ? "Slow ritual"
            : brew === "cold_brew"
            ? "Cold brew"
            : "Cafe"}
        </motion.div>
      )}
    </div>
  );
}

