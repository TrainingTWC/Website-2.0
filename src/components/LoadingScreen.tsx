import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface LoadingScreenProps {
  /** Becomes true once the app's critical data is ready */
  ready: boolean;
  /** Optional callback fired once the exit animation completes */
  onExitComplete?: () => void;
}

/**
 * Cinematic intro that masks the network jitter on first visit.
 *
 * Plays a brand reveal until `ready` flips true AND a minimum on-screen
 * time has elapsed (prevents harsh flashes on fast connections), then
 * curtains out with a paper-fold animation.
 */
export function LoadingScreen({ ready, onExitComplete }: LoadingScreenProps) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);

  const phases = [
    "Sourcing the harvest",
    "Calibrating the roast",
    "Awakening the senses",
    "Welcome",
  ];

  // Drive progress: fast climb to ~92%, then wait for `ready`, then snap to 100.
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const minMs = 1600; // minimum showtime so the brand moment lands
    const cap = 92;

    const tick = (now: number) => {
      const elapsed = now - start;
      const eased = 1 - Math.exp(-elapsed / 700); // ease-out
      const target = ready && elapsed > minMs ? 100 : cap * eased;
      setProgress((p) => Math.max(p, target));
      if (target < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  // Cycle phase labels in time with progress
  useEffect(() => {
    const idx = Math.min(phases.length - 1, Math.floor((progress / 100) * phases.length));
    setPhaseIdx(idx);
  }, [progress, phases.length]);

  // Once we've hit 100% and ready, hide
  useEffect(() => {
    if (ready && progress >= 100) {
      const t = setTimeout(() => setVisible(false), 450);
      return () => clearTimeout(t);
    }
  }, [ready, progress]);

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {visible && (
        <motion.div
          key="loader"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[999] overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse at 30% 20%, #F5F2ED 0%, #EFEAE1 40%, #E6DECF 75%, #DDD1BC 100%)",
          }}
        >
          {/* Top curtain that drops out */}
          <motion.div
            exit={{ y: "-100%" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-x-0 top-0 h-1/2"
            style={{ background: "linear-gradient(to bottom, #FAF9F6 0%, #F5F2ED 100%)" }}
          />
          {/* Bottom curtain */}
          <motion.div
            exit={{ y: "100%" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-x-0 bottom-0 h-1/2"
            style={{ background: "linear-gradient(to top, #EFEAE1 0%, #F5F2ED 100%)" }}
          />

          {/* Ambient orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-natural-accent/10 blur-[120px] pointer-events-none" />

          {/* Center stage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-10 px-6"
            >
              {/* Logo */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 -m-8 rounded-full bg-natural-accent/15 blur-2xl"
                />
                <img
                  src="logo.png"
                  alt="Third Wave Coffee"
                  className="relative h-16 w-auto select-none"
                  draggable={false}
                />
              </motion.div>

              {/* Tagline */}
              <div className="flex flex-col items-center gap-2">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-[10px] font-bold tracking-[0.45em] uppercase text-natural-accent"
                >
                  Third Intelligence
                </motion.span>
                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="font-serif font-bold text-2xl tracking-tight text-natural-text"
                >
                  Crafting your experience
                </motion.h1>
              </div>

              {/* Progress bar */}
              <div className="w-[280px] flex flex-col items-center gap-3">
                <div className="relative h-[2px] w-full bg-natural-stone/40 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 bg-natural-accent rounded-full"
                  />
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 bg-natural-accent blur-md rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between w-full text-[10px] font-mono tracking-widest text-natural-text/40">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={phaseIdx}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.4 }}
                    >
                      {phases[phaseIdx]}…
                    </motion.span>
                  </AnimatePresence>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
