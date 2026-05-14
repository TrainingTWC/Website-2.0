import { motion } from "motion/react";
import { useMemo } from "react";

interface GalaxySweepProps {
  origin: { x: number; y: number };
  onComplete: () => void;
  /** Total duration in seconds. Defaults to a relaxed 1.4s. */
  duration?: number;
}

/**
 * Galaxy-AI style burst transition.
 *
 * A radial burst of sea-green + light-blue light emanates from the click
 * origin, accompanied by a translucent tinted wash (so the underlying UI
 * stays visible), an expanding shimmer ring, dozens of tiny glitter
 * particles that twinkle and drift outward, and fine film grain. Silky
 * ease-in-out throughout — no harsh cuts, no pitch-black corners.
 */
export function GalaxySweep({ origin, onComplete, duration = 1.4 }: GalaxySweepProps) {
  // Inline SVG turbulence → cheap "film grain" without an extra asset.
  const grainUrl =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>
        <filter id='n'>
          <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>
          <feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0'/>
        </filter>
        <rect width='100%' height='100%' filter='url(%23n)'/>
      </svg>`,
    );

  // Generate ~54 glitter particles arranged radially around origin with
  // randomized distance, angle, size, hue, delay, life, and outward drift.
  const glitters = useMemo(() => {
    const count = 54;
    const palette = ["#ffffff", "#B2F5EA", "#BEE3F8", "#A7F3E8", "#E6FFFA", "#C8F0FF"];
    return Array.from({ length: count }, (_, i) => {
      const isNear = i % 3 === 0;
      const angle = Math.random() * Math.PI * 2;
      const dist = isNear
        ? 40 + Math.random() * 220
        : 200 + Math.random() * 900;
      const size = 1.5 + Math.random() * 3.5;
      const hue = palette[Math.floor(Math.random() * palette.length)];
      const delay = Math.random() * (duration * 0.55);
      const life = 0.45 + Math.random() * 0.7;
      const driftAngle = angle + (Math.random() - 0.5) * 0.6;
      const driftDist = 30 + Math.random() * 90;
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

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden">
      {/* 1. Translucent tint wash — see-through so the page stays visible. */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${origin.x}px ${origin.y}px,
            rgba(178, 245, 234, 0.55) 0%,
            rgba(110, 228, 210, 0.50) 18%,
            rgba(94, 196, 196, 0.45) 38%,
            rgba(70, 150, 180, 0.42) 60%,
            rgba(46, 100, 140, 0.42) 82%,
            rgba(30, 70, 110, 0.45) 100%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0.7, 0.95] }}
        transition={{ duration, ease: [0.42, 0, 0.58, 1], times: [0, 0.25, 0.6, 1] }}
        onAnimationComplete={onComplete}
      />

      {/* 2. Soft bloom halo — bright sea-green burst from origin. */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: origin.x,
          top: origin.y,
          width: "60vmax",
          height: "60vmax",
          marginLeft: "-30vmax",
          marginTop: "-30vmax",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(178,245,234,0.85) 12%, rgba(110,228,210,0.55) 28%, rgba(150,210,255,0.35) 48%, rgba(110,228,210,0) 75%)",
          filter: "blur(20px)",
          mixBlendMode: "screen",
        }}
        initial={{ scale: 0.05, opacity: 0 }}
        animate={{ scale: [0.05, 0.6, 1.4, 2], opacity: [0, 1, 0.85, 0] }}
        transition={{ duration: duration * 0.95, ease: [0.22, 0.9, 0.3, 1], times: [0, 0.3, 0.65, 1] }}
      />

      {/* 3. Sharp inner core flash — the "ultra-bright" instant. */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: origin.x,
          top: origin.y,
          width: "18vmax",
          height: "18vmax",
          marginLeft: "-9vmax",
          marginTop: "-9vmax",
          background:
            "radial-gradient(circle, #ffffff 0%, rgba(220,245,255,0.9) 25%, rgba(178,245,234,0.5) 55%, transparent 75%)",
          filter: "blur(6px)",
          mixBlendMode: "screen",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1, 1.6, 2.4], opacity: [0, 1, 0.6, 0] }}
        transition={{ duration: duration * 0.7, ease: [0.2, 0.9, 0.35, 1], times: [0, 0.25, 0.6, 1] }}
      />

      {/* 4. Expanding shimmer ring — thin halo wave. */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: origin.x,
          top: origin.y,
          width: "12vmax",
          height: "12vmax",
          marginLeft: "-6vmax",
          marginTop: "-6vmax",
          border: "2px solid rgba(220,245,255,0.85)",
          boxShadow:
            "0 0 24px 6px rgba(178,245,234,0.55), inset 0 0 18px 4px rgba(190,227,248,0.4)",
          filter: "blur(1.5px)",
          mixBlendMode: "screen",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1, 6, 14], opacity: [0, 0.9, 0.45, 0] }}
        transition={{ duration, ease: [0.25, 0.85, 0.3, 1], times: [0, 0.2, 0.6, 1] }}
      />

      {/* 5. Glitter particles — tiny twinkling sparks drifting outward. */}
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
            boxShadow: `0 0 ${g.size * 3}px ${g.size * 0.8}px ${g.hue}`,
            mixBlendMode: "screen",
          }}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0.4],
            x: [0, g.dx * 0.4, g.dx],
            y: [0, g.dy * 0.4, g.dy],
          }}
          transition={{
            duration: g.life,
            delay: g.delay,
            ease: [0.25, 0.8, 0.3, 1],
            times: [0, 0.2, 0.55, 1],
          }}
        />
      ))}

      {/* 6. Film grain — subtle, lifted to feel premium. */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${grainUrl}")`,
          backgroundSize: "240px 240px",
          mixBlendMode: "overlay",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.22, 0.15] }}
        transition={{ duration, ease: "easeOut", times: [0, 0.5, 1] }}
      />
    </div>
  );
}
