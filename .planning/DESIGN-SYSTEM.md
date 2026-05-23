# BrewMatch Design System

## Intent

BrewMatch should feel young, modern, and quietly premium without looking like a generic luxury cafe site. The brand base stays warm and tactile: cream paper, deep coffee ink, olive, stone, and brown. The expanded palette uses soft pastel pink, green, and orange so pages feel warmer and more expressive without becoming loud or tricolor-coded.

The visual rule is simple: cream is the canvas, coffee ink is the structure, olive is the brand memory, and accent colors are used as punctuation.

## Audience Lens

The primary audience is urban Indian customers and applicants aged 20 to 40. They are visually literate, mobile-first, impatient with fake premium language, and quick to judge polish. They need the page to feel direct, credible, and screenshot-worthy, not old-fashioned or over-explained.

## Core Tokens

Defined in `src/index.css` under Tailwind v4 `@theme`.

| Token | Hex | Role |
| --- | --- | --- |
| `natural-bg` | `#F5F2ED` | Main cream canvas |
| `natural-paper` | `#FAF9F6` | Elevated paper panels and cards |
| `natural-muted` | `#EBE7E0` | Quiet fills, inactive surfaces |
| `natural-stone` | `#D9D1C7` | Dividers, scrollbars, low-contrast structure |
| `natural-text` | `#2C1810` | Primary coffee-brown text |
| `natural-accent` | `#5A5A40` | Olive brand anchor |
| `natural-ink` | `#1F1814` | Dark editorial bands and deep overlays |

## Accent Tokens

These accents extend the existing cream, olive, and brown system. They should never dominate a page. Use them for eyebrows, counters, active filters, borders, light tinted bands, and small calls to action. Keep them pastel and dusty; avoid saturated saffron-plus-green combinations because they immediately read like the India flag.

| Token | Hex | Mood | Best Use |
| --- | --- | --- | --- |
| `natural-pink` | `#D98FA1` | Young, warm, hospitable | Careers, people, service, community |
| `natural-pink-soft` | `#F4D7DE` | Blush paper tint | Section bands and panels |
| `natural-green` | `#93B88E` | Fresh, farm-led, calm | Coffee, sourcing, sustainability |
| `natural-green-soft` | `#DDEBD5` | Matcha-pale tint | Section bands and panels |
| `natural-orange` | `#E3A46B` | Roasted, sunny, human | Our Story, timelines, provenance |
| `natural-orange-soft` | `#F5DEC8` | Apricot paper tint | Section bands and panels |

## About Page Tones

Each About page owns a scoped accent through `data-active-about` on `AboutPageShell`:

| Page | Accent | Why |
| --- | --- | --- |
| Our Story | Pastel orange | Founder warmth, roast color, timeline energy |
| Our Coffee | Pastel green | Origin, farm relationships, freshness |
| Careers | Pastel pink | Young professional warmth without startup neon |
| Newsroom | Pink-orange blend | Editorial warmth without a hard press-room feel |

The implementation exposes scoped CSS variables:

| Variable | Purpose |
| --- | --- |
| `--about-accent` | Main page accent |
| `--about-accent-ink` | Dark variant for deep contrast if needed |
| `--about-tint` | Soft full-width section tint |
| `--about-tint-strong` | Stronger card/panel tint |

Shared utilities:

| Utility | Purpose |
| --- | --- |
| `text-about-accent` | Explicit accent text |
| `bg-about-tint` | Full-width section band |
| `bg-about-tint-strong` | Stronger tinted block |
| `border-about-accent` | Accent-aware border |
| `shadow-about-soft` | Soft colored depth |
| `about-page-panel` | Page-toned card/panel surface |
| `about-page-tone` | Page-toned large surface |

## Color Usage Rules

1. Do not use gradients for page transitions, large section backgrounds, or decorative accents.
2. Use solid fills, transparent overlays, paper texture, borders, and spacing for depth.
3. One page should have one dominant accent. Secondary accents are allowed only in tiny UI details.
4. Keep body copy on `natural-text`; do not color long paragraphs.
5. Use accent colors for structure: eyebrows, numbers, active filters, borders, timeline markers, and small CTAs.
6. If an accent appears in a section heading, repeat it once in that section as a border, stat, or active state so it feels intentional.
7. Dark bands should use `natural-text` or `natural-ink`, with cream text. They are editorial pauses, not decoration.
8. Do not place saturated orange beside saturated green. When orange and green both appear in a global moment, include pastel pink and cream so the read stays brand-led, not flag-led.

## Page Transitions

The site uses a global `PageTransition` wrapper in `app/layout.tsx`. It applies to the entire website.

The transition is built from four solid horizontal panels that sweep across the viewport in alternating directions:

- `natural-pink-soft`
- `natural-green-soft`
- `natural-orange-soft`
- `natural-paper`

The content itself fades, lifts, and sharpens from a slight blur. This keeps the transition fluid and cinematic without gradients, blobs, or heavy effects.

Reduced-motion users skip the transition entirely.

## Motion Rules

1. Route transitions should feel like pages being turned, not like a loading screen.
2. Use short durations: 0.3 to 0.9 seconds depending on the element.
3. Use the existing ease curve `[0.22, 1, 0.36, 1]` for premium motion.
4. Scroll animation must stay compatible with Lenis. Do not add springs to scroll-driven transforms.
5. All page motion must respect reduced motion and low-performance tiers.

## About Page Application

The four recent About pages now use the accent system as follows:

- Our Story uses pastel orange for founder cards, estate tiles, values, timeline markers, and soft section tinting.
- Our Coffee uses pastel green for process cards, origin borders, roast cards, brew recipes, tasting notes, and shop range context.
- Careers uses pastel pink for job cards, photo-wall framing, growth paths, benefits, hiring process, and applicant CTAs.
- Newsroom uses a pink-orange blend for featured press, press cards, awards, media appearances, speaking rows, press kit, and fact sheet surfaces.

## UI Texture

Texture should be tactile but quiet:

- Prefer paper panels over glossy glass on editorial pages.
- Use borders with `natural-border` or `border-about-accent` for hierarchy.
- Use `shadow-about-soft` sparingly for cards that need lift.
- Rounded corners should stay at `rounded-xl` or below unless a component already owns a different radius.

## Accessibility

1. Never rely on color alone. Pair accent color with placement, spacing, border, active fill, or label text.
2. Keep accent text short and high contrast.
3. Do not put long body copy on tinted backgrounds unless contrast has been checked.
4. Keep mobile tap targets at least 44px high.
5. Reduced-motion behavior is required for route transitions and animated sections.

## Future Extensions

Use pastel orange for seasonal product drops, pastel pink for gifting/support/hospitality moments, and pastel green for sustainability or freshness. Do not introduce more accent colors until one of these pastel families has a clear repeated role.