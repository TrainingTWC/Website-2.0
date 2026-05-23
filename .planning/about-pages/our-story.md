# /about/our-story — Content Brief

## Intent

Make a 20–40 year old urban Indian reader feel like **BrewMatch is a brand made by people they'd actually hang out with** — not a faceless DTC operation, not a legacy company trying to act young. Specificity earns the read: real names, real dates, real estates, real numbers. We are confident without being corporate, proud without preening.

The reader should leave knowing:
1. **Who** founded it — the actual humans, with opinions and faces, not LinkedIn headshots.
2. **When** and **where** it started, and what was broken about Indian coffee in 2016 that they decided to fix.
3. **How** the supply chain works — plain English, no jargon.
4. **What** the company actually stands for, proven by what we do, not what we say.
5. **Where** we are today and what comes next — stated with confidence, not aspiration.

The page should be screenshot-worthy. Multiple moments where the reader pauses, takes a phone screenshot, sends it to a friend. That's the bar.

---

## Sections, in order

### 1. Hero **[KEEP]**
- **Eyebrow**: "Our Story"
- **Title**: "A small Bengaluru roastery, ten years on."
- **Tagline**: One sentence that does not over-promise. Tone is confident-quiet, not founder-LinkedIn-energetic.
- **Image**: A real photo of the original roastery exterior — ideally golden hour, slightly imperfect framing. The image should feel like a phone photo a co-founder might have taken, not a brand shoot.
- **Component**: `ParallaxHero` (keep as-is).
- **Mobile rule**: title must fit in 2 lines at 360px width — if it doesn't, shorten it.

### 2. The Founding Moment **[KEEP, refine copy]**
- **PinnedTextBlock**, text left, 3 photos right.
- **Eyebrow**: "Bengaluru, 2016"
- **Title**: "How a stale-cup epiphany became a roastery."
- **Paragraphs**:
  1. Set the 2016 scene — India's specialty wave was just starting. Most "good coffee" in shops was 9 months stale.
  2. The founders' own catalyst (cupping in Melbourne / Tokyo, returning, tasting a local brew, the gap was obvious).
  3. The first decision: roast in small batches, ship within a week, publish roast dates. Everything else followed.
- **Side images**: Original roastery, founders at first cupping table, hand-written roast log.

### 3. Meet the Founders **[NEW]**
A two-up grid of large founder portraits with a 200-word bio under each. This is the most asked-for section we are missing.

- **Layout**: Two big cards side-by-side on desktop, stacked on mobile.
- **Per founder**:
  - Portrait (3:4 aspect) — styled but not retouched-to-perfection. Skin texture and crow's feet stay in.
  - Name + role (e.g. "Anjali Iyer, Co-founder & Head of Coffee")
  - Short paragraph: background → why they left it → role today. Written in a conversational register — "I was 27, working in product at a startup that didn't deserve me, and I'd just had the worst flat white of my life in BKC. …"
  - One personal-voice quote (35–50 words). Strong opinion or sharp observation. **Banned**: anything starting with "I'm passionate about…".
- **Component**: New `FoundersGrid` primitive, or compose `RevealOnScroll` + plain divs. No tilt — portraits should feel still and serious, not gimmicky.
- **Optional young-mindset add**: a tiny "now playing / now reading" line under each founder — the song or book they're into right now. Small, italic, refreshed quarterly. Signals real humans behind the bios.
- **Open**: We need actual founder names and bios from the user. Newsroom page already implies "Anjali" (Head of Coffee) and "Ayushi" (PR). Need confirmation + a third if applicable.

### 4. The Timeline **[NEW]**
A horizontal scrolling timeline (or vertical milestone list on mobile) marking the 7–10 inflection points from 2016 → 2026.

- **Format suggestion**: vertical timeline, year on left, milestone + 1-line context + small image on right.
- **Anchor years to seed**:
  - 2016 — First roastery, Bengaluru
  - 2017 — First café opens (Indiranagar)
  - 2018 — Partnership with first estate (Chikmagalur)
  - 2019 — National e-commerce launch
  - 2020 — Survived & adapted during pandemic (specific story)
  - 2021 — Direct partnerships with 8 estates locked in
  - 2022 — 50th café opens
  - 2023 — Coffee School launched (paid 3-week training)
  - 2024 — Reached 100 cafés
  - 2025 — Series B (₹120cr per newsroom page)
  - 2026 — Today: 130+ cafés, 14 estates
- **Component**: New `Timeline` primitive. Sticky-year approach: years pin while content scrolls (uses `position: sticky` + `RevealOnScroll`).
- **Image discipline**: each milestone has one small thumbnail (16:10). Lazy-loaded.

### 5. The Promise (Freshness) **[KEEP]**
- Existing PinnedTextBlock about "Roasted Monday, in your cup by Friday."
- **Copy review**: the current draft is solid. Tighten if it overlaps with Founding Moment.

### 6. Layered Image Columns **[KEEP]**
The visual interlude between text blocks. Keep as-is — gives the eye a rest.

### 7. The Estates We Buy From **[NEW]**
A grid + map of the 14 partner estates. Buyers want to see WHERE their coffee comes from.

- **Section**: A 2-column hybrid — text on left (one paragraph on our sourcing principle: long-term relationships, prices set seasonally not yearly, transparent grading), and on the right a 14-tile grid of estate cards (or a stylized India map with dots).
- **Per estate**: Name, region, elevation, varietals grown, years of partnership.
- **Component**: New `EstatesGrid` — small TiltCards (intensity 4, low) with image + 3 facts.
- **Open**: Need the actual 14 estate names + regions. Placeholder OK for now but flag clearly.

### 8. The Farmer Partnership Principle **[NEW]**
A standalone editorial section explaining the **28% above C-market** stat in human terms. Currently this number appears only in StatStrip — it deserves a section.

- **Format**: A big pull quote in serif, followed by 2 paragraphs and one full-bleed photograph of a farmer (real name + estate caption).
- **Pull quote**: "We pay 28% above the C-market price. Not as charity. As the actual cost of the coffee we want to drink."
- **Paragraphs**: Why the C-market mechanism leaves growers vulnerable, what fair pricing looks like in practice, what it costs us per kg.
- **Photo discipline**: real farmer, name + estate in caption. No stock photography here under any circumstance.

### 9. Values We Don't Compromise On **[NEW]**
A 3 or 4-up grid of specific (not platitudinous) values, each with a concrete example.

- **Format**: TiltCards, intensity 5, with an icon + 50-word concrete example each.
- **Suggested values** (specific, not generic):
  - "We publish roast dates, not best-before stamps." (every bag, every café)
  - "We never blend single-origin lots after the fact." (lot integrity)
  - "We refuse beans below SCA 80." (3 estates cut in 2024 alone)
  - "Same health cover, barista to executive." (one company, one plan)
- These are sharp, falsifiable claims. Vague values ("we care", "passion") are banned.

### 10. By the Numbers (StatStrip) **[KEEP]**
Already redesigned as full-width contrast band in `b28ff04`. Eyebrow + caption already added.

### 11. Where We Are Today + What's Next **[NEW]**
A closing PinnedTextBlock that orients the reader to current scale (130+ cafés, 14 estates, X cities) and signals the next milestone (second roastery, international shipping, etc.) without over-promising.

- **Component**: `PinnedTextBlock` with `reverse`.
- **Tone**: Confident but humble. No "world domination" energy.

### 12. Founder Sign-off **[NEW]**
A handwritten-style note signed by the founders, on a textured cream card. 80 words max.

- **Component**: A simple `RevealOnScroll`-wrapped quote card with a real signature SVG (or scanned).
- **Purpose**: Closes the page on a personal note, mirrors how the page opened (with founders).

### 13. Soft CTA **[NEW]**
Not a hard sell. Two quiet links:
- "Read about our coffee →" → /about/our-coffee
- "Visit the roastery" → external maps link or contact form

---

## Image manifest (need from user or AI-generated)

| # | Section | Description | Aspect |
|---|---------|-------------|--------|
| 1 | Hero | Original roastery exterior, golden hour | 16:9 |
| 2 | Founding Moment (side) | Founders at first cupping table | 4:5 |
| 3 | Founding Moment (side) | Hand-written roast log close-up | 1:1 |
| 4 | Founding Moment (side) | First-day roastery interior | 5:4 |
| 5 | Founders | Anjali portrait | 3:4 |
| 6 | Founders | Co-founder portrait | 3:4 |
| 7–17 | Timeline | One thumbnail per milestone year | 16:10 |
| 18 | Layered Columns | Coffee cherries | 4:5 |
| 19 | Layered Columns | Café floor wide shot | 4:5 |
| 20–33 | Estates | 14 estate photos | 16:10 |
| 34 | Farmer section | Full-bleed farmer portrait | 21:9 |
| 35 | Sign-off | Subtle background texture | — |

## Open content questions

1. Names + bios of all founders.
2. The actual 14 partner estate names + regions.
3. Real farmer name and estate for the farmer-partnership photo.
4. The handwritten sign-off text (founder-voiced).
5. Year-by-year milestone facts (we can draft a v1; user verifies).

## Smooth-scroll notes specific to this page

- The timeline is the most scroll-heavy new section. Use `position: sticky` for years (not scroll-driven Y transforms — sticky is GPU-cheap and exact).
- Founder portraits should NOT have parallax. Stillness is editorial here.
- Estates grid: 14 items means 14 image decodes. Lazy + async + reserve aspect ratio is mandatory. Consider `content-visibility: auto` on rows beyond the first 4.
- Farmer section's full-bleed image must be in the preloader manifest (it's a hero moment, not a lazy slot).
