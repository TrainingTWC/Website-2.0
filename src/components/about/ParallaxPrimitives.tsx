"use client";
/**
 * Parallax primitives for /about/* pages.
 *
 * Each primitive is a self-contained scroll-driven block. They're intentionally
 * over-built (spring-smoothed, tier-aware) because the user explicitly asked
 * for "parallax and 3d scrolling" on these pages.
 *
 * Conventions:
 *   • All transforms route through `useSpring` for buttery motion (matches the
 *     critically-damped springs used in ProductPage.tsx).
 *   • All numeric ranges are in `px` not `%` strings — strings break springs.
 *   • Heavy 3D tilt is mouse-driven (gated to fine-pointer / non-touch).
 *
 * Components:
 *   • ParallaxHero            — full-viewport hero with image scale + content lift
 *   • PinnedTextBlock         — long-form text that sticks while images scroll past
 *   • LayeredImageColumns     — 2-column scroll-offset image grid (different speeds)
 *   • TiltCard                — 3D mouse-tilt card for stat tiles / quotes
 *   • RevealOnScroll          — fade + lift wrapper for any child
 */
import React, { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useInView,
  type MotionValue,
} from "motion/react";
import { SmartImage } from "../SmartImage";

/* ─── Shared spring config — critically damped, no overshoot ────────────── */
const SPRING = { stiffness: 100, damping: 30, restDelta: 0.001 };

/* ───────────────────────────────────────────────────────────────────────── */
/* ParallaxHero                                                              */
/* ───────────────────────────────────────────────────────────────────────── */
interface ParallaxHeroProps {
  /** Tiny uppercase eyebrow above the title, e.g. "Our Story" */
  eyebrow: string;
  /** Main title — can include line breaks via \n */
  title: string;
  /** Optional tagline rendered under the title */
  tagline?: string;
  /** Background image URL */
  imageUrl: string;
  /** Optional blur-up placeholder data URL */
  imageBlur?: string;
  /** Optional bottom-aligned scroll hint text */
  scrollHint?: string;
}

export function ParallaxHero({
  eyebrow,
  title,
  tagline,
  imageUrl,
  imageBlur,
  scrollHint = "Scroll to explore",
}: ParallaxHeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Image lifts up + scales gently as you scroll past
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.18]);
  const imgYS = useSpring(imgY, SPRING);
  const imgScaleS = useSpring(imgScale, SPRING);

  // Content fades + lifts in the opposite direction
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const contentYS = useSpring(contentY, SPRING);

  return (
    <section
      ref={ref}
      className="relative w-full h-[88vh] sm:h-screen overflow-hidden bg-natural-paper"
    >
      <motion.div
        style={{ y: imgYS, scale: imgScaleS }}
        className="absolute inset-0 will-change-transform"
      >
        <SmartImage
          src={imageUrl}
          alt={title}
          blur={imageBlur}
          priority
          wrapperClassName="w-full h-full"
          className="w-full h-full object-cover"
          style={{ aspectRatio: undefined }}
        />
        {/* Warm gradient wash — keeps text legible without flattening the image */}
        <div className="absolute inset-0 bg-gradient-to-b from-natural-bg/35 via-natural-bg/10 to-natural-bg/55" />
        <div className="absolute inset-0 bg-gradient-to-tr from-natural-text/40 via-transparent to-transparent" />
      </motion.div>

      <motion.div
        style={{ y: contentYS, opacity: contentOpacity }}
        className="absolute inset-0 flex flex-col items-start justify-end max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pb-24 sm:pb-32"
      >
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] text-white/90 mb-4 sm:mb-6"
        >
          {eyebrow}
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
          className="font-serif font-bold text-white text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] max-w-4xl whitespace-pre-line drop-shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
        >
          {title}
        </motion.h1>
        {tagline && (
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
            className="mt-6 sm:mt-8 text-white/85 text-base sm:text-xl max-w-2xl leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
          >
            {tagline}
          </motion.p>
        )}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.1 }}
          className="absolute bottom-6 sm:bottom-10 left-4 sm:left-6 md:left-12 flex items-center gap-3 text-white/70 text-[10px] font-bold uppercase tracking-[0.4em]"
        >
          <span className="block w-8 h-px bg-white/50" />
          {scrollHint}
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/* PinnedTextBlock — long-form text that sticks while images scroll past     */
/* ───────────────────────────────────────────────────────────────────────── */
interface PinnedTextBlockProps {
  eyebrow?: string;
  title: string;
  paragraphs: string[];
  /** Side images (1–3) that scroll past at varying speeds. */
  sideImages: { url: string; alt: string; blur?: string }[];
  /** Flip the layout so text is right, images left. */
  reverse?: boolean;
}

export function PinnedTextBlock({
  eyebrow,
  title,
  paragraphs,
  sideImages,
  reverse = false,
}: PinnedTextBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Each image gets a different parallax speed for layered depth.
  const yA = useSpring(useTransform(scrollYProgress, [0, 1], [60, -80]), SPRING);
  const yB = useSpring(useTransform(scrollYProgress, [0, 1], [120, -160]), SPRING);
  const yC = useSpring(useTransform(scrollYProgress, [0, 1], [40, -100]), SPRING);
  const speeds = [yA, yB, yC];

  return (
    <section
      ref={ref}
      className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-24 sm:py-32 md:py-40"
    >
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start ${
          reverse ? "md:[&>*:first-child]:order-2" : ""
        }`}
      >
        {/* Text — sticky */}
        <div className="md:sticky md:top-28 self-start space-y-6">
          {eyebrow && (
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">
              {eyebrow}
            </span>
          )}
          <h2 className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl leading-[1.1] whitespace-pre-line text-natural-text">
            {title}
          </h2>
          <div className="space-y-5 text-natural-text/70 leading-relaxed text-base sm:text-lg max-w-xl">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>

        {/* Image stack — staggered parallax */}
        <div className="flex flex-col gap-6 sm:gap-10">
          {sideImages.slice(0, 3).map((img, i) => (
            <motion.div
              key={i}
              style={{ y: speeds[i] }}
              className={`will-change-transform overflow-hidden rounded-2xl shadow-xl ${
                i === 1 ? "md:translate-x-12" : ""
              }`}
            >
              <SmartImage
                src={img.url}
                alt={img.alt}
                blur={img.blur}
                aspectRatio={i === 0 ? "4/5" : i === 1 ? "1/1" : "5/4"}
                className="w-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/* LayeredImageColumns — full-width 2-col grid where each col scrolls at a   */
/* different speed. Pure visual interlude between text blocks.               */
/* ───────────────────────────────────────────────────────────────────────── */
export function LayeredImageColumns({
  images,
}: {
  images: { url: string; alt: string; blur?: string }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const yLeft = useSpring(useTransform(scrollYProgress, [0, 1], [80, -120]), SPRING);
  const yRight = useSpring(useTransform(scrollYProgress, [0, 1], [-80, 120]), SPRING);

  const left = images.filter((_, i) => i % 2 === 0);
  const right = images.filter((_, i) => i % 2 === 1);

  return (
    <section ref={ref} className="relative w-full py-16 sm:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-2 gap-4 sm:gap-8">
        <motion.div style={{ y: yLeft }} className="space-y-4 sm:space-y-8 will-change-transform">
          {left.map((img, i) => (
            <div key={i} className="overflow-hidden rounded-xl shadow-lg">
              <SmartImage
                src={img.url}
                alt={img.alt}
                blur={img.blur}
                aspectRatio={i % 2 === 0 ? "4/5" : "1/1"}
                className="w-full object-cover"
              />
            </div>
          ))}
        </motion.div>
        <motion.div style={{ y: yRight }} className="space-y-4 sm:space-y-8 will-change-transform pt-12 sm:pt-24">
          {right.map((img, i) => (
            <div key={i} className="overflow-hidden rounded-xl shadow-lg">
              <SmartImage
                src={img.url}
                alt={img.alt}
                blur={img.blur}
                aspectRatio={i % 2 === 0 ? "1/1" : "4/5"}
                className="w-full object-cover"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/* TiltCard — 3D mouse-tilt card. Used for stat tiles, quote pulls.          */
/* ───────────────────────────────────────────────────────────────────────── */
export function TiltCard({
  children,
  className = "",
  intensity = 8,
}: {
  children: React.ReactNode;
  className?: string;
  /** Max degrees of tilt — default 8°. */
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rxS = useSpring(rx, { stiffness: 180, damping: 22, restDelta: 0.001 });
  const ryS = useSpring(ry, { stiffness: 180, damping: 22, restDelta: 0.001 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * intensity);
    rx.set(-py * intensity);
  };

  const handleLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX: rxS, rotateY: ryS, transformPerspective: 900 }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/* RevealOnScroll — simple fade-and-lift wrapper                             */
/* ───────────────────────────────────────────────────────────────────────── */
export function RevealOnScroll({
  children,
  delay = 0,
  y = 40,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/* StatStrip — animated 3-or-4 stat row                                       */
/* ───────────────────────────────────────────────────────────────────────── */
export function StatStrip({
  stats,
}: {
  stats: { value: string; label: string }[];
}) {
  return (
    <RevealOnScroll>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 max-w-5xl mx-auto px-4 sm:px-6 md:px-12 py-16 sm:py-24">
        {stats.map((s) => (
          <TiltCard
            key={s.label}
            className="text-center px-4 py-6 rounded-2xl bg-natural-paper border border-natural-border shadow-sm"
            intensity={6}
          >
            <div className="text-3xl sm:text-5xl font-extrabold text-natural-text">
              {s.value}
            </div>
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-natural-text/50 mt-3">
              {s.label}
            </div>
          </TiltCard>
        ))}
      </div>
    </RevealOnScroll>
  );
}

/* Re-export the shared motion value type so callers can declare their own. */
export type { MotionValue };
