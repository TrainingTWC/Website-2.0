import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface Banner {
  src: string;
  alt: string;
  href?: string;
}

/**
 * BannerSlideshow — auto-rotating full-width banner.
 * - Crossfades between banners with a slow Ken Burns zoom on the active slide.
 * - Dot indicators are clickable + magnetic (sticky for the custom cursor).
 * - Pauses on hover.
 */
export function BannerSlideshow({
  banners,
  interval = 5500,
  className = "",
  rounded = "rounded-[2.5rem]",
}: {
  banners: Banner[];
  interval?: number;
  className?: string;
  rounded?: string;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % banners.length);
    }, interval);
    return () => window.clearInterval(id);
  }, [paused, banners.length, interval]);

  if (banners.length === 0) return null;

  return (
    <div
      className={`relative w-full overflow-hidden shadow-2xl shadow-black/40 ${rounded} ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      <div className="relative w-full aspect-[16/6] sm:aspect-[16/5.4]">
        <AnimatePresence mode="sync">
          {banners.map((b, i) =>
            i === active ? (
              <motion.a
                key={i}
                href={b.href ?? "#"}
                onClick={(e) => {
                  if (!b.href) e.preventDefault();
                }}
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 block"
              >
                <motion.img
                  src={b.src}
                  alt={b.alt}
                  className="w-full h-full object-cover"
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1.12 }}
                  transition={{ duration: interval / 1000, ease: "linear" }}
                  loading={i === 0 ? "eager" : "lazy"}
                  draggable={false}
                />
              </motion.a>
            ) : null
          )}
        </AnimatePresence>
      </div>

      {/* Soft bottom gradient for legibility */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/30 to-transparent" />

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-3 py-2 rounded-full bg-black/30 backdrop-blur-md">
          {banners.map((_, i) => (
            <button
              key={i}
              data-magnetic
              onClick={() => setActive(i)}
              aria-label={`Show banner ${i + 1}`}
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
