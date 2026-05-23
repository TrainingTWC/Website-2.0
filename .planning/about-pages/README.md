# About Universe — Content Briefs (v7.0)

These four briefs lock the *content* and *narrative order* for the new About pages. They are read by implementation passes; the JSX should follow them top-to-bottom, section-by-section.

## Audience anchor

The primary audience is a **20–40 year old urban Indian** — the 95% of our buyers, hires, and casual readers. They are:

- **Digital natives.** They scroll on phones first, in transit, between meetings, in queues. Desktop is the secondary surface, not the primary one.
- **Taste-curious, not coffee-snobby.** They want to drink better coffee without being talked down to. They Google "V60 vs French press" without embarrassment.
- **Bullshit-allergic.** They can spot a stock photo, a humblebrag, or a recycled brand-voice template in 0.4 seconds. They share what feels real, mute what feels manufactured.
- **Aesthetic-aware.** They know what good design looks like — they follow it on Instagram, Substack, Pinterest. The page itself has to feel like something they'd screenshot.
- **Value-driven.** Ethics, transparency, fair pay, sustainability — these aren't soft preferences. They are filters before purchase.
- **Time-poor, attention-rich.** If they're reading, they're engaged. But they will bail in 6 seconds if the page reads like a 2015 corporate "About Us".

What they want from this site:
- Know **who** is actually behind the brand (faces, voices, opinions).
- Know **where** the beans come from in real terms (region, estate, farmer).
- Know **how** people are treated (compensation, growth, culture — with receipts).
- Know **what** the world independently says (press, awards, third-party validation).
- Be **respected** as a smart reader, not pitched at.

Every section earns its place by answering a question they actually have. No filler. No grandfather-brand sincerity.

## Voice & tone

- **Confident, never corporate.** Short sentences. Active verbs. Real opinions.
- **Specific, never sweeping.** "We pay 28% above C-market" beats "we believe in fair trade."
- **Self-aware, never thirsty.** We can be funny, but we don't perform fun. We can be proud, but we don't preen.
- **Plain English, no jargon hierarchy.** Use words like *cupping*, *terroir*, *SCA* only when the page also explains them.
- **Direct address.** "You" not "the customer." "We" not "the company."
- **No buzzwords ever:** *curated*, *bespoke*, *passion*, *journey*, *artisanal*, *handcrafted*, *premium experience*, *world-class*, *passionate about coffee*. Banned on sight.

## Universal narrative principle

> **Show people, places, and proof — in that order.**

- **People**: real names, real photos, real quotes. No stock photography for human subjects, ever.
- **Places**: estates, the roastery, the cafés. Geography grounds the story.
- **Proof**: dates, scores, percentages, independent press, third-party recognition.

## Visual & motion direction (young-mindset)

Design references to internalize \u2014 NOT to copy, but to calibrate vibe:
- **Linear, Vercel, Stripe, Arc** \u2014 confident product-grade typography, lots of negative space, motion only where it earns its keep.
- **Aesop, Loftie, Future** \u2014 editorial-minded e-commerce/brand sites with strong typographic restraint.
- **Substack writer pages, Pitchfork features, The Verge long-reads** \u2014 the article-feel for our long-form sections.
- **NOT**: legacy big-coffee corporate sites (Starbucks, Tata), 2018-era \"craft\" template sites, anything with a stock-photo carousel hero.

Specific calibration:
- **Type**: Big serif display + crisp sans body. Hierarchy via size + weight, not color or boxes. Generous line-height (1.5\u20131.7 for body).\n- **Color**: The existing cream/dark-text palette is good. Use the dark contrast band (already shipped) as the editorial pause. Avoid gradients except as 5\u201310% texture.\n- **Imagery**: Photo-led, never illustration-led. Imperfect framing > over-styled.\n- **Motion**: Restrained. Parallax is a seasoning, not the main course. Every motion must survive `prefers-reduced-motion`.\n- **Cursor / hover**: Subtle. No cursor-follow blobs, no magnetic buttons. The audience is over the gimmick phase.\n- **Micro-interactions**: One tasteful detail per page, max. A pull quote that fades in. A timeline year that pins. That's enough.\n\n## Mobile-first non-negotiables

Because this audience reads on phones first:
- Hero copy must work in a 360×640 viewport — no orphaned words, no truncated taglines.
- Tap targets ≥ 44px. No hover-only interactions; every hover state has a tap equivalent.
- Side-by-side image+text blocks collapse to vertical with a clear visual rhythm, not just stacked rectangles.
- All horizontal scrollers (timeline, success stories) snap on mobile with momentum, not free-scroll.
- Font sizes scale fluidly with `clamp()`, not breakpoint-jumps.

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
