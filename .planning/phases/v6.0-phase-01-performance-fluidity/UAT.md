# Phase v6.0-01 — Manual UAT Checklist (Plan 06)

> Run after the dev/static build of master at or after commit `3730f24`.
> All checks below should be performed manually; record pass/fail beside each.

## Pre-flight

- [ ] `npm run build` succeeds (✓ verified after every plan).
- [ ] `npm run dev` (or `npx serve out/`) loads `/`, `/shop`, `/journal`, `/products/<slug>`, `/checkout`, `/orders`, `/admin` without runtime errors.
- [ ] DevTools Console — zero red errors on each route.

## 1. Adaptive perf tier (Plan 01)

- [ ] On a normal desktop, `usePerfMode()` reports `tier: "high"` (verify via `WebVitalsBootstrap` payloads in Convex `webVitals` table or temporary `console.log`).
- [ ] In Chrome DevTools → Rendering, set "CPU: 6× slowdown" + Network: "Slow 4G", reload — tier should classify as `mid` (60-frame rAF sample) within 2 s of mount.
- [ ] In Chrome → Performance → "Hardware concurrency: 2" (or in DevTools console: `navigator.hardwareConcurrency`), reload — tier should classify as `low`.
- [ ] System reduced-motion ON (OS-level) → `usePerfMode().reducedMotion === true`, regardless of tier.

## 2. Web vitals telemetry

- [ ] Open `/` → after a few seconds, in Convex dashboard, the `webVitals` table receives `FCP`, `LCP`, `INP` (after interaction), `CLS`, `TTFB` rows tagged with the active tier.
- [ ] No duplicate subscriptions: refresh and confirm one row per metric per page-load.

## 3. SmoothScroll + Lenis (Plan 02)

- [ ] On `tier === "high"`, `<html>` has `class="lenis lenis-smooth"` and scrolling feels lerp-smoothed; `lerp ≈ 0.08`, `syncTouch: true`.
- [ ] On `tier === "mid"`, Lenis still active but `lerp: 0.10`, `syncTouch: false` (mobile-like touch passthrough).
- [ ] On `tier === "low"` **or** reduced-motion, `<html>` has **no** `.lenis*` classes and scroll is the browser default.
- [ ] No `dispatchEvent(new Event("scroll"))` ever fires from `SmoothScroll` (verified in source: `Select-String dispatchEvent` → 0).
- [ ] Scrolling on home does not trigger jank or frozen frames in DevTools Performance trace.

## 4. Cinematic single-useScroll (Plan 03)

- [ ] On `/` Cinematic section, scrolling through all chapters: only **one** `useScroll` subscription per deck (search source: 3 total = hero, curtain, deck).
- [ ] Off-screen chapters (>1 viewport away) have `will-change: auto` (DevTools → Layers / Computed); the active chapter has `will-change: transform`.
- [ ] On `tier === "low"` or reduced-motion, chapters render statically (no parallax, opacity 1, transform none, MacroBeam absent).

## 5. LazyMotion + preconnect + SmartImage (Plan 05)

- [ ] DevTools → Network → first paint requests include `preconnect` + `dns-prefetch` to `different-bulldog-772.convex.cloud`.
- [ ] No `framer-motion` full bundle requested on first paint (LazyMotion + `domAnimation` only).
- [ ] All `<SmartImage>` instances render with a `sizes` attribute (default `(max-width: 768px) 100vw, 50vw`).
- [ ] Home `/` First Load JS reported by `next build` ≈ 105 kB (no regression).

## 6. Heavy-component tier gating (Plan 04)

- [ ] **`/products/<South-Indian-or-El-Diablo-slug>`** on `tier === "high"`: 3D model loads, drag-rotate works, Canvas `dpr=[1, 2]`.
- [ ] Same page, simulate `low` tier (DevTools CPU 6× + 2 cores): the static `<SmartImage>` stays; 3D Canvas is **never** mounted; `model3DReady` resolves on the next tick so no "loading" flicker.
- [ ] Same page, simulate `mid`: 3D mounts but Canvas `dpr=[1, 1]` (verify via React-DevTools props).
- [ ] **MagneticCursor**: on touch device or pointer:coarse media → never mounts. On desktop with mouse + `tier === "high"` only → mounts. On `mid`/`low` → never mounts.
- [ ] **GalaxySweep** (via `GalaxySweepLazy`): `high` → full bloom + glitters; `mid` → single 600 ms CSS pulse; `low` or reduced-motion → no DOM, `onComplete` fires immediately on click.
- [ ] **BestsellerCarousel3D** consumer (none today, but verify dynamic import boundary): low-tier code path imports `BestsellerCarouselFlat` only — Three.js chunks NOT in the network panel.

## 7. End-to-end flows

- [ ] Home → product detail → add to cart → cart panel → checkout → order placement (no console errors at any step).
- [ ] Journal list → article detail loads, scrolls smoothly.
- [ ] Admin login → dashboard renders.

## 8. Performance metrics (run on production build, throttled mobile)

- [ ] Lighthouse Mobile (Moto G Power emulation) Performance ≥ **90**.
- [ ] Lighthouse Desktop Performance ≥ **95**.
- [ ] Scrolling FPS on home ≥ **55** (DevTools Performance trace, 5 s scroll).
- [ ] INP across primary interactions (cart, hero CTAs) < **200 ms**.

## 9. Regression sweep

- [ ] No new visual regressions vs. previous master (compare home / shop / product hero side-by-side).
- [ ] Reduced-motion path renders the entire site without breaking layout.
- [ ] No new TypeScript errors (`npm run build` clean).

---

## Sign-off

| Reviewer | Date | Pass / Fail | Notes |
| --- | --- | --- | --- |
|  |  |  |  |

When all items pass, mark this phase complete in `.planning/STATE.md` and `.planning/ROADMAP.md`.
