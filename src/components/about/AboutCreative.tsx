"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * AboutCreative — playful primitives for the About section.
 *
 * Inspired by mana yerba maté: oversized typography, scattered floating
 * SVG decorations (stars, bubbles, flowers, leaves, planets, squiggles),
 * letter-spaced section titles, looping marquee strips, and rotated
 * "sticker" badges. Everything is themed via CSS variables so the
 * About-page accents and the global theme palettes still drive the look.
 *
 * All components are client-side because of motion. They're tree-shakable —
 * import only what each page uses.
 */

// ── SVG glyphs ──────────────────────────────────────────────────────────────

export function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2 L14.2 9.1 L21.5 9.5 L15.8 14 L17.7 21.2 L12 17 L6.3 21.2 L8.2 14 L2.5 9.5 L9.8 9.1 Z" />
    </svg>
  );
}

export function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 1 C12 8 14 10 23 12 C14 14 12 16 12 23 C12 16 10 14 1 12 C10 10 12 8 12 1 Z" />
    </svg>
  );
}

export function BubbleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="9" r="2" fill="currentColor" stroke="none" opacity="0.55" />
    </svg>
  );
}

export function FlowerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="12" cy="6" r="3.6" />
      <circle cx="6" cy="12" r="3.6" />
      <circle cx="18" cy="12" r="3.6" />
      <circle cx="12" cy="18" r="3.6" />
      <circle cx="12" cy="12" r="2.6" fill="#fff" opacity="0.55" />
    </svg>
  );
}

export function LeafIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3 21 C3 12 8 3.5 21 3 C20.5 16 12 21 3 21 Z" />
      <path d="M5 19 L17 7" stroke="#fff" strokeWidth="1" opacity="0.45" />
    </svg>
  );
}

export function SquiggleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 60 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...props}>
      <path d="M2 6 Q9 0 16 6 T30 6 T44 6 T58 6" />
    </svg>
  );
}

export function PlanetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <circle cx="12" cy="12" r="5" fill="currentColor" opacity="0.55" />
      <ellipse cx="12" cy="12" rx="11" ry="3.5" transform="rotate(-22 12 12)" />
    </svg>
  );
}

export function BeanIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <ellipse cx="12" cy="12" rx="6.5" ry="9.5" />
      <path d="M12 2.5 C8.5 7 8.5 17 12 21.5" stroke="#fff" strokeWidth="1.4" fill="none" opacity="0.7" />
    </svg>
  );
}

export function ArrowIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 12 H20" />
      <path d="M14 6 L20 12 L14 18" />
    </svg>
  );
}

// ── Decoration: a single floating glyph positioned absolutely ──────────────

export type DecorationProps = {
  /** Glyph component to render (StarIcon, BubbleIcon, etc). */
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** CSS positioning — e.g. "8%", "-2rem", etc. */
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  /** Pixel size of the glyph. */
  size?: number;
  /** Tailwind text-* class for color, or any class string. */
  className?: string;
  /** Inline color (overrides className). Useful for CSS vars. */
  color?: string;
  /** Initial rotation in degrees. */
  rotate?: number;
  /** Float distance in px. Higher = more dramatic float. */
  drift?: number;
  /** Float cycle in seconds. */
  duration?: number;
  /** Stagger offset. */
  delay?: number;
  /** Z-index (0 = behind content, 1 = above bg). Default 1. */
  z?: number;
};

export function Decoration({
  icon: Icon,
  top,
  bottom,
  left,
  right,
  size = 32,
  className = "",
  color,
  rotate = 0,
  drift = 14,
  duration = 6,
  delay = 0,
  z = 1,
}: DecorationProps) {
  const reduced = useReducedMotion();
  const style: React.CSSProperties = {
    top,
    bottom,
    left,
    right,
    color,
    zIndex: z,
    width: size,
    height: size,
  };

  if (reduced) {
    return (
      <div className={`pointer-events-none absolute ${className}`} style={{ ...style, transform: `rotate(${rotate}deg)` }} aria-hidden>
        <Icon width={size} height={size} />
      </div>
    );
  }

  return (
    <motion.div
      className={`pointer-events-none absolute ${className}`}
      style={style}
      aria-hidden
      initial={{ y: 0, rotate }}
      animate={{
        y: [0, -drift, 0, drift * 0.6, 0],
        rotate: [rotate, rotate + 6, rotate - 4, rotate + 3, rotate],
      }}
      transition={{ duration, delay, ease: "easeInOut", repeat: Infinity }}
    >
      <Icon width={size} height={size} />
    </motion.div>
  );
}

// ── SpacedTitle: tracked-out letters for section eyebrows ──────────────────

export function SpacedTitle({
  children,
  className = "",
  as: Tag = "h3",
}: {
  children: string;
  className?: string;
  as?: React.ElementType;
}) {
  // One char per span — wide letter-spacing plus tiny gap glyphs.
  const chars = children.split("");
  return (
    <Tag
      className={`inline-flex flex-wrap items-center justify-center gap-x-[0.18em] gap-y-2 font-serif font-bold uppercase ${className}`}
      aria-label={children}
    >
      {chars.map((c, i) => (
        <span key={i} aria-hidden className={c === " " ? "w-[0.6em] inline-block" : "inline-block"}>
          {c === " " ? "\u00A0" : c}
        </span>
      ))}
    </Tag>
  );
}

// ── StarDivider: a sparkle band between sections ───────────────────────────

export function StarDivider({
  count = 7,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center gap-3 sm:gap-5 py-8 sm:py-10 text-[color:var(--about-accent)] ${className}`}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <SparkleIcon
          key={i}
          width={14 + (i % 2) * 8}
          height={14 + (i % 2) * 8}
          style={{ opacity: 0.55 + (i % 3) * 0.15 }}
        />
      ))}
    </div>
  );
}

// ── MarqueeStrip: infinite horizontal scrolling label band ─────────────────

export function MarqueeStrip({
  items,
  className = "",
  speed = 38,
  variant = "accent",
}: {
  items: string[];
  className?: string;
  /** Lower = faster. Default 38s for a full loop. */
  speed?: number;
  variant?: "accent" | "ink" | "tint";
}) {
  const reduced = useReducedMotion();
  const looped = [...items, ...items, ...items, ...items];

  const palette =
    variant === "ink"
      ? "bg-natural-ink text-natural-bg"
      : variant === "tint"
      ? "bg-about-tint-strong text-natural-text"
      : "bg-[color:var(--about-accent)] text-[color:var(--about-accent-ink)]";

  return (
    <div className={`relative w-full overflow-hidden ${palette} ${className}`} aria-hidden>
      <div
        className="flex whitespace-nowrap will-change-transform"
        style={
          reduced
            ? undefined
            : { animation: `brewmatch-marquee ${speed}s linear infinite` }
        }
      >
        {looped.map((item, i) => (
          <span
            key={i}
            className="font-serif font-bold uppercase tracking-[0.18em] text-2xl sm:text-3xl md:text-4xl py-4 sm:py-5 px-6 flex items-center gap-6 sm:gap-10 shrink-0"
          >
            <span>{item}</span>
            <StarIcon width={18} height={18} className="opacity-70 shrink-0" />
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Sticker: rotated circular badge ────────────────────────────────────────

export function Sticker({
  text,
  size = 130,
  rotate = -8,
  className = "",
  variant = "accent",
}: {
  text: string;
  size?: number;
  rotate?: number;
  className?: string;
  variant?: "accent" | "paper";
}) {
  const reduced = useReducedMotion();
  const bg =
    variant === "paper"
      ? "bg-natural-paper text-natural-text border border-natural-border"
      : "bg-[color:var(--about-accent)] text-[color:var(--about-accent-ink)]";

  const inner = (
    <div
      className={`flex items-center justify-center rounded-full text-center font-serif font-bold leading-tight shadow-about-soft ${bg} ${className}`}
      style={{ width: size, height: size, transform: `rotate(${rotate}deg)` }}
    >
      <span className="px-4 text-sm sm:text-base">{text}</span>
    </div>
  );

  if (reduced) return inner;

  return (
    <motion.div
      animate={{ rotate: [rotate, rotate + 4, rotate - 4, rotate] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="inline-block"
    >
      <div
        className={`flex items-center justify-center rounded-full text-center font-serif font-bold leading-tight shadow-about-soft ${bg} ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="px-4 text-sm sm:text-base">{text}</span>
      </div>
    </motion.div>
  );
}

// ── CreativeHero: oversized playful hero replacing ParallaxHero on About ───

export type HeroDecorationKit = Array<
  Omit<DecorationProps, "icon"> & { glyph: keyof typeof GLYPHS }
>;

export const GLYPHS = {
  star: StarIcon,
  sparkle: SparkleIcon,
  bubble: BubbleIcon,
  flower: FlowerIcon,
  leaf: LeafIcon,
  squiggle: SquiggleIcon,
  planet: PlanetIcon,
  bean: BeanIcon,
} as const;

export function CreativeHero({
  eyebrow,
  title,
  tagline,
  imageUrl,
  imageAlt = "",
  stickerText,
  decorations,
  accentWord,
}: {
  eyebrow: string;
  title: string;
  tagline: string;
  imageUrl: string;
  imageAlt?: string;
  /** Optional rotated round badge on top of the hero image. */
  stickerText?: string;
  /** Decorative scatter glyphs around the hero. */
  decorations?: HeroDecorationKit;
  /** Optional substring of `title` to render in the accent color. */
  accentWord?: string;
}) {
  const reducedHero = useReducedMotion();
  // Split title around accent word for color emphasis.
  let parts: React.ReactNode = title;
  if (accentWord && title.includes(accentWord)) {
    const i = title.indexOf(accentWord);
    parts = (
      <>
        {title.slice(0, i)}
        <span className="text-[color:var(--about-accent)] italic">{accentWord}</span>
        {title.slice(i + accentWord.length)}
      </>
    );
  }

  return (
    <section
      className="relative overflow-hidden bg-about-tint"
      style={{ minHeight: "82vh" }}
    >
      {/* Scattered decorations */}
      {decorations?.map((d, i) => (
        <Decoration key={i} {...d} icon={GLYPHS[d.glyph]} />
      ))}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-16 sm:pt-24 pb-20 sm:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-center">
          {/* Text column */}
          <div className="relative z-[2]">
            <SpacedTitle
              as="p"
              className="text-[10px] sm:text-xs tracking-[0.45em] text-[color:var(--about-accent)] mb-8"
            >
              {eyebrow}
            </SpacedTitle>
            <h1 className="font-serif font-bold text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-tight">
              {parts}
            </h1>
            <SquiggleIcon
              width={120}
              height={20}
              className="mt-6 text-[color:var(--about-accent)]"
              aria-hidden
            />
            <p className="mt-8 max-w-md text-natural-text/70 text-lg leading-relaxed">
              {tagline}
            </p>
          </div>

          {/* Image column with rotated card + optional sticker */}
          <div className="relative z-[2]">
            <motion.div
              aria-hidden
              className="brewmatch-hero-ring pointer-events-none absolute -inset-6 sm:-inset-10 rounded-[3rem] border border-dashed border-[color:var(--about-accent)]/45"
              animate={reducedHero ? undefined : { rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              initial={{ rotate: -3, y: 30, opacity: 0 }}
              whileInView={{ rotate: -3, y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto max-w-md lg:max-w-none"
            >
              <div className="relative rounded-3xl overflow-hidden border border-[color:var(--about-accent)]/30 shadow-about-soft">
                <motion.img
                  src={imageUrl}
                  alt={imageAlt}
                  loading="eager"
                  decoding="async"
                  className="w-full aspect-[4/5] object-cover will-change-transform"
                  initial={{ scale: 1.06 }}
                  animate={reducedHero ? { scale: 1 } : { scale: [1.06, 1.13, 1.06], x: [0, -10, 0, 8, 0], y: [0, 6, 0, -6, 0] }}
                  transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-tr from-[color:var(--about-accent)]/20 via-transparent to-[color:var(--about-accent)]/10"
                  animate={reducedHero ? undefined : { opacity: [0.55, 0.95, 0.55] }}
                  transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              {stickerText && (
                <div className="absolute -top-6 -right-4 sm:-top-8 sm:-right-8 z-[3]">
                  <Sticker text={stickerText} rotate={10} size={120} />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── WavyDivider: a wavy SVG band separating sections ───────────────────────

export function WavyDivider({
  flip = false,
  color = "var(--about-tint-strong)",
  className = "",
}: {
  flip?: boolean;
  color?: string;
  className?: string;
}) {
  return (
    <div className={`relative w-full overflow-hidden leading-[0] ${className}`} aria-hidden>
      <svg
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
        className="block w-full h-16 sm:h-20"
        style={{ transform: flip ? "scaleY(-1)" : undefined, color }}
      >
        <path
          d="M0 6 C12 2 22 10 36 6 C52 2 62 12 78 6 C90 2 96 8 100 6 L100 12 L0 12 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
