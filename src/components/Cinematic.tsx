import { useRef, type ReactNode } from "react";
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
}: {
  slides: ReactNode[];
  onScrollHint: () => void;
}) {
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
      className="relative h-[110vh] w-full overflow-hidden bg-[#1A0F08] text-white"
    >
      {/* Deep background image with parallax */}
      <motion.div
        style={{ y: bgY, scale: bgScale }}
        className="absolute inset-0 will-change-transform"
      >
        <div
          className="w-full h-[120%] bg-cover bg-center opacity-25"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1442975631115-c4f7b05b8a2c?auto=format&fit=crop&q=80&w=1800)",
          }}
        />
      </motion.div>

      {/* Vignette + film grain overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_0%,rgba(10,5,2,0.55)_55%,rgba(10,5,2,0.95)_100%)]" />
      <div
        className="absolute inset-0 mix-blend-overlay opacity-[0.18]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* MASSIVE background wordmark — slowest moving layer */}
      <motion.h1
        style={{ y: titleY, opacity: titleOpacity }}
        className="absolute inset-x-0 top-[14%] text-center pointer-events-none select-none"
      >
        <span className="block font-serif font-black text-[clamp(4rem,16vw,15rem)] leading-[0.85] tracking-tight text-white/[0.07]">
          THIRD WAVE
        </span>
        <span className="block font-serif font-black italic text-[clamp(3rem,14vw,13rem)] leading-[0.85] tracking-tight text-white/[0.1] -mt-4">
          coffee.
        </span>
      </motion.h1>

      {/* Foreground content */}
      <motion.div
        style={{ y: carouselY, opacity: carouselOpacity }}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6"
      >
        <motion.div
          style={{ y: tagY }}
          className="mb-8 flex items-center gap-3"
        >
          <span className="h-px w-10 bg-amber-300/70" />
          <span className="text-[10px] font-bold tracking-[0.45em] uppercase text-amber-200/90">
            A daily ritual · est. 2016
          </span>
          <span className="h-px w-10 bg-amber-300/70" />
        </motion.div>

        <h2 className="sr-only">Master the ritual.</h2>

        <div className="w-full max-w-6xl">
          <BannerSlideshow slides={slides} />
        </div>
      </motion.div>

      {/* Scroll hint */}
      <motion.button
        data-magnetic
        onClick={onScrollHint}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <span className="text-[9px] font-bold tracking-[0.4em] uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </motion.button>
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
  align = "left",
  theme = "light",
  onProductClick,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  body: string;
  callouts: string[];
  product?: Product;
  align?: "left" | "right";
  theme?: "light" | "dark";
  onProductClick?: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const bigTextY = useTransform(scrollYProgress, [0, 1], ["20%", "-50%"]);
  const productY = useTransform(scrollYProgress, [0, 1], ["10%", "-20%"]);
  const productScale = useTransform(scrollYProgress, [0, 0.4, 1], [0.85, 1, 1.08]);
  const productRotate = useTransform(scrollYProgress, [0, 1], [-6, 6]);
  const copyOpacity = useTransform(scrollYProgress, [0.1, 0.3, 0.7, 0.9], [0, 1, 1, 0]);
  const copyY = useTransform(scrollYProgress, [0.1, 0.3], [40, 0]);

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
    <section ref={ref} className={`relative min-h-screen ${bg} ${fg} overflow-hidden`}>
      {/* Background editorial wordmark — slowest moving */}
      <motion.div
        style={{ y: bigTextY }}
        className="absolute inset-x-0 top-0 pointer-events-none select-none flex justify-center"
      >
        <span
          className={`font-serif font-black text-[clamp(7rem,22vw,22rem)] leading-[0.85] tracking-tight ${bigText} whitespace-nowrap`}
        >
          {eyebrow.toUpperCase()}
        </span>
      </motion.div>

      {/* Sticky pinned stage */}
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div
          className={`relative w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center ${
            align === "right" ? "lg:[grid-template-columns:1fr_1.2fr]" : "lg:[grid-template-columns:1.2fr_1fr]"
          }`}
        >
          {/* Product still-life */}
          <motion.div
            style={{ y: productY, scale: productScale, rotate: productRotate }}
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
                {/* Macro highlight beam */}
                <MacroBeam progress={scrollYProgress} />
              </button>
            ) : (
              <div className="w-full max-w-md mx-auto aspect-[4/5] rounded-[2.5rem] bg-natural-muted" />
            )}
          </motion.div>

          {/* Copy column */}
          <motion.div
            style={{ opacity: copyOpacity, y: copyY }}
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
  align?: "left" | "right";
  theme?: "light" | "dark";
  onProductClick?: () => void;
};

export function ChapterDeck({ chapters }: { chapters: ChapterConfig[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  // Spring-smooth the master scroll so cards glide between each other
  // with weight, never twitchy. Heavier mass + lower stiffness = molten.
  const smooth = useSpring(scrollYProgress, { stiffness: 70, damping: 24, mass: 0.7 });
  const n = chapters.length;

  return (
    // One viewport per card — no tail. The last card stays pinned through
    // the final viewport so there's no empty gap before the next section.
    <div ref={ref} style={{ height: `${n * 100}vh` }} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden">
        {chapters.map((c, i) => (
          <ChapterCard
            key={`${c.eyebrow}-${i}`}
            index={i}
            total={n}
            progress={smooth}
            config={c}
          />
        ))}
      </div>
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
  // Each card claims a 1/total slice of master scroll progress.
  //
  //   ├── enter ──┼─────── hold (parallax) ───────┼── exit ──┤
  //   ^                    ^                                  ^
  //   enterStart          start                              end
  //
  // Crucially, the enter window of card N overlaps the exit window of
  // card N-1: they share the same scroll range, cross-fading and
  // co-parallaxing through it. That's what makes one card feel like it's
  // becoming the next, not "card vanishes, blank, new card appears".
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const seg = 1 / total;
  const start = index * seg;
  const end = start + seg;
  // Morph window: last ~32% of each card's slice cross-fades into the next.
  const morphStart = start + seg * 0.68;
  // Enter window: incoming card's appearance shares the outgoing card's
  // morph window so they overlap perfectly.
  const enterStart = isFirst ? 0 : start - seg * 0.32;
  const enterEnd = isFirst ? 0 : start;

  // Local 0→1 progress used to drive internal parallax. Starts during the
  // enter phase so content is *already in motion* the moment the card is
  // visible — no static "wait, now I'll start" feeling.
  const local = useTransform(
    progress,
    [enterStart, morphStart],
    [0, 1],
  );

  // Visibility cross-fade — outgoing card N-1 fades 1→0 while this card
  // fades 0→1 across the SAME scroll range (enterStart..enterEnd).
  const opacity = useTransform(
    progress,
    isFirst
      ? [0, morphStart, end]
      : isLast
      ? [enterStart, enterEnd, 1]
      : [enterStart, enterEnd, morphStart, end],
    isFirst ? [1, 1, 0] : isLast ? [0, 1, 1] : [0, 1, 1, 0],
  );

  // "Push-through camera" effect: outgoing card scales UP and blurs OUT
  // (like the camera dollies through it), while incoming card scales
  // DOWN from 1.08 to 1 and blurs IN from 8 to 0 (like the camera lands
  // on it). They share the same scroll window so the eye reads one
  // continuous depth move rather than two separate fades.
  const scale = useTransform(
    progress,
    isFirst
      ? [start, morphStart, end]
      : isLast
      ? [enterStart, enterEnd, 1]
      : [enterStart, enterEnd, morphStart, end],
    isFirst ? [1, 1, 1.08] : isLast ? [1.08, 1, 1] : [1.08, 1, 1, 1.08],
  );

  const blurVal = useTransform(
    progress,
    isFirst
      ? [start, morphStart, end]
      : isLast
      ? [enterStart, enterEnd, 1]
      : [enterStart, enterEnd, morphStart, end],
    isFirst ? [0, 0, 10] : isLast ? [10, 0, 0] : [10, 0, 0, 10],
  );
  const filter = useTransform(blurVal, (b) => `blur(${b.toFixed(2)}px)`);

  // Slight vertical drift — outgoing rises away, incoming arrives from
  // just below. Subtle (only 24px) but adds the "merging" feel.
  const y = useTransform(
    progress,
    isFirst
      ? [start, morphStart, end]
      : isLast
      ? [enterStart, enterEnd, 1]
      : [enterStart, enterEnd, morphStart, end],
    isFirst ? [0, 0, -24] : isLast ? [24, 0, 0] : [24, 0, 0, -24],
  );

  // Parallax band values — extended into the enter window so incoming
  // content has *already started* moving when the card is first visible.
  const bigTextY = useTransform(local, [0, 1], ["20%", "-50%"]);
  const productY = useTransform(local, [0, 1], ["10%", "-20%"]);
  const productScale = useTransform(local, [0, 0.4, 1], [0.85, 1, 1.08]);
  const productRotate = useTransform(local, [0, 1], [-6, 6]);
  const copyOpacity = useTransform(local, [0.05, 0.25, 0.85, 1], [0, 1, 1, 0.85]);
  const copyY = useTransform(local, [0.05, 0.25], [40, 0]);

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
    <motion.div
      style={{
        opacity,
        scale,
        y,
        filter,
        // Later cards on top so the incoming card rises *over* the
        // outgoing one during the shared cross-fade window. Without
        // this, the new card would be hidden underneath until the old
        // one fully disappears — which is exactly the "school project"
        // hard-cut feel we're removing.
        zIndex: index,
        willChange: "opacity, transform, filter",
      }}
      className={`absolute inset-0 ${bg} ${fg} overflow-hidden`}
    >
      {/* Background editorial wordmark — slowest moving */}
      <motion.div
        style={{ y: bigTextY }}
        className="absolute inset-x-0 top-0 pointer-events-none select-none flex justify-center"
      >
        <span
          className={`font-serif font-black text-[clamp(7rem,22vw,22rem)] leading-[0.85] tracking-tight ${bigText} whitespace-nowrap`}
        >
          {eyebrow.toUpperCase()}
        </span>
      </motion.div>

      {/* Pinned stage — full height of the card */}
      <div className="absolute inset-0 flex items-center overflow-hidden">
        <div
          className={`relative w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center ${
            align === "right" ? "lg:[grid-template-columns:1fr_1.2fr]" : "lg:[grid-template-columns:1.2fr_1fr]"
          }`}
        >
          {/* Product still-life */}
          <motion.div
            style={{ y: productY, scale: productScale, rotate: productRotate }}
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

          {/* Copy column */}
          <motion.div
            style={{ opacity: copyOpacity, y: copyY }}
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
    </motion.div>
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
