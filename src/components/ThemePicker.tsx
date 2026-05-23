"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Palette, Check } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export function ThemePicker() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const ease: [number, number, number, number] = [0.65, 0, 0.35, 1];
  const motionDuration = reducedMotion ? 0 : 0.32;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 left-4 z-[90] flex items-end gap-3"
    >
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: motionDuration, ease }}
            className="origin-bottom-left rounded-2xl border p-3 shadow-2xl backdrop-blur-md"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-natural-paper) 92%, transparent)",
              borderColor: "color-mix(in srgb, var(--color-natural-stone) 60%, transparent)",
              color: "var(--color-natural-text)",
              minWidth: 248,
            }}
            role="dialog"
            aria-label="Choose a colour palette"
          >
            <div className="mb-2 px-1 text-[11px] uppercase tracking-[0.18em] opacity-70">
              Palette
            </div>
            <ul className="flex flex-col gap-1">
              {themes.map((t) => {
                const isActive = t.id === theme;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setTheme(t.id);
                        // Don't auto-close — let the user feel each palette switch.
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--color-natural-stone)_28%,transparent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-natural-accent)]"
                      aria-pressed={isActive}
                    >
                      <span
                        className="grid h-9 w-9 shrink-0 grid-cols-3 grid-rows-2 overflow-hidden rounded-full ring-2 ring-offset-2"
                        style={{
                          // @ts-expect-error CSS var
                          "--tw-ring-color": isActive
                            ? "var(--color-natural-text)"
                            : "transparent",
                          // @ts-expect-error CSS var
                          "--tw-ring-offset-color":
                            "color-mix(in srgb, var(--color-natural-paper) 92%, transparent)",
                        }}
                        aria-hidden
                      >
                        {t.swatches.map((c, i) => (
                          <span
                            key={i}
                            style={{ backgroundColor: c }}
                            className="block h-full w-full"
                          />
                        ))}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <span className="truncate">{t.label}</span>
                          {isActive && (
                            <Check className="h-3.5 w-3.5 shrink-0 opacity-80" />
                          )}
                        </span>
                        <span className="truncate text-[11px] opacity-60">
                          {t.tagline}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close palette picker" : "Change palette"}
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-full shadow-xl ring-1 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2"
        whileTap={{ scale: 0.92 }}
        style={{
          backgroundColor: "var(--color-natural-text)",
          color: "var(--color-natural-paper)",
          boxShadow:
            "0 12px 30px -10px color-mix(in srgb, var(--color-natural-text) 50%, transparent)",
          // @ts-expect-error CSS var
          "--tw-ring-color":
            "color-mix(in srgb, var(--color-natural-accent) 65%, transparent)",
        }}
      >
        <Palette className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </motion.button>
    </div>
  );
}
