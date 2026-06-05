import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import {
  User,
  Sun,
  Coffee,
  Quote,
} from "lucide-react";
import { TIIcon } from "./TIIcon";
import type { ProductPersonality } from "../../convex/productContext";

interface PersonalitySectionProps {
  personality: ProductPersonality;
  productName: string;
  /** Hex/gradient accent for archetype-specific tinting */
  accentHex: string;
}

/**
 * Cinematic, parallax-rich section that surfaces a product's "personality"
 * (archetype, voice, ideal customer, mood, ritual) below the hero on the
 * product page.
 *
 * Visual recipe:
 *   • Layered parallax: a giant ghost-text of the archetype scrolls slower
 *     than the foreground, two blurred orbs drift on opposite vectors.
 *   • Big serif headline + tagline as the focal point.
 *   • Three "trait" cards with large Lucide icons (treated as illustrations).
 *   • Voice descriptors as floating pills.
 *
 * Theme: pulls a single accentHex from the page's product theme so each
 * product's personality feels keyed to its identity (e.g. dark roast =
 * amber, light roast = peach, merch = stone).
 */
export function PersonalitySection({
  personality,
  productName,
  accentHex,
}: PersonalitySectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Parallax transforms — different speeds = layered depth
  const ghostY = useTransform(scrollYProgress, [0, 1], ["20%", "-30%"]);
  const ghostOpacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 0.08, 0.08, 0]);
  const orbAY = useTransform(scrollYProgress, [0, 1], ["-15%", "25%"]);
  const orbBY = useTransform(scrollYProgress, [0, 1], ["20%", "-25%"]);
  const headlineY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);
  const taglineY = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-natural-paper border-y border-natural-border"
      aria-label={`${productName} personality`}
    >
      {/* ── Parallax decorative layer ──────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Orb A — top-left, accent tinted */}
        <motion.div
          style={{
            y: orbAY,
            background: `radial-gradient(circle, ${accentHex}55 0%, transparent 70%)`,
          }}
          className="absolute -left-32 top-10 w-[28rem] h-[28rem] rounded-full blur-3xl"
        />
        {/* Orb B — bottom-right, accent tinted, slower */}
        <motion.div
          style={{
            y: orbBY,
            background: `radial-gradient(circle, ${accentHex}40 0%, transparent 70%)`,
          }}
          className="absolute -right-24 bottom-0 w-[32rem] h-[32rem] rounded-full blur-3xl"
        />

        {/* Giant ghost archetype text — the parallax centerpiece */}
        <motion.div
          style={{ y: ghostY, opacity: ghostOpacity }}
          className="absolute inset-x-0 top-1/3 flex justify-center select-none"
        >
          <span
            className="font-serif font-black tracking-tight leading-none whitespace-nowrap text-natural-text"
            style={{ fontSize: "clamp(8rem, 22vw, 22rem)" }}
          >
            {personality.archetype.replace(/^The\s+/i, "").toUpperCase()}
          </span>
        </motion.div>
      </div>

      {/* ── Foreground content ─────────────────────────────────── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-24 sm:py-32">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <span
            className="h-px w-12"
            style={{ backgroundColor: accentHex }}
          />
          <span
            className="text-[10px] font-black uppercase tracking-[0.4em] text-natural-text/50"
          >
            Coffee Personality
          </span>
          <span
            className="h-px w-12"
            style={{ backgroundColor: accentHex }}
          />
        </motion.div>

        {/* Big headline */}
        <motion.h2
          style={{ y: headlineY }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif font-bold text-center text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-natural-text"
        >
          Meet{" "}
          <span className="italic" style={{ color: accentHex }}>
            {personality.archetype}
          </span>
        </motion.h2>

        {/* Tagline */}
        <motion.div
          style={{ y: taglineY }}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-3xl mx-auto mt-8 mb-16"
        >
          <Quote
            className="absolute -top-4 -left-2 w-8 h-8 opacity-30"
            style={{ color: accentHex }}
          />
          <p className="font-serif italic text-xl sm:text-2xl lg:text-3xl leading-snug text-natural-text/80 text-center px-6">
            {personality.tagline}
          </p>
        </motion.div>

        {/* Voice descriptor pills */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-20"
        >
          {personality.voice.map((word) => (
            <motion.span
              key={word}
              variants={{
                hidden: { opacity: 0, y: 12, scale: 0.9 },
                visible: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] border bg-white/60 backdrop-blur-sm"
              style={{
                color: accentHex,
                borderColor: `${accentHex}55`,
              }}
            >
              {word}
            </motion.span>
          ))}
        </motion.div>

        {/* Three trait cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <TraitCard
            icon={<User className="w-7 h-7" />}
            label="The drinker"
            body={personality.idealCustomer}
            accentHex={accentHex}
            delay={0}
          />
          <TraitCard
            icon={<Sun className="w-7 h-7" />}
            label="The mood"
            body={personality.mood}
            accentHex={accentHex}
            delay={0.1}
          />
          <TraitCard
            icon={<Coffee className="w-7 h-7" />}
            label="The ritual"
            body={personality.brewingRitual}
            accentHex={accentHex}
            delay={0.2}
          />
        </div>

        {/* Footer caption — ties it back to TI */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-center gap-2 mt-20 text-[10px] font-bold uppercase tracking-[0.35em] text-natural-text/40"
        >
          <TIIcon className="w-4 h-4" />
          Profile curated by Third Intelligence
          <TIIcon className="w-4 h-4" />
        </motion.p>
      </div>
    </section>
  );
}

// ── Trait card subcomponent ─────────────────────────────────────
function TraitCard({
  icon,
  label,
  body,
  accentHex,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  body: string;
  accentHex: string;
  delay: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });
  // Each card gets its own subtle vertical parallax — different per card
  const iconY = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-natural-bg/80 backdrop-blur-xl border border-natural-border rounded-3xl p-8 overflow-hidden group hover:shadow-2xl transition-shadow"
    >
      {/* Soft accent wash */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 80% 0%, ${accentHex}18 0%, transparent 60%)`,
        }}
      />

      {/* Big illustrated icon with parallax */}
      <motion.div
        style={{ y: iconY }}
        className="relative mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl"
      >
        <div
          className="absolute inset-0 rounded-2xl opacity-15"
          style={{ backgroundColor: accentHex }}
        />
        <div className="relative" style={{ color: accentHex }}>
          {icon}
        </div>
      </motion.div>

      {/* Label */}
      <p
        className="text-[10px] font-black uppercase tracking-[0.35em] mb-3 text-natural-text/50"
      >
        {label}
      </p>

      {/* Body */}
      <p className="text-natural-text/80 leading-relaxed text-[15px]">
        {body}
      </p>
    </motion.div>
  );
}
