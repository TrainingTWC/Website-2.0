import { motion } from "motion/react";

interface GalaxySweepProps {
  origin: { x: number; y: number };
  onComplete: () => void;
  /** Total duration in seconds. Defaults to a relaxed 1.4s. */
  duration?: number;
}

/**
 * Galaxy-AI style sweep transition.
 *
 * A sharp diagonal beam with a compressed white core flanked by light-blue
 * and sea-green light-leak gradients accelerates across the screen on an
 * ease-in-out curve while a grainy, sparkly atmospheric wash settles in
 * behind it.  The beam is anchored to the user's click `origin` so the
 * energy reads as emanating from the button they pressed.
 */
export function GalaxySweep({ origin, onComplete, duration = 1.4 }: GalaxySweepProps) {
  // Inline SVG turbulence → cheap "film grain" without an extra asset.
  const grainUrl =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>
        <filter id='n'>
          <feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/>
          <feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/>
        </filter>
        <rect width='100%' height='100%' filter='url(%23n)'/>
      </svg>`,
    );

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden">
      {/* ── 1. Atmospheric wash: sea-green core fading to deep blue ── */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 120% 90% at ${origin.x}px ${origin.y}px,
            #6FE4D2 0%,
            #2EB6A9 18%,
            #2C7A7B 38%,
            #1E4D6B 62%,
            #0B2138 88%,
            #050E1F 100%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.15, 0.85, 1] }}
        transition={{ duration, ease: [0.42, 0, 0.58, 1], times: [0, 0.2, 0.65, 1] }}
        onAnimationComplete={onComplete}
      />

      {/* ── 2. Diagonal beam wrapper: rotated, anchored to origin ─── */}
      <div
        className="absolute"
        style={{
          top: origin.y,
          left: origin.x,
          width: "320vmax",
          height: "70vmax",
          transform: "translate(-50%, -50%) rotate(-22deg)",
          overflow: "visible",
        }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            // Compressed white core flanked by feathered light-leak gradients.
            background:
              "linear-gradient(90deg," +
              " rgba(110,228,210,0) 0%," +
              " rgba(110,228,210,0.18) 22%," +
              " rgba(150,210,255,0.45) 38%," +
              " rgba(220,245,255,0.95) 48%," +
              " #ffffff 50%," +
              " rgba(220,245,255,0.95) 52%," +
              " rgba(150,210,255,0.45) 62%," +
              " rgba(110,228,210,0.18) 78%," +
              " rgba(110,228,210,0) 100%)",
            filter: "blur(10px) saturate(1.2)",
            mixBlendMode: "screen",
          }}
          initial={{ x: "-110%", opacity: 0 }}
          animate={{ x: "110%", opacity: [0, 1, 1, 0.85, 0] }}
          // ease-in-out: rapid acceleration, elegant deceleration.
          transition={{
            duration: duration * 0.85,
            ease: [0.45, 0, 0.25, 1],
            times: [0, 0.18, 0.55, 0.85, 1],
          }}
        />
        {/* Inner razor-sharp core for that "ultra-bright" compute flash */}
        <motion.div
          className="absolute inset-y-0"
          style={{
            left: "50%",
            width: "3vmax",
            marginLeft: "-1.5vmax",
            background:
              "linear-gradient(90deg, transparent, #ffffff, transparent)",
            filter: "blur(2px)",
            mixBlendMode: "screen",
          }}
          initial={{ x: "-110vmax", opacity: 0 }}
          animate={{ x: "110vmax", opacity: [0, 1, 1, 0] }}
          transition={{
            duration: duration * 0.85,
            ease: [0.45, 0, 0.25, 1],
            times: [0, 0.18, 0.7, 1],
          }}
        />
      </div>

      {/* ── 3. Film grain / shimmer ─────────────────────────────── */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${grainUrl}")`,
          backgroundSize: "240px 240px",
          mixBlendMode: "overlay",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.35, 0.22] }}
        transition={{ duration, ease: "easeOut", times: [0, 0.5, 1] }}
      />

      {/* ── 4. Sparkles ─────────────────────────────────────────── */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(2px 2px at 12% 22%, #ffffff, transparent 60%),
            radial-gradient(1.5px 1.5px at 68% 71%, #B2F5EA, transparent 60%),
            radial-gradient(2px 2px at 82% 18%, #ffffff, transparent 60%),
            radial-gradient(1px 1px at 41% 82%, #BEE3F8, transparent 60%),
            radial-gradient(1.5px 1.5px at 91% 58%, #ffffff, transparent 60%),
            radial-gradient(1px 1px at 8% 64%, #ffffff, transparent 60%),
            radial-gradient(2px 2px at 56% 13%, #B2F5EA, transparent 60%),
            radial-gradient(1px 1px at 32% 48%, #ffffff, transparent 60%),
            radial-gradient(1.5px 1.5px at 24% 88%, #BEE3F8, transparent 60%),
            radial-gradient(1px 1px at 76% 42%, #ffffff, transparent 60%),
            radial-gradient(2px 2px at 48% 64%, #B2F5EA, transparent 60%),
            radial-gradient(1px 1px at 14% 8%, #ffffff, transparent 60%)
          `,
          backgroundSize: "100% 100%",
          mixBlendMode: "screen",
        }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: [0, 0.8, 1], scale: [0.92, 1.04, 1] }}
        transition={{ duration, ease: [0.4, 0, 0.4, 1], times: [0, 0.55, 1] }}
      />
    </div>
  );
}
