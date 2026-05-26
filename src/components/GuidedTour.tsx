"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ArrowDown, Store } from "lucide-react";
import { asset } from "../lib/asset";

const TOUR_KEY = "twc_guided_tour_v2";

type Hint = {
  id: string;
  title: string;
  body: string;
  duration: number;
};

const HINTS: Hint[] = [
  {
    id: "scroll",
    title: "Explore the collection",
    body: "Scroll down to discover seasonal beans, brewing gear, merch and more.",
    duration: 5000,
  },
  {
    id: "ai",
    title: "Third Intelligence",
    body: "Our AI recommends personalised brew recipes and craft drinks tailored to your taste.",
    duration: 7000,
  },
  {
    id: "shop",
    title: "Shop All",
    body: "Every bean, bag and accessory we carry — in one place.",
    duration: 5000,
  },
];

function HintIcon({ id }: { id: string }) {
  if (id === "ai") {
    return (
      <img
        src={asset("third-intelligence-icon.png")}
        alt=""
        className="w-5 h-5 object-contain"
      />
    );
  }
  if (id === "shop") return <Store className="w-4.5 h-4.5 text-natural-accent" />;
  return <ArrowDown className="w-4 h-4 text-natural-accent" />;
}

export function GuidedTour({
  onOpenTI,
}: {
  onOpenTI?: (e: React.MouseEvent) => void;
}) {
  const [step, setStep] = useState<number>(-1);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(TOUR_KEY)) return;
    const t = setTimeout(() => {
      setStep(0);
      setVisible(true);
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (step < 0 || step >= HINTS.length) return;
    const t = setTimeout(() => {
      if (step < HINTS.length - 1) {
        setStep((s) => s + 1);
      } else {
        dismiss();
      }
    }, HINTS[step].duration);
    return () => clearTimeout(t);
  }, [step]);

  function dismiss() {
    setVisible(false);
    if (typeof window !== "undefined") localStorage.setItem(TOUR_KEY, "1");
  }

  const hint = step >= 0 && step < HINTS.length ? HINTS[step] : null;

  return (
    <AnimatePresence>
      {visible && hint && (
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 34, mass: 0.8 }}
          className="fixed bottom-[5.5rem] md:bottom-7 right-4 md:right-6 z-[90] w-[252px] pointer-events-auto"
          style={{
            background: "rgba(252,251,248,0.92)",
            backdropFilter: "blur(48px) saturate(180%) brightness(1.06)",
            WebkitBackdropFilter: "blur(48px) saturate(180%) brightness(1.06)",
            borderRadius: 20,
            boxShadow:
              "0 16px 48px -8px rgba(44,24,16,0.20), 0 1.5px 0 rgba(255,255,255,0.88) inset, 0 0 0 1px rgba(255,255,255,0.52)",
          }}
        >
          {/* top accent shimmer */}
          <span
            aria-hidden
            className="absolute top-0 left-6 right-6 h-px rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(168,118,68,0.38), transparent)",
            }}
          />

          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* icon */}
              <span
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(168,118,68,0.18) 0%, rgba(168,118,68,0.06) 100%)",
                  boxShadow:
                    "0 1px 0 rgba(255,255,255,0.7) inset, 0 0 0 1px rgba(168,118,68,0.18)",
                }}
              >
                <HintIcon id={hint.id} />
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-natural-text leading-tight">
                  {hint.title}
                </p>
                <p className="text-[11px] text-natural-text/55 mt-0.5 leading-snug">
                  {hint.body}
                </p>
              </div>

              <button
                onClick={dismiss}
                aria-label="Dismiss guide"
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-900/8 transition-colors text-natural-text/28 hover:text-natural-text/55 -mt-0.5 ml-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* footer: progress dots + action */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-900/6">
              {/* dots */}
              <div className="flex items-center gap-1.5">
                {HINTS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    aria-label={`Hint ${i + 1}`}
                    className={`rounded-full transition-all duration-300 ${
                      i === step
                        ? "w-4 h-1.5 bg-natural-accent"
                        : "w-1.5 h-1.5 bg-natural-text/18 hover:bg-natural-text/35"
                    }`}
                  />
                ))}
              </div>

              {/* CTA */}
              {hint.id === "ai" && onOpenTI ? (
                <button
                  onClick={(e) => {
                    dismiss();
                    onOpenTI(e);
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-natural-accent hover:opacity-70 transition-opacity"
                >
                  Try it <ChevronRight className="w-3 h-3" />
                </button>
              ) : step < HINTS.length - 1 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="flex items-center gap-1 text-[11px] font-bold text-natural-text/38 hover:text-natural-text/60 transition-colors"
                >
                  Next <ChevronRight className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={dismiss}
                  className="text-[11px] font-bold text-natural-text/38 hover:text-natural-text/60 transition-colors"
                >
                  Got it
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
