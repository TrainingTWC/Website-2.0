import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "motion/react";
import { ArrowDown } from "lucide-react";
import type { Product } from "../types";
import { SmartImage } from "./SmartImage";
import { BannerSlideshow } from "./BannerSlideshow";
import { usePerfMode } from "../context/PerfModeContext";

/**
 * Autajon-inspired cinematic scrollytelling sequence.
 *
 *   1. CinematicHero            — dark, parallax-stacked, the 3D carousel embedded
 *   2. CurtainTransition        — paper curtain slides up over a hero detail
 *   3. ChapterReveal (xN)       — large editorial chapters: huge background text,
 *                                 product still-life pinned, callouts that float
 *   4. CurtainTransition        — dark curtain to switch into the catalog grids
 *
 * All movement is Y-triggered, Z-perceived: backgrounds drift slower than
 * the foreground, headings scale + lift as they exit, hero copy splits into
 * depth bands so users feel like they're *diving* through the brand.
 */

// ─────────────────────────────────────────────────────────────
// Cinematic Hero — full-bleed dark stage, parallax depth
// ─────────────────────────────────────────────────────────────
export function CinematicHero({
  slides,
  onScrollHint,
  hero,
}: {
  slides: ReactNode[];
  onScrollHint: () => void;
  hero?: {
    eyebrow: string;
    wordmarkLine1: string;
    wordmarkLine2: string;
  };
}) {
  const eyebrow = hero?.eyebrow ?? "A daily ritual · est. 2016";
  const wordmarkLine1 = hero?.wordmarkLine1 ?? "THIRD WAVE";
  const wordmarkLine2 = hero?.wordmarkLine2 ?? "coffee.";
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Depth bands: each layer eases at a different rate.
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const carouselY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const carouselOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.05]);
  const tagY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  return (
    <section
      ref={ref}
      id="hero"
      className="relative w-full text-natural-text"
    >

      {/* Slideshow — full width with side margins so rounded corners are visible */}
      <div className="relative z-10 w-full px-4 sm:px-6 pt-4">
        <BannerSlideshow slides={slides} rounded="rounded-[2rem]" />
      </div>

      {/* Hero tagline — big editorial style below the poster, with scroll parallax */}
      <div className="relative overflow-hidden py-14 sm:py-20 bg-natural-bg">
        {/* Giant ghost wordmark — drifts up slower than copy */}
        <motion.div
          style={{ y: tagY }}
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none select-none flex justify-center overflow-hidden"
        >
          <span className="font-serif font-black text-[clamp(5rem,18vw,18rem)] leading-none tracking-tight text-natural-text/[0.05] whitespace-nowrap">
            {eyebrow.toUpperCase()}
          </span>
        </motion.div>
        {/* Foreground copy — drifts up faster */}
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0, 1], [0, -80]) }}
          className="relative z-10 text-center px-4"
        >
          <p className="text-[10px] sm:text-xs font-bold tracking-[0.45em] uppercase text-natural-text/50 mb-4 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-amber-600/50 inline-block" />
            {eyebrow}
            <span className="h-px w-10 bg-amber-600/50 inline-block" />
          </p>
          <h2 className="font-serif font-black text-[clamp(2.8rem,8vw,7rem)] leading-[0.92] tracking-tight text-natural-text">
            A daily{" "}
            <span className="italic text-natural-accent">ritual.</span>
          </h2>
        </motion.div>
      </div>

    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Curtain transition — a solid color panel that slides up to mask
// the previous section as the next one begins.
// ─────────────────────────────────────────────────────────────
export function CurtainTransition({
  color = "bg-natural-bg",
  height = "h-[20vh]",
}: {
  color?: string;
  height?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const yPct = useTransform(scrollYProgress, [0, 0.5, 1], ["100%", "0%", "-100%"]);

  return (
    <div ref={ref} className={`relative ${height} overflow-hidden`}>
      <motion.div
        style={{ y: yPct }}
        className={`absolute inset-x-0 top-0 h-full ${color}`}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Chapter reveal — Autajon "Expertise" style scrollytelling panel
//   • Pinned hero product (parallaxes slower than copy)
//   • Huge editorial background text
//   • Floating callout chips
// ─────────────────────────────────────────────────────────────
export function ChapterReveal({
  index,
  eyebrow,
  title,
  body,
  callouts,
  product,
  imageUrl,
  imageAlt,
  align = "left",
  theme = "light",
  onProductClick,
  scrollProgress,
  localStart,
  localEnd,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  body: string;
  callouts: string[];
  product?: Product;
  imageUrl?: string;       // overrides product image when provided
  imageAlt?: string;
  align?: "left" | "right";
  theme?: "light" | "dark";
  onProductClick?: () => void;
  /** Shared deck-wide scroll progress (Plan 03). The chapter derives all
   *  parallax from this single MotionValue \u2014 there is NO per-chapter
   *  `useScroll` subscription. */
  scrollProgress: MotionValue<number>;
  localStart: number;
  localEnd: number;
}) {
  const { tier, reducedMotion } = usePerfMode();
  const staticRender = reducedMotion || tier === "low";

  const ref = useRef<HTMLElement>(null);

  const source = scrollProgress;
  const ls = localStart;
  const le = localEnd;

  // Slice-local 0–1 progress derived from whichever source we're using.
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const bigTextY = useTransform(source, [ls, le], ["20%", "-50%"]);
  const productY = useTransform(source, [ls, le], ["10%", "-20%"]);
  const productScale = useTransform(
    source,
    [ls, lerp(ls, le, 0.4), le],
    [0.85, 1, 1.08],
  );
  const productRotate = useTransform(source, [ls, le], [-6, 6]);
  const productMacro = useTransform(source, [ls, le], [0, 1]);
  const copyOpacity = useTransform(
    source,
    [lerp(ls, le, 0.05), lerp(ls, le, 0.18), lerp(ls, le, 0.7), lerp(ls, le, 0.9)],
    [0, 1, 1, 0],
  );
  const copyY = useTransform(source, [lerp(ls, le, 0.05), lerp(ls, le, 0.18)], [24, 0]);

  // ── IO-driven willChange toggle ────────────────────────────────────
  // rootMargin 100% 0% = one viewport of leeway on top & bottom, so we
  // promote a chapter to its own composited layer slightly before it
  // enters the viewport and demote it shortly after it leaves.
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (staticRender) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { rootMargin: "100% 0%" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [staticRender]);
  const willChange = near ? "transform" : "auto";

  const dark = theme === "dark";
  const bg = dark ? "bg-[#1A0F08]" : "bg-natural-paper";
  const fg = dark ? "text-white" : "text-natural-text";
  const subtle = dark ? "text-white/55" : "text-natural-text/55";
  const accent = dark ? "text-amber-300" : "text-natural-accent";
  const bigText = dark ? "text-white/[0.05]" : "text-natural-text/[0.05]";
  const chipBg = dark
    ? "bg-white/10 border-white/20 text-white"
    : "bg-natural-paper border-natural-border text-natural-text";

  const hasImage = !!(imageUrl || product?.imageUrl);

  return (
    <section ref={ref} className={`relative ${hasImage ? "min-h-screen" : "min-h-[60vh]"} ${bg} ${fg} overflow-hidden`}>
      {/* Background editorial wordmark — slowest moving (skipped in static mode) */}
      <motion.div
        style={staticRender ? { transform: "none" } : { y: bigTextY, willChange }}
        className="absolute inset-x-0 top-0 pointer-events-none select-none flex justify-center"
      >
        <span
          className={`font-serif font-black text-[clamp(7rem,22vw,22rem)] leading-[0.85] tracking-tight ${bigText} whitespace-nowrap`}
        >
          {eyebrow.toUpperCase()}
        </span>
      </motion.div>

      {/* Sticky pinned stage */}
      <div className={`sticky top-0 ${hasImage ? "h-screen" : "h-auto py-20"} flex items-center overflow-hidden`}>
        <div
          className={`relative w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center ${
            align === "right" ? "lg:[grid-template-columns:1fr_1.2fr]" : "lg:[grid-template-columns:1.2fr_1fr]"
          }`}
        >
          {/* Product still-life */}
          <motion.div
            style={
              staticRender
                ? { transform: "none" }
                : { y: productY, scale: productScale, rotate: productRotate, willChange }
            }
            className={`relative ${align === "right" ? "lg:order-2" : "lg:order-1"}`}
          >
            {(() => {
              const resolvedImage = imageUrl || product?.imageUrl;
              if (!resolvedImage) return null;
              return (
                <button
                  data-cursor="zoom"
                  onClick={onProductClick}
                  className="block w-full max-w-[200px] sm:max-w-xs lg:max-w-md mx-auto aspect-[4/5] rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden bg-natural-muted shadow-2xl group"
                >
                  <img
                    src={resolvedImage}
                    alt={imageAlt ?? product?.name ?? eyebrow}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.6s]"
                    loading="eager"
                    decoding="async"
                  />
                  {!staticRender && <MacroBeam progress={productMacro} />}
                </button>
              );
            })()}
          </motion.div>

          {/* Copy column */}
          <motion.div
            style={staticRender ? { opacity: 1, transform: "none" } : { opacity: copyOpacity, y: copyY, willChange }}
            className={`relative space-y-6 ${align === "right" ? "lg:order-1" : "lg:order-2"}`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-xs font-mono font-bold tracking-[0.3em] ${accent}`}>
                {index}
              </span>
              <span className="h-px w-10 bg-current opacity-30" />
              <span className={`text-[10px] font-bold tracking-[0.4em] uppercase ${subtle}`}>
                {eyebrow}
              </span>
            </div>

            <h2 className="font-serif font-black text-4xl sm:text-5xl md:text-7xl leading-[0.95] tracking-tight">
              {title}
            </h2>
            <p className={`text-sm sm:text-base lg:text-lg leading-relaxed max-w-md ${subtle}`}>{body}</p>

            {/* Floating callout chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              {callouts.map((c, i) => (
                <FloatingChip
                  key={c}
                  index={i}
                  className={`${chipBg} backdrop-blur-sm`}
                >
                  {c}
                </FloatingChip>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// ChapterDeck — stacked deck of chapter cards. Scrolling first
// plays each card's internal parallax, then flips it away to
// reveal the next card beneath. Same chapter visuals as
// ChapterReveal, just sequenced as a 3D card stack.
// ─────────────────────────────────────────────────────────────
export type ChapterConfig = {
  index: string;
  eyebrow: string;
  title: ReactNode;
  body: string;
  callouts: string[];
  product?: Product;
  imageUrl?: string;
  imageAlt?: string;
  align?: "left" | "right";
  theme?: "light" | "dark";
  onProductClick?: () => void;
};

export function ChapterDeck({ chapters }: { chapters: ChapterConfig[] }) {
  // Plan 03: ONE top-level useScroll for the entire deck. Each ChapterReveal
  // gets a slice [localStart, localEnd] of the deck-wide progress and derives
  // its parallax from that shared MotionValue — N subscriptions → 1.
  const deckRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: deckRef,
    offset: ["start end", "end start"],
  });
  const N = Math.max(1, chapters.length);
  return (
    <div ref={deckRef} className="relative">
      {chapters.map((c, i) => (
        <ChapterReveal
          key={`${c.eyebrow}-${i}`}
          index={c.index}
          eyebrow={c.eyebrow}
          title={c.title}
          body={c.body}
          callouts={c.callouts}
          product={c.product}
          imageUrl={c.imageUrl}
          imageAlt={c.imageAlt}
          align={c.align}
          theme={c.theme}
          onProductClick={c.onProductClick}
          scrollProgress={scrollYProgress}
          localStart={i / N}
          localEnd={(i + 1) / N}
        />
      ))}
    </div>
  );
}

function ChapterCard({
  index,
  total,
  progress,
  config,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
  config: ChapterConfig;
}) {
  // ── Choreography ──────────────────────────────────────────────────
  //
  // Each card owns one full viewport of scroll (slice = 1/total). Inside
  // that slice the card lives through three phases:
  //
  //   ┌── ENTER ──┬───────── HOLD (parallax) ─────────┬── EXIT ──┐
  //   start                                                       end
  //   0%         15%                                  85%       100%
  //
  // Strict single-occupancy: a card's PRODUCT, COPY and WORDMARK are
  // 100% transparent outside [start, end]. So at any given moment only
  // ONE card's content (one product, one paragraph, one wordmark) is on
  // screen — never two products fighting in the middle of the viewport.
  //
  // The only thing that crossfades across cards is the BACKGROUND
  // COLOUR LAYER — that one overlaps adjacent cards so the room repaints
  // smoothly while the swap happens.
  //
  // Motion within the slice:
  //   • PRODUCT slides in from the RIGHT (translateX +60%, rotateY −24°,
  //     translateZ −500px) → flies past camera to centre → slides out
  //     LEFT with mirrored 3D values. Always the same direction so the
  //     deck reads as a conveyor moving right→left.
  //   • COPY slides in from the LEFT, exits to the RIGHT — so it crosses
  //     the product on every transition. Same 3D tilt + Z recede.
  //   • WORDMARK rides with the product (also right→left) but at half
  //     the magnitude for a parallax-cinema feel.
  //   • BACKGROUND COLOUR uses a wider window: it begins fading in well
  //     before the card's content arrives and fades out well after it
  //     leaves, so the colour wash flows continuously.
  // ──────────────────────────────────────────────────────────────────

  const isFirst = index === 0;
  const isLast = index === total - 1;
  const seg = 1 / total;
  const start = index * seg;
  const end = start + seg;

  // Content visibility window — content is fully transparent outside.
  // Enter and exit each take 15% of the slice.
  const enterStart = start;
  const enterEnd = start + seg * 0.18;
  const exitStart = end - seg * 0.18;
  const exitEnd = end;

  // Background colour window — overlaps adjacent cards by ~30% of a slice
  // on each side so the colour bleed is gentle.
  const bgEnterStart = isFirst ? 0 : start - seg * 0.3;
  const bgEnterEnd = isFirst ? 0 : start + seg * 0.05;
  const bgExitStart = isLast ? 1 : end - seg * 0.05;
  const bgExitEnd = isLast ? 1 : end + seg * 0.3;

  const bgOpacity = useTransform(
    progress,
    isFirst
      ? [bgExitStart, bgExitEnd]
      : isLast
      ? [bgEnterStart, bgEnterEnd]
      : [bgEnterStart, bgEnterEnd, bgExitStart, bgExitEnd],
    isFirst ? [1, 0] : isLast ? [0, 1] : [0, 1, 1, 0],
  );

  // Content opacity: hard window, content vanishes completely outside
  // [enterStart, exitEnd]. Small ramps at the very edges so the cut
  // isn't binary. First card is fully visible at progress 0 (no fade-in
  // gap when you first reach the deck); last card stays visible at end.
  const contentOpacity = useTransform(
    progress,
    [enterStart, enterStart + seg * 0.06, exitEnd - seg * 0.06, exitEnd],
    [isFirst ? 1 : 0, 1, 1, isLast ? 1 : 0],
  );

  // Slice-local progress 0→1 for parallax / motion across the visible window.
  const local = useTransform(progress, [enterStart, exitEnd], [0, 1]);

  // ── Product transforms ────────────────────────────────────────────
  // Enters from the right (positive X, slight negative rotateY so the
  // right edge faces camera), flies through centre, exits left mirrored.
  // translateZ dips negative at the edges so it feels like the product
  // is travelling past the camera, not pasted onto a flat wall.
  // ── Product transforms ────────────────────────────────────────────
  // Enters from the right (positive X, slight negative rotateY so the
  // right edge faces camera), flies through centre, exits left mirrored.
  // translateZ dips negative at the edges so it feels like the product
  // is travelling past the camera, not pasted onto a flat wall.
  // First card starts settled (no fly-in); last card stays settled (no fly-out).
  const inX = isFirst ? "0%" : "60%";
  const outX = isLast ? "0%" : "-60%";
  const inRY = isFirst ? 0 : -24;
  const outRY = isLast ? 0 : 24;
  const inZ = isFirst ? 0 : -500;
  const outZ = isLast ? 0 : -500;
  const productX = useTransform(local, [0, 0.18, 0.82, 1], [inX, "0%", "0%", outX]);
  const productRotateY = useTransform(local, [0, 0.18, 0.82, 1], [inRY, 0, 0, outRY]);
  const productZ = useTransform(local, [0, 0.18, 0.82, 1], [inZ, 0, 0, outZ]);
  // Subtle vertical drift while held (the "hover" parallax beat).
  const productY = useTransform(local, [0.18, 0.82], ["8%", "-8%"]);
  const productRotate = useTransform(local, [0.18, 0.82], [-4, 4]);

  // ── Copy transforms ───────────────────────────────────────────────
  // Mirrors the product: enters from the LEFT, exits to the RIGHT, so
  // the two halves of the page cross each other on every transition.
  const copyInX = isFirst ? "0%" : "-50%";
  const copyOutX = isLast ? "0%" : "50%";
  const copyInRY = isFirst ? 0 : 20;
  const copyOutRY = isLast ? 0 : -20;
  const copyInZ = isFirst ? 0 : -400;
  const copyOutZ = isLast ? 0 : -400;
  const copyX = useTransform(local, [0, 0.18, 0.82, 1], [copyInX, "0%", "0%", copyOutX]);
  const copyRotateY = useTransform(local, [0, 0.18, 0.82, 1], [copyInRY, 0, 0, copyOutRY]);
  const copyZ = useTransform(local, [0, 0.18, 0.82, 1], [copyInZ, 0, 0, copyOutZ]);
  const copyY = useTransform(local, [0.18, 0.82], ["3%", "-3%"]);

  // ── Wordmark transform ────────────────────────────────────────────
  // Travels with the product (right→left) but at HALF magnitude so it
  // reads as a deeper parallax layer behind everything.
  const wmInX = isFirst ? "0%" : "30%";
  const wmOutX = isLast ? "0%" : "-30%";
  const wmInZ = isFirst ? -50 : -300;
  const wmOutZ = isLast ? -50 : -300;
  const wordmarkX = useTransform(local, [0, 0.18, 0.82, 1], [wmInX, "0%", "0%", wmOutX]);
  const wordmarkY = useTransform(local, [0.18, 0.82], ["12%", "-30%"]);
  const wordmarkZ = useTransform(local, [0, 0.18, 0.82, 1], [wmInZ, -50, -50, wmOutZ]);

  const { eyebrow, index: indexLabel, title, body, callouts, product, align = "left", theme = "light", onProductClick } = config;
  const dark = theme === "dark";
  const bg = dark ? "bg-[#1A0F08]" : "bg-natural-paper";
  const fg = dark ? "text-white" : "text-natural-text";
  const subtle = dark ? "text-white/55" : "text-natural-text/55";
  const accent = dark ? "text-amber-300" : "text-natural-accent";
  const bigText = dark ? "text-white/[0.05]" : "text-natural-text/[0.05]";
  const chipBg = dark
    ? "bg-white/10 border-white/20 text-white"
    : "bg-natural-paper border-natural-border text-natural-text";

  return (
    <div
      style={{ zIndex: index }}
      className={`absolute inset-0 ${fg} overflow-hidden pointer-events-none`}
    >
      {/* BG colour layer — wide overlapping window for smooth repaint. */}
      <motion.div
        style={{ opacity: bgOpacity }}
        className={`absolute inset-0 ${bg}`}
      />

      {/* Wordmark — travels with the product, half magnitude. */}
      <motion.div
        style={{
          x: wordmarkX,
          y: wordmarkY,
          z: wordmarkZ,
          opacity: contentOpacity,
          transformStyle: "preserve-3d",
        }}
        className="absolute inset-x-0 top-0 pointer-events-none select-none flex justify-center"
      >
        <span
          className={`font-serif font-black text-[clamp(7rem,22vw,22rem)] leading-[0.85] tracking-tight ${bigText} whitespace-nowrap`}
        >
          {eyebrow.toUpperCase()}
        </span>
      </motion.div>

      {/* Stage — 3D world. */}
      <div
        className="absolute inset-0 flex items-center overflow-hidden pointer-events-auto"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className={`relative w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center ${
            align === "right" ? "lg:[grid-template-columns:1fr_1.2fr]" : "lg:[grid-template-columns:1.2fr_1fr]"
          }`}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Product still-life — flies in from RIGHT, out to LEFT. */}
          <motion.div
            style={{
              x: productX,
              y: productY,
              z: productZ,
              rotateY: productRotateY,
              rotate: productRotate,
              opacity: contentOpacity,
              transformStyle: "preserve-3d",
              transformOrigin: "50% 50%",
            }}
            className={`relative ${align === "right" ? "lg:order-2" : "lg:order-1"}`}
          >
            {product ? (
              <button
                data-cursor="zoom"
                onClick={onProductClick}
                className="block w-full max-w-[200px] sm:max-w-xs lg:max-w-md mx-auto aspect-[4/5] rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden bg-natural-muted shadow-2xl group"
              >
                <SmartImage
                  src={product.imageUrl}
                  blur={product.imageBlur}
                  alt={product.name}
                  className="object-cover group-hover:scale-110 transition-transform duration-[1.6s]"
                  wrapperClassName="w-full h-full"
                  priority
                />
                <MacroBeam progress={local} />
              </button>
            ) : (
              <div className="w-full max-w-md mx-auto aspect-[4/5] rounded-[2.5rem] bg-natural-muted" />
            )}
          </motion.div>

          {/* Copy column — flies in from LEFT, out to RIGHT. Crosses the product. */}
          <motion.div
            style={{
              x: copyX,
              y: copyY,
              z: copyZ,
              rotateY: copyRotateY,
              opacity: contentOpacity,
              transformStyle: "preserve-3d",
              transformOrigin: "50% 50%",
            }}
            className={`relative space-y-6 ${align === "right" ? "lg:order-1" : "lg:order-2"}`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-xs font-mono font-bold tracking-[0.3em] ${accent}`}>
                {indexLabel}
              </span>
              <span className="h-px w-10 bg-current opacity-30" />
              <span className={`text-[10px] font-bold tracking-[0.4em] uppercase ${subtle}`}>
                {eyebrow}
              </span>
            </div>

            <h2 className="font-serif font-black text-4xl sm:text-5xl md:text-7xl leading-[0.95] tracking-tight">
              {title}
            </h2>
            <p className={`text-sm sm:text-base lg:text-lg leading-relaxed max-w-md ${subtle}`}>{body}</p>

            <div className="flex flex-wrap gap-2 pt-2">
              {callouts.map((c, i) => (
                <FloatingChip key={c} index={i} className={`${chipBg} backdrop-blur-sm`}>
                  {c}
                </FloatingChip>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MacroBeam — a slow light sweep across the product to mimic the
// Autajon "camera panning across embossing / gold leaf" effect.
// ─────────────────────────────────────────────────────────────
function MacroBeam({ progress }: { progress: MotionValue<number> }) {
  const x = useTransform(progress, [0, 1], ["-40%", "120%"]);
  return (
    <motion.div
      aria-hidden
      style={{ x }}
      className="absolute inset-y-0 w-1/3 pointer-events-none"
    >
      <div
        className="w-full h-full"
        style={{
          background:
            "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0) 20%, rgba(255,250,235,0.35) 50%, rgba(255,255,255,0) 80%, transparent 100%)",
          mixBlendMode: "overlay",
        }}
      />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// FloatingChip — micro-callout that bobs independently
// ─────────────────────────────────────────────────────────────
function FloatingChip({
  children,
  index,
  className = "",
}: {
  children: ReactNode;
  index: number;
  className?: string;
}) {
  const float = useSpring(0, { stiffness: 30, damping: 16 });

  return (
    <motion.span
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.4 }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.5 }}
      animate={{ y: [0, -3, 0] }}
      whileHover={{ scale: 1.05, y: -6 }}
      style={{ y: float }}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold tracking-wider uppercase border ${className}`}
    >
      <span className="w-1 h-1 rounded-full bg-current opacity-60" />
      {children}
    </motion.span>
  );
}
