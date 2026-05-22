import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence, type PanInfo } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * BannerSlideshow — auto-rotating, accepts React slides so each can be a
 * fully art-directed banner instead of relying on missing image files.
 *
 * Interaction:
 *   • Auto-advances every `interval` ms while hover/touch idle.
 *   • Pointer drag / touch swipe horizontally moves to next/prev slide
 *     (threshold ≈ 18% of width or quick flick).
 *   • Dot navigation jumps to a specific slide.
 */
export function BannerSlideshow({
  slides,
  interval = 6000,
  className = "",
  rounded = "rounded-none",
}: {
  slides: ReactNode[];
  interval?: number;
  className?: string;
  rounded?: string;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  // direction: +1 next, -1 prev — drives slide-in animation direction.
  const [direction, setDirection] = useState<1 | -1>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = (next: number, dir: 1 | -1) => {
    setDirection(dir);
    setActive(((next % slides.length) + slides.length) % slides.length);
  };
  const next = () => goTo(active + 1, 1);
  const prev = () => goTo(active - 1, -1);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = window.setInterval(() => {
      setDirection(1);
      setActive((i) => (i + 1) % slides.length);
    }, interval);
    return () => window.clearInterval(id);
  }, [paused, slides.length, interval, active]);

  // Pointer drag — only swiping past a meaningful threshold (or with velocity)
  // commits to next/prev so accidental jiggles never advance.
  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const width = containerRef.current?.offsetWidth ?? window.innerWidth;
    const offsetX = info.offset.x;
    const velocityX = info.velocity.x;
    const swipePower = Math.abs(offsetX) + Math.abs(velocityX) * 0.25;
    if (swipePower < width * 0.18) return; // not enough — snap back, no nav
    if (offsetX < 0) next();
    else prev();
  };

  if (slides.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden shadow-2xl shadow-black/40 ${rounded} ${className} touch-pan-y`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Portrait on phones so the banners are tall and impactful; switches to
          a wide cinematic 16:6 from sm: up. */}
      <div className="relative w-full aspect-[4/5] sm:aspect-16/6">
        <AnimatePresence mode="sync" custom={direction}>
          {slides.map((node, i) =>
            i === active ? (
              <motion.div
                key={i}
                custom={direction}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragStart={() => setPaused(true)}
                onDragEnd={(e, info) => {
                  handleDragEnd(e, info);
                  setPaused(false);
                }}
                initial={(d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60 })}
                animate={{ opacity: 1, x: 0 }}
                exit={(d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60 })}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
              >
                {node}
              </motion.div>
            ) : null,
          )}
        </AnimatePresence>
      </div>

      {slides.length > 1 && (
        <>
          {/* Prev / next arrows — appear on hover (desktop) and always
              on touch devices via opacity-100 sm:opacity-0 cascade. */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous slide"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 grid place-items-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md text-white transition-all opacity-80 hover:opacity-100 hover:-translate-x-0.5 hover:scale-105 active:scale-95 shadow-lg"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next slide"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 grid place-items-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md text-white transition-all opacity-80 hover:opacity-100 hover:translate-x-0.5 hover:scale-105 active:scale-95 shadow-lg"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
          </button>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-3 py-2 rounded-full bg-black/30 backdrop-blur-md">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > active ? 1 : -1)}
                aria-label={`Show slide ${i + 1}`}
                className="group p-1"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-500 ${
                    i === active ? "w-8 bg-white" : "w-1.5 bg-white/50 group-hover:bg-white/80"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
