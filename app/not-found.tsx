"use client";

import { useEffect } from "react";
import Link from "next/link";

const HOME_SECTION_PATHS = new Set([
  "/hero",
  "/section-coffee-beans",
  "/section-coffee-ecb",
  "/section-coffee-brewing",
  "/section-merch-drinkware",
  "/section-merch-bags",
  "/section-merch-keychains",
  "/section-merch-chocolates",
  "/section-merch-brewing",
  "/categories",
  "/our-story",
]);

export default function NotFound() {
  useEffect(() => {
    if (HOME_SECTION_PATHS.has(window.location.pathname)) {
      const id = window.location.pathname.slice(1);
      window.location.replace(id === "hero" ? "/" : `/#${id}`);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F2ED] text-[#2C1810] font-sans">
      <div className="text-center space-y-6 px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#5A5A40]">
          Third Wave Coffee
        </p>
        <p className="text-8xl font-black" style={{ fontFamily: "Lato, sans-serif" }}>404</p>
        <p className="text-[#2C1810]/60 text-lg">This page doesn&apos;t exist.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#5A5A40] underline underline-offset-4"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
