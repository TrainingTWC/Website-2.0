# /about/newsroom — Content Brief

## Intent

Give a 20–40 year old reader — plus the occasional journalist, investor, or curious operator — a **single credible page that proves we're for real**, without sounding like an investor deck. This is the page that pops up when someone searches a founder's name or an outlet name, and it has to convert curiosity into trust in under 30 seconds of scroll.

The reader should leave with:
1. A clear sense that **the press independently rates us** — multiple outlets, named, dated, linkable.
2. Recognition that we've been **picked by the people whose taste they trust** (Forbes 30u30, CNT, SCA, etc.).
3. The **founders' on-record voice** in long form — podcasts, talks, interviews. This is how young readers vet a brand now.
4. Easy, no-friction access to **assets and a direct contact** if they want to write about us.
5. A clean **fact sheet** they can quote without re-asking us.

This is the most rigorously factual of the 4 pages. Every claim must be verifiable, every link must work, every name must be correct. **No vibes-based marketing here — just receipts, in chronological order, with a quiet design that lets the work speak.**

---

## Sections, in order

### 1. Hero **[KEEP]**
- **Eyebrow**: "Newsroom"
- **Title**: "In the news, in our own words."
- **Tagline**: A confident one-liner; current is good.
- **Image**: A wide shot of a newspaper/magazine spread featuring BrewMatch — physical print artifact, not a screenshot.
- **Component**: `ParallaxHero`.

### 2. Featured Right Now **[NEW]**
The single biggest piece of coverage in the past 90 days deserves a hero treatment, NOT a card in the grid.

- **Format**: Full-width editorial block — large image left (or full-bleed background), pull quote + outlet + date overlaid right. CTA to read the full piece.
- **Content example**:
  - Outlet: Economic Times
  - Date: Aug 2025
  - Headline: "The quiet revolution in India's specialty coffee scene"
  - Pull quote (35 words max from the piece itself, with attribution)
  - Link: external — full piece on the outlet's site
- **Component**: New `FeaturedPress` block — single, prominent, parallax-light.

### 3. The Press Wall **[REFINE existing grid]**
The current grid (6 press cards) is good structurally. Refine with:

- **Filter pills above the grid** — All / Feature / Interview / Award / Industry. Already a category field on PressItem; wire it up.
- **Sort**: chronological descending (latest first).
- **Per card additions**:
  - Add **read time** ("~7 min read") — small, in the footer area of the card.
  - Make **outlet name** visually weightier than headline (outlet is the credibility signal; headline is the hook).
- **CTA on each card**: "Read on [outlet name] →" — always opens external in new tab, `rel="noopener noreferrer"`.
- **Add a footer to the grid**: "View all 120+ mentions in our press archive" → links to a paginated archive page (future scope; placeholder for now).
- **Component**: Refine current grid + add filter row above.

### 4. Awards & Recognition **[NEW]**
Separate from press. Awards are different — they are juried, not editorial.

- **Format**: A 4-6 tile grid; each tile is small, formal, restrained — like a row of trophies in a glass case, not a marketing splash.
- **Per award**:
  - Awarding body (logo if licensed; else typeset name)
  - Year(s) received
  - Category (e.g. "Forbes 30 Under 30, F&B")
  - 1-line citation if available
- **Suggested awards** (need verification):
  - Forbes India 30 Under 30, F&B — 2023, 2024, 2025
  - Conde Nast Traveller — Top 12 Cafés in India — 3 locations
  - Specialty Coffee Association of India — Best Roaster — 2024
  - India Coffee Awards — Sustainable Sourcing — 2023
  - Mint Lounge — Best of 2025
  - LinkedIn Top Startups India — 2024
- **Component**: New `AwardsGrid` — non-tilting, restrained type-led tiles.

### 5. Founders in Conversation **[NEW]**
Podcast, conference, and YouTube appearances. The founders' on-record voice in long form. **This is how young readers actually vet a brand now** — they go listen to a 90-minute interview before they decide if they trust you.

- **Format**: A 3-up grid of "Listen / Watch" tiles. Each tile:
  - Thumbnail (16:9, with play-icon overlay — not auto-playing)
  - Show / event name (visually weighted — it's the credibility signal)
  - Episode title
  - Duration + date
  - "Watch →" or "Listen →" external link (opens in new tab)
- **Suggested entries (need verification)**:
  - The Seen and the Unseen podcast — "The economics of specialty coffee in India" (~3 hrs)
  - India Coffee Forum 2024 keynote — "What 14 estates taught us about pricing" (~45 min)
  - The Ken's "Daybreak" — interview on Series B (~25 min)
  - Pick a Spotify/YouTube creator interview if one exists — reaches the youngest segment of the audience.
- **Component**: New `MediaAppearances` grid. NO embed-on-mount — only load the iframe when the user clicks, to keep TTI fast.
- **Mobile rule**: thumbnails should still be tappable and link to the platform's native app (Spotify, YouTube, Apple Podcasts) where possible — most young readers will continue listening on their phone, not on our site.

### 6. Speaking Engagements **[NEW]**
A small "where we'll be next" calendar — even just 2-3 upcoming entries — signals an active, externally-engaged brand.

- **Format**: Compact 3-row list, no images. Each row:
  - Event name + city
  - Date
  - Speaker (founder name)
  - Topic
- **Component**: Plain list, RevealOnScroll. If no upcoming events, hide the section (don't show "no events").

### 7. By the Numbers (StatStrip) **[KEEP]**
Already wired. Eyebrow + caption added in `b28ff04`.

### 8. Press Kit — Brand Assets **[REFINE existing PinnedTextBlock]**
Currently a narrative PinnedTextBlock. Convert to an actually-useful download grid.

- **Format**: A 4-up grid of asset bundles, each with a real download link.
  - **Logo Pack** — SVG + PNG, light + dark, with safe-zone guides (.zip, ~2MB)
  - **Brand Guidelines** — 32-page PDF with type, colour, voice (.pdf, ~8MB)
  - **Founder Bios + Headshots** — short + long bio per founder, hi-res portraits (.zip, ~30MB)
  - **Roastery & Café Photography** — 50+ approved editorial photos (.zip, ~200MB; provide CDN link)
- **Per tile**: icon + name + file size + download CTA.
- **Below grid**: Usage notes — "Released for editorial use under attribution. Please credit photography appropriately."
- **Component**: New `PressKitGrid` — TiltCard with intensity 3 (subtle).

### 9. Fact Sheet **[NEW]**
A one-page "all the verified facts about BrewMatch" — useful for any journalist or analyst.

- **Format**: A two-column key-value table.
  - Founded: 2016, Bengaluru
  - Founders: [names + roles]
  - Headquarters: Bengaluru
  - Roastery: Bengaluru (+ Mumbai under construction, 2026)
  - Cafés: 130+, 18 cities
  - Team size: 450+
  - Partner estates: 14
  - Funding raised to date: ₹165cr (Seed + A + B)
  - Latest round: Series B, ₹120cr, Jan 2025
  - Lead investors: [names]
  - Annual revenue (FY 2024-25): [public if available, else omit]
  - Press contact: press@brewmatch.in
- **Component**: Definition list (`<dl>`) styled with serif keys and monospace values for a "wire-service" feel.
- **Note**: Only publish numbers we are willing to stand behind publicly. Omit any line we'd hedge on.

### 10. Press Contact CTA **[KEEP, sharpen]**
Currently solid. Add:
- **Response SLA prominently**: "We respond to every press email within 2 working days."
- **Named contact**: "Write to Ayushi (co-founder, press) directly at press@brewmatch.in"
- **What to include in your email**: One-line note suggesting "outlet, deadline, topic, and what you'd like from us" — helps both sides.

### 11. Soft Footer Cross-link **[NEW]**
At the very bottom, a small "If you're a buyer, not a journalist — start here →" linking to /about/our-coffee. Useful because newsroom traffic often spills over from organic search hits on awards or founder names.

---

## Image manifest

| # | Section | Description | Aspect |
|---|---------|-------------|--------|
| 1 | Hero | Magazine spread artifact, physical print | 16:9 |
| 2 | Featured Press | Outlet's article hero image (with permission) | 16:9 |
| 3–8 | Press Wall | 6 existing thumbnails | 5:3 |
| 9–14 | Awards | 6 award body logos (SVG, licensed) | 1:1 |
| 15–17 | Media appearances | 3 podcast/talk thumbnails | 16:9 |
| 18 | Press kit | 4 small abstract asset-pack thumbnails | 1:1 |

## Open content questions

1. The actual Featured Press piece — the one we want spotlit.
2. Verified award list with citations + years.
3. Real podcast / talk appearances + links.
4. Upcoming speaking engagements for the calendar section.
5. Fact Sheet: which of the financial / scale claims are public-disclosable.
6. Press kit assets: do these exist as downloadable bundles today, or do we need to create them?

## Smooth-scroll notes specific to this page

- Newsroom is the **least motion-heavy** of the 4 pages by intent — it's a credibility document, not a brand experience. Motion should be restrained.
- The Press Wall already has lazy `loading="lazy" decoding="async"` on bare imgs (commit `69f8a1f`).
- The Awards grid uses logo SVGs — preload only the first row (above the fold).
- Media Appearances: thumbnails should be loaded lazily; YouTube/podcast iframes load ONLY on click. This is the single biggest perf hazard if implemented wrong.
- The Fact Sheet is pure text — no perf concerns, no motion needed.
- Preloader manifest should include only the Hero image + the Featured Press image (the two big visual moments above the fold).
