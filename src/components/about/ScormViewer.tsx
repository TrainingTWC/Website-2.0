/**
 * ScormViewer — self-contained orientation module launcher for the Careers page.
 *
 * Usage:
 *   <ScormViewer launchFile="story.html" durationLabel="~20 min" />
 *
 * The SCORM content is served from public/scorm/orientation/{launchFile}.
 * Progress is persisted in localStorage via the SCORM 1.2 shim in
 * public/scorm/player.html — no LMS or server needed.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GraduationCap, X } from "lucide-react";

type Status = "not_started" | "incomplete" | "completed" | "passed" | "failed";

function readStoredStatus(): Status {
  if (typeof window === "undefined") return "not_started";
  try {
    const raw = localStorage.getItem("brewmatch_scorm_orientation");
    if (!raw) return "not_started";
    const data = JSON.parse(raw) as Record<string, string>;
    const s = data["cmi.core.lesson_status"] || "";
    if (s === "completed" || s === "passed") return "completed";
    if (s === "failed") return "failed";
    if (s === "incomplete") return "incomplete";
    return "not_started";
  } catch {
    return "not_started";
  }
}

const STATUS_LABEL: Record<Status, string> = {
  not_started: "Start orientation",
  incomplete: "Resume orientation",
  completed: "Review orientation",
  passed: "Review orientation",
  failed: "Retry orientation",
};

const STATUS_BADGE: Record<Status, { label: string; style: string } | null> = {
  not_started: null,
  incomplete: { label: "In progress", style: "bg-amber-400/15 text-amber-600" },
  completed: { label: "Completed ✓", style: "bg-emerald-400/15 text-emerald-600" },
  passed: { label: "Passed ✓", style: "bg-emerald-400/15 text-emerald-600" },
  failed: { label: "Needs retry", style: "bg-rose-400/15 text-rose-600" },
};

export function ScormViewer({
  launchFile = "story.html",
  durationLabel = "~20 min",
  title = "Company Orientation",
  description = "Everything we expect you to know before day one — our sourcing philosophy, cafe standards, feedback culture, and what a genuinely good cup costs to make. Self-paced. No sign-in required.",
}: {
  launchFile?: string;
  durationLabel?: string;
  title?: string;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("not_started");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Read persisted status on mount.
  useEffect(() => {
    setStatus(readStoredStatus());
  }, []);

  // Listen for postMessage events from the SCORM player iframe.
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "scorm:status") {
        const s = e.data.status as string;
        if (s === "completed" || s === "passed") setStatus("completed");
        else if (s === "failed") setStatus("failed");
        else if (s === "incomplete") setStatus("incomplete");
      }
      if (e.data.type === "scorm:finish") {
        setStatus(readStoredStatus());
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Lock body scroll while modal is open.
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const badge = STATUS_BADGE[status];
  const ctaLabel = STATUS_LABEL[status];
  const playerUrl = `/scorm/player.html?launch=${encodeURIComponent(launchFile)}`;

  return (
    <>
      {/* ── Teaser card ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-about-accent bg-about-tint shadow-about-soft p-7 sm:p-9 flex flex-col sm:flex-row gap-7 items-start sm:items-center">
        {/* Icon / glyph */}
        <div className="shrink-0 w-16 h-16 rounded-2xl border-2 border-about-accent flex items-center justify-center text-about-accent" aria-hidden>
          <GraduationCap className="w-7 h-7" strokeWidth={1.75} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Orientation module</span>
            {badge && (
              <span className={`text-[10px] font-bold uppercase tracking-[0.3em] px-2.5 py-1 rounded-full ${badge.style}`}>
                {badge.label}
              </span>
            )}
          </div>
          <h3 className="font-serif font-bold text-2xl sm:text-3xl leading-snug">{title}</h3>
          <p className="mt-3 text-natural-text/68 text-sm leading-relaxed max-w-2xl">{description}</p>
          <p className="mt-2 text-xs text-natural-text/45 font-bold uppercase tracking-[0.25em]">{durationLabel} · Self-paced · No account needed</p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-natural-text text-natural-bg font-bold text-sm transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-natural-accent"
        >
          {status === "completed" || status === "passed" ? (
            <span>↩ {ctaLabel}</span>
          ) : (
            <span>▶ {ctaLabel}</span>
          )}
        </button>
      </div>

      {/* ── Full-screen modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-0 z-[9999] flex flex-col bg-[#0f0e0c]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/50">
                  Third Wave Coffee · {title}
                </span>
                {badge && (
                  <span className={`text-[10px] font-bold uppercase tracking-[0.25em] px-2 py-0.5 rounded-full ${badge.style}`}>
                    {badge.label}
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white transition-colors text-xl leading-none font-bold px-2 py-1 rounded-lg hover:bg-white/10"
                aria-label="Close orientation module"
              ><X className="w-4 h-4" /></button>
            </div>

            {/* SCORM iframe */}
            <iframe
              ref={iframeRef}
              src={playerUrl}
              title={title}
              className="flex-1 w-full border-none"
              allow="fullscreen"
              allowFullScreen
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
