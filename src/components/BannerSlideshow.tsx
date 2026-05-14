import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

/**
 * BannerSlideshow — auto-rotating, accepts React slides so each can be a
 * fully art-directed banner instead of relying on missing image files.
 */
export function BannerSlideshow({
  slides,
  interval = 6000,
  className = "",
  rounded = "rounded-[2.5rem]",
}: {
  slides: ReactNode[];
  interval?: number;
  className?: string;
  rounded?: string;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, interval);
    return () => window.clearInterval(id);
  }, [paused, slides.length, interval]);

  if (slides.length === 0) return null;

  return (
    <div
      className={`relative w-full overflow-hidden shadow-2xl shadow-black/40 ${rounded} ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Portrait on phones so the banners are tall and impactful; switches to
          a wide cinematic 16:6 from sm: up. */}
      <div className="relative w-full aspect-[4/5] sm:aspect-16/6">
        <AnimatePresence mode="sync">
          {slides.map((node, i) =>
            i === active ? (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                {node}
              </motion.div>
            ) : null
          )}
        </AnimatePresence>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-3 py-2 rounded-full bg-black/30 backdrop-blur-md">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
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
      )}
    </div>
  );
}
