# /about/our-coffee — Content Brief

## Intent

Educate the buyer enough that they can **make a confident purchase decision** AND **brew the coffee well at home**. This page is the antidote to the buyer's biggest fear: "I'll spend ₹800 on a bag and not know what to do with it."

The reader should leave knowing:
1. **Why** our coffee tastes the way it does (terroir + roast craft + freshness).
2. **Where** the beans come from (5 Indian growing regions, named).
3. **How** to brew them at home (4 methods, exact recipes).
4. **How fresh** they are when they arrive (the 48-hr roast-to-dispatch promise).
5. **What** a good cup should taste like and how to identify it.

This page should reduce returns and increase repeat purchases — by demystifying coffee, not romanticising it.

---

## Sections, in order

### 1. Hero **[KEEP]**
- **Eyebrow**: "Our Coffee"
- **Title**: "Single-origin, single-minded."
- **Tagline**: Currently strong; keep.
- **Image**: Hands cupping a brewing chemex / V60 close-up.
- **Component**: `ParallaxHero`.

### 2. From Seed to Cup — the Overview **[NEW]**
A 5-step horizontal walkthrough. Sets context for everything below.

- **Format**: 5 numbered cards in a row (1 col mobile, 5 col desktop), each with an icon + one-line title + 2-sentence description.
- **Steps**:
  1. **Sourcing** — direct relationships with 14 Indian estates
  2. **Harvest** — selective hand-picking, only ripe cherries
  3. **Processing** — washed / natural / honey, per lot decision
  4. **Roasting** — small batches, Probat machine, profiled per origin
  5. **Dispatch** — 48 hours from roast to your address
- **Component**: New `ProcessRow` primitive (no parallax — instructional content should be still and scannable).

### 3. The Five Regions We Source From **[REFINE — currently 4 origins shown]**
Currently shows 4 origins. Should be **5** to align with the real Indian specialty regions. Each origin deserves its own deep dive, not a single TiltCard.

- **Format**: Each region gets a full-width "origin profile" block:
  - Left: a large image of the region landscape (3:2)
  - Right: name, elevation, primary varietals, harvest months, flavor profile in plain English, partner estates count.
- **5 regions**:
  1. **Chikmagalur** (Karnataka) — the historic seat of Indian coffee, 1,000-1,500m, Arabica-heavy, citrus + chocolate.
  2. **Coorg / Kodagu** (Karnataka) — Robusta + Arabica, 900-1,200m, deep body + spice notes.
  3. **Wayanad** (Kerala) — Robusta-dominant, shade-grown, 700-1,000m, full-bodied with nut notes.
  4. **Araku Valley** (Andhra Pradesh / Odisha) — tribal cooperative model, 900-1,100m, bright + floral.
  5. **Bababudangiri** (Karnataka) — the legendary origin (Baba Budan's beans), high-elevation 1,500m+, wine-like.
- **Component**: Reuse `PinnedTextBlock` (text + sticky) per region OR build a new `OriginProfile` that's lighter. **Decision**: reuse PinnedTextBlock with 1 sideImage to keep components small.
- **Drop the existing TiltCard origin grid** — it's too shallow.

### 4. The Roastery **[NEW]**
A standalone section about the craft of roasting. The buyer never sees this; we bring them in.

- **Format**: 60/40 split — left is a `PinnedTextBlock`-style text column, right is a tall image of the Probat machine mid-roast.
- **Content**:
  - Para 1: We use a 1965 Probat UG-22, restored. Why we chose it (consistency over capacity).
  - Para 2: Our head roaster's name + tenure + cupping certifications. One quote from them.
  - Para 3: Roast profiles are per-origin, not generic. Light for Araku, medium for Chikmagalur, etc.
- **Open**: Need head roaster's name. Newsroom hints at one — verify.

### 5. Cupping & Quality Control **[NEW]**
The most rigorous, technical section. Honest about what we reject.

- **Format**: A two-column callout block.
  - Left: text about the SCA scoring scale (80+ is specialty), our weekly cupping protocol, sensory dimensions evaluated (aroma, acidity, body, sweetness, balance, aftertaste, defects).
  - Right: a numbered list of **what we've actually rejected** in the last 12 months — e.g.
    - "Estate X — 2024 monsoon lot, defects above 3%"
    - "Lot 247 — over-fermented, ester notes"
    - "Estate Y — re-evaluated after partner change in 2023"
- **Purpose**: Specificity = credibility. Most coffee brands say "we cup every lot." We *prove* it.

### 6. Roast Levels Explained **[NEW]**
The single most confused topic for new buyers. Demystify in 3 cards.

- **Format**: 3-up grid, each card has:
  - Roast level (Light / Medium / Dark)
  - Visual: actual photographed bean of that roast
  - 2-sentence description
  - "Best for" recommendation (e.g. light → pour-over, dark → espresso)
- **Component**: TiltCard with intensity 4. Real bean photography is non-negotiable.

### 7. Brew Methods — Recipes You Can Actually Use **[REFINE]**
Currently shows 4 brew method TiltCards with no recipe content. Each should be a detailed mini-recipe.

- **Format**: 4 expandable cards (or just always-open on desktop). Each card has:
  - Method name + small icon
  - Gear required (with affordable + premium options for India market)
  - Coffee-to-water ratio (e.g. 1:16)
  - Grind size (visual reference — "table salt", "sea salt", "coarse sand")
  - Water temperature
  - Total brew time
  - Step-by-step in 5-7 bullets
- **4 methods**:
  1. **French Press** — 1:15, coarse grind, 4 min steep, gentle plunge
  2. **Pour-Over (V60 / Hario)** — 1:16, medium-fine, 3-minute bloom + pour cycle
  3. **AeroPress** — 1:14, fine grind, 30s steep, inverted method
  4. **Moka Pot** — 1:7, fine grind, low heat, listen for the sputter
- **Component**: New `BrewRecipeCard` — slightly taller card, more text-dense than current TiltCard.

### 8. The Freshness Promise **[NEW]**
Reinforce the 48-hour stat with an actual visual.

- **Format**: A small interactive chart / timeline graphic:
  - Day 0: Roasted in Bengaluru
  - Day 1: Quality checked, packed, dispatched
  - Day 2-5: In transit (3-day Bengaluru → Delhi/Mumbai average)
  - Week 1-6: Peak flavor window
  - Week 6+: Still drinkable but degrading; we recommend finishing within 4 weeks of opening
- **Component**: `FreshnessTimeline` — pure SVG, no images required, no animation.
- **Pull quote**: "We refuse to sell coffee older than the day it's named after."

### 9. Tasting Notes Decoded **[NEW]**
A small section that demystifies "notes of bergamot and dark chocolate" — most buyers feel intimidated by these.

- **Format**: A 6-tile grid of common tasting note categories with an everyday-Indian-pantry analog.
  - "Citrus → Coorg orange peel"
  - "Stone fruit → ripe alphonso"
  - "Chocolate → 70% dark Amul Tribute"
  - "Floral → jasmine garland morning"
  - "Nutty → roasted cashew"
  - "Spice → cardamom pod"
- **Component**: Simple grid, no tilt, no parallax. Educational tone.

### 10. By the Numbers (StatStrip) **[KEEP]**
Already wired with eyebrow + caption.

### 11. Sustainability Without the Greenwash **[NEW]**
Quick honest section — what we do, what we don't (yet).

- **Format**: A 2-column block, "What we do" on left, "What we're working on" on right. Three bullets each. Honest about gaps.
- **Examples**:
  - Do: Compostable bag inner liner. Returnable jute outer. Estate-direct cuts middlemen + transport.
  - Working on: Carbon-neutral shipping (target 2027). Reducing roastery water usage 30%.

### 12. Shop the Range CTA **[NEW]**
Closing CTA that drops the reader into commerce.

- **Format**: 4 product tiles (the hero blends), each linking to /products/[slug]. Single line of intent: "Now that you know how we make it — try a bag."
- **Component**: Reuse existing product card component from HomeContent if exportable; otherwise simple `<a>` tile grid.

---

## Image manifest

| # | Section | Description | Aspect |
|---|---------|-------------|--------|
| 1 | Hero | Hands brewing Chemex / V60, top-down | 16:9 |
| 2 | From Seed to Cup | 5 small icons (line-art, not photos) | — |
| 3–7 | Origins | One landscape photo per region (5 total) | 3:2 |
| 8 | Roastery | Probat UG-22 mid-roast, tall portrait | 3:4 |
| 9–11 | Roast levels | Light / Medium / Dark bean macro photos | 1:1 |
| 12–15 | Brew methods | One icon per method (V60, French press, AeroPress, moka) | 1:1 |
| 16 | Freshness | SVG-only — no raster | — |
| 17 | Tasting notes | Optional small icons per analog | 1:1 |
| 18–21 | Shop CTA | Existing product imagery | 1:1 |

## Open content questions

1. Head roaster's name + tenure + certifications.
2. Real rejected-lot examples (we can draft plausible ones; user confirms).
3. Final list of 5 (not 4) regions — confirm Bababudangiri is in.
4. Confirm 4 hero blends to feature in the closing CTA.
5. Confirm sustainability claims are factually true before publishing.

## Smooth-scroll notes specific to this page

- This page is the most **image-dense** of the 4. The five origin profiles + roast level macros + brew method icons + product CTA tiles add up to ~25 images.
- Preloader manifest should include ONLY the hero + first origin profile image. The rest lazy-load.
- Roast level macros are small (1:1, ~400px) — preload these because they appear together in a tight grid and pop-in is jarring.
- Brew recipe cards should NOT use TiltCard — when a user is reading dense instructions, motion under the cursor is distracting. Use plain divs with `RevealOnScroll`.
- The freshness timeline is SVG; no perf concerns, but should still respect `prefers-reduced-motion` and stay static.
- The shop CTA tiles can reuse the home page's product card if it's tree-shakeable. Otherwise inline a simple version to avoid pulling in the full home bundle.
