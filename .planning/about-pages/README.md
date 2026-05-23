# About Universe — Content Briefs (v7.0)

These four briefs lock the *content* and *narrative order* for the new About pages. They are read by implementation passes; the JSX should follow them top-to-bottom, section-by-section.

## Audience anchor

The primary buyer is a **40–45 yr old Indian consumer** who:
- Drinks coffee daily, increasingly cares about quality.
- Distrusts marketing speak. Trusts specificity (names, dates, numbers, faces).
- Reads carefully on tablet / desktop, scrolls patiently. Mobile reader is secondary but still important.
- Wants to know **who** is behind the brand, **where** the beans come from, **how** people are treated, **what** the press independently says.

Every section earns its place by answering a question this reader actually has. No filler.

## Universal narrative principle

> **Show people, places, and proof — in that order.**

- **People**: real names, real photos, real quotes. No stock photography for human subjects.
- **Places**: estates, the roastery, the cafés. Geography grounds the story.
- **Proof**: dates, scores, percentages, independent press, third-party recognition.

## Loading discipline (applies to all 4 pages)

The user has flagged that pages must feel like Apple/Linear: **nothing visible until everything is ready**. The implementation rule is:

1. **Preloader gate** — a fullscreen branded transition (asset to be provided) covers the page until:
   - All hero-fold images have `decode()` resolved.
   - Custom fonts (Merriweather, Lato) report `document.fonts.ready`.
   - First two scroll sections' images are at least `fetch`-started.
   - Minimum display time of 800ms so the transition doesn't flash.
2. **After gate lifts**, Lenis is `start()`-ed and the page fades in via a single 400ms opacity transition.
3. **Below-the-fold images** continue using `loading="lazy" decoding="async"` (already applied to bare imgs in our-coffee and newsroom).
4. **`<link rel="preload" as="image">`** in each page's `<head>` for hero + first parallax image so the gate doesn't stall.
5. **Reserve aspect ratios** on every image container (`aspect-[5/3]`, etc.) so CLS = 0 once images swap in.
6. **Defer heavy sections** that are 2+ screens below the fold via `IntersectionObserver` — they mount but their motion effects only register `useScroll` once visible.

The preloader component will live at `src/components/about/AboutPreloader.tsx` and wrap children inside `AboutPageShell`. It exposes a single `ready` state that `<main>` reads to set `opacity-0 → opacity-100`.

## Smooth-scroll guardrails

Already done in the perf audit pass (commit `69f8a1f` + `b28ff04`):
- Raw `useTransform` on scroll-driven values (no double-damping with `useSpring`).
- `GPU_LAYER` + `PAINT_CONTAINED` CSS contracts on every parallax surface.
- Springs only on mouse/pointer input (TiltCard).
- Tier-aware: `usePerfMode()` collapses motion to zero on low-end devices or `prefers-reduced-motion`.
- Bare imgs lazy-loaded with async decode.

For the new sections introduced by these briefs:
- **Any new motion** must follow the same contract — raw transforms for scroll, springs for pointer.
- **Sticky elements** (e.g. timelines, career path ladders) use `position: sticky` with `top-28` (matches the morphing header height), not `IntersectionObserver` re-positioning.
- **Image grids** beyond 3 rows must use `content-visibility: auto` on row containers to skip off-screen paint.
- **Videos** (if added for Newsroom podcast embeds) load as posters first, swap to iframe on click only — no autoplay, no embed-on-mount.

## File map

| Brief                     | Drives page                          |
| ------------------------- | ------------------------------------ |
| `our-story.md`            | `app/about/our-story/page.tsx`       |
| `our-coffee.md`           | `app/about/our-coffee/page.tsx`      |
| `careers.md`              | `app/about/careers/page.tsx`         |
| `newsroom.md`             | `app/about/newsroom/page.tsx`        |

Each brief is structured as: **Intent → Sections (in order) → Image manifest → Open content questions**.

Sections marked **[NEW]** are not yet in the current v7.0 build and must be added. Sections marked **[KEEP]** already exist and need only copy review.
