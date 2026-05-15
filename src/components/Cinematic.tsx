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
  // Plain vertical stack — each chapter is a full ChapterReveal section
  // (sticky pinned stage + parallax wordmark + product Y/scale/rotate +
  // copy fade), one after another. No 3D conveyor, no morphing, just
  // the original editorial parallax brought back card-by-card.
  return (
    <div className="relative">
      {chapters.map((c, i) => (
        <ChapterReveal
          key={`${c.eyebrow}-${i}`}
          index={c.index}
          eyebrow={c.eyebrow}
          title={c.title}
          body={c.body}
          callouts={c.callouts}
          product={c.product}
          align={c.align}
          theme={c.theme}
          onProductClick={c.onProductClick}
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
