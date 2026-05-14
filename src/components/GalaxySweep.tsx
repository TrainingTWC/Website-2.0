import { motion } from "motion/react";
import { useMemo } from "react";

interface GalaxySweepProps {
  origin: { x: number; y: number };
  onComplete: () => void;
  /** Total duration in seconds. Defaults to a relaxed 1.8s. */
  duration?: number;
}

/**
 * Galaxy-AI style fluid sweep transition — premium subtle variant.
 *
 * A gentle radial bloom emanates from the click origin behind a quiet
 * translucent wash, with a soft halo wave and a sparse scatter of tiny
 * glitters. Tuned down from the original to feel restrained and luxe
 * rather than fireworks.
 */
export function GalaxySweep({ origin, onComplete, duration = 1.8 }: GalaxySweepProps) {
  const grainUrl =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>
        <filter id='n'>
          <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>
          <feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.35 0'/>
        </filter>
        <rect width='100%' height='100%' filter='url(%23n)'/>
      </svg>`,
    );

  // Sparse glitter scatter — 28 tiny twinkles, no hard halos.
  const glitters = useMemo(() => {
    const count = 28;
    const palette = ["#ffffff", "#D5F4EE", "#DCEFFA", "#E6FFFA"];
    return Array.from({ length: count }, (_, i) => {
      const isNear = i % 3 === 0;
      const angle = Math.random() * Math.PI * 2;
      const dist = isNear
        ? 60 + Math.random() * 240
        : 220 + Math.random() * 820;
      const size = 1 + Math.random() * 1.6;
      const hue = palette[Math.floor(Math.random() * palette.length)];
      const delay = Math.random() * (duration * 0.6);
      const life = 0.7 + Math.random() * 0.7;
      const driftAngle = angle + (Math.random() - 0.5) * 0.6;
      const driftDist = 20 + Math.random() * 70;
      return {
        id: i,
        x: origin.x + Math.cos(angle) * dist,
        y: origin.y + Math.sin(angle) * dist,
        dx: Math.cos(driftAngle) * driftDist,
        dy: Math.sin(driftAngle) * driftDist,
        size,
        hue,
        delay,
        life,
      };
    });
  }, [origin.x, origin.y, duration]);

  // Two ripple rings — quieter than three; just enough for "wave" feel.
  const ripples = useMemo(
    () => [
      { delay: 0.0, peakScale: 12, alpha: 0.4 },
      { delay: 0.22, peakScale: 8, alpha: 0.22 },
    ],
    [],
  );

  // Silky cubic curve — slow start, gentle middle, long decel tail.
  const fluid: [number, number, number, number] = [0.32, 0.72, 0.28, 1];

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden">
      {/* 1. Soft translucent tint wash — peaks at ~55% so background shows through. */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${origin.x}px ${origin.y}px,
            rgba(190, 232, 224, 0.35) 0%,
            rgba(140, 210, 200, 0.32) 20%,
            rgba(110, 180, 190, 0.30) 42%,
            rgba(90, 150, 175, 0.30) 65%,
            rgba(70, 120, 150, 0.32) 85%,
            rgba(55, 95, 130, 0.36) 100%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0.5, 0.55] }}
        transition={{ duration, ease: fluid, times: [0, 0.35, 0.7, 1] }}
        onAnimationComplete={onComplete}
      />

      {/* 2. Morphing bloom halo — soft, organic, low-opacity. */}
      <motion.div
        className="absolute"
        style={{
          left: origin.x,
          top: origin.y,
          width: "60vmax",
          height: "60vmax",
          marginLeft: "-30vmax",
          marginTop: "-30vmax",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(190,235,225,0.45) 16%, rgba(140,210,200,0.30) 34%, rgba(150,200,225,0.18) 56%, rgba(140,200,210,0) 78%)",
          filter: "blur(36px)",
          mixBlendMode: "screen",
        }}
        initial={{
          scale: 0.08,
          opacity: 0,
          borderRadius: "50% 50% 50% 50% / 50% 50% 50% 50%",
        }}
        animate={{
          scale: [0.08, 0.5, 1.2, 2],
          opacity: [0, 0.55, 0.5, 0],
          borderRadius: [
            "50% 50% 50% 50% / 50% 50% 50% 50%",
            "58% 42% 55% 45% / 48% 60% 40% 52%",
            "44% 56% 48% 52% / 60% 45% 55% 40%",
            "52% 48% 50% 50% / 50% 52% 48% 50%",
          ],
        }}
        transition={{ duration: duration * 1.0, ease: fluid, times: [0, 0.3, 0.7, 1] }}
      />

      {/* 3. Ripple rings — thin, no boxShadow glow. */}
      {ripples.map((r, i) => (
        <motion.div
          key={`ripple-${i}`}
          className="absolute rounded-full"
          style={{
            left: origin.x,
            top: origin.y,
            width: "12vmax",
            height: "12vmax",
            marginLeft: "-6vmax",
            marginTop: "-6vmax",
            border: `1px solid rgba(220,240,245,${r.alpha})`,
            filter: "blur(1px)",
            mixBlendMode: "screen",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, r.peakScale * 0.55, r.peakScale],
            opacity: [0, r.alpha, r.alpha * 0.5, 0],
          }}
          transition={{
            duration: duration * 1.0,
            delay: r.delay,
            ease: fluid,
            times: [0, 0.22, 0.65, 1],
          }}
        />
      ))}

      {/* 4. Sparse glitter sparks — capped at 70% opacity, no harsh boxShadow. */}
      {glitters.map((g) => (
        <motion.div
          key={g.id}
          className="absolute rounded-full"
          style={{
            left: g.x,
            top: g.y,
            width: g.size,
            height: g.size,
            marginLeft: -g.size / 2,
            marginTop: -g.size / 2,
            background: g.hue,
            boxShadow: `0 0 ${g.size * 2}px ${g.size * 0.4}px ${g.hue}`,
            mixBlendMode: "screen",
          }}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 0.7, 0.7, 0],
            scale: [0, 1, 0.9, 0.4],
            x: [0, g.dx * 0.4, g.dx],
            y: [0, g.dy * 0.4, g.dy],
          }}
          transition={{
            duration: g.life,
            delay: g.delay,
            ease: fluid,
            times: [0, 0.25, 0.6, 1],
          }}
        />
      ))}

      {/* 5. Whisper of film grain. */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${grainUrl}")`,
          backgroundSize: "240px 240px",
          mixBlendMode: "overlay",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.12, 0.08] }}
        transition={{ duration, ease: "easeOut", times: [0, 0.5, 1] }}
      />
    </div>
  );
}
