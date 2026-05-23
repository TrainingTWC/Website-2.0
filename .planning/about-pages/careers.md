# /about/careers — Content Brief

## Intent

Convince a smart, ambitious candidate (barista, roaster, designer, engineer, manager) that **BrewMatch is one of the best places to build a career in Indian coffee**. The reader's first question is "what's open?" — answer that immediately. Then earn the rest of their attention.

The user explicitly directed: "**we should firstly show the available roles, how the cafe team is happy, people who are success stories for the brand etc.**" — this brief follows that ordering exactly.

The reader should leave knowing:
1. **What roles are open**, in their team and city.
2. **What it actually feels like** to work here (faces, names, days-in-the-life).
3. **That people grow here** — concrete success stories.
4. **How they'll be trained** (the Coffee School).
5. **What benefits look like** in real terms, not buzzwords.
6. **How to apply** and what to expect from the process.

---

## Sections, in order

### 1. Hero **[KEEP, sharpen copy]**
- **Eyebrow**: "Careers"
- **Title**: "Hospitality, not customer service."
- **Tagline**: A short statement of difference. Currently okay; can refine.
- **Image**: A barista mid-pour, focused, not smiling at the camera. Authenticity beats stock cheer.
- **Component**: `ParallaxHero`.

### 2. Open Roles **[MOVED TO TOP — was in middle]**
**The single most important section.** Currently buried after two PinnedTextBlocks. Move it up — let people find what they're looking for first.

- **Format**: A filterable grid (already exists in current page) with team + city filters.
- **Per role card**:
  - Role title + level
  - Team + location
  - Salary band (TRANSPARENT — most Indian coffee/F&B companies hide this; we don't)
  - Years of experience expected
  - "Apply →" CTA → opens modal or links to /careers/[slug]
- **Improvement to current grid**:
  - Add **salary band** column (e.g. "₹4-6L LPA", "₹18-25L LPA"). This is a credibility move; transparency builds trust.
  - Add **"Posted X days ago"** to signal freshness.
  - Add a top-line count: "9 open roles across 6 teams"
- **Component**: Refine existing role grid component.

### 3. Life at BrewMatch — Photo Wall **[NEW]**
A bento-style grid of 6-9 real photographs from inside the company. No staged shots.

- **Format**: A masonry / bento grid with varied aspect ratios. Each image has a small caption: location + date + 1-line context.
- **Suggested photos**:
  - Barista training session, Indiranagar
  - Off-site at Coorg estate
  - Annual cupping competition
  - Diwali team dinner
  - Roastery floor, morning shift
  - Café opening in Pune, 2025
  - Senior engineers + baristas at quarterly lunch (cross-team)
  - Founder pouring coffee at Bengaluru café (founder works the floor monthly)
- **Component**: New `PhotoWall` primitive. Each cell uses `RevealOnScroll` + `aspect-[X/Y]` reserved. No tilt.
- **Caption style**: 9-10px uppercase tracking, small, unobtrusive.

### 4. Success Stories — From the Team **[NEW — user explicitly requested]**
The emotional core of the page. 3-4 deep portraits of people who grew here.

- **Format**: A horizontal scrolling testimonial cards on desktop, vertical stack on mobile.
- **Per story**:
  - Large portrait (4:5 ratio)
  - Name + current role
  - "Joined as ___ in ____" / "Now ___"
  - 80-100 word story in their own voice
  - 1 pull quote in larger serif
- **Suggested archetype stories**:
  1. **Café team lead → Regional trainer** — "Joined as a barista in 2018, didn't speak English well, now trains all of South India."
  2. **Intern → Senior engineer** — "Three weeks of barista shadowing taught me more about user empathy than any product course."
  3. **Roastery apprentice → Head of Roasting (Mumbai)** — "I was hired to clean machines. Now I own the Mumbai roast profile."
  4. **Designer → Brand lead** — "Came in to design a single packaging refresh in 2021. Stayed for the people."
- **Open**: Need real employee names + photos + permission. Until then, placeholder names clearly marked.
- **Component**: New `StoryCarousel` or a `SuccessStoryGrid`. Tilt OK (intensity 4) but motion subtle.

### 5. The Coffee School **[NEW]**
Detail the 3-week paid training program. This is a real differentiator.

- **Format**: A 3-column "What you learn" breakdown by week, with a sticky overall intro.
  - Week 1: Origins, varietals, harvest, processing
  - Week 2: Roast theory, grind, extraction, water chemistry
  - Week 3: Service, hospitality, conflict, café operations
- **Below the columns**: photos of an actual cohort + a quote from a recent graduate.
- **Numbers callout**: "₹0 cost. Full salary. SCA-aligned curriculum. 12 cohorts a year."
- **Component**: Pinned text block + 3-column grid.

### 6. Career Paths **[NEW]**
A visual ladder showing how a barista can become a senior leader.

- **Format**: 3-4 horizontal lanes (Café, Roastery, Corporate, Café Operations) each with a 5-step progression.
- **Example — Café lane**:
  - Barista → Senior Barista → Café Lead → Regional Trainer → Operations Manager
- **Each step**: title + typical tenure to next step + average compensation band.
- **Component**: New `CareerLadder` SVG/grid. Static, no motion.
- **Promise**: "92% of leadership promoted from within" — already in StatStrip; reinforced visually here.

### 7. Benefits — The Specifics **[REFINE existing PinnedTextBlock]**
Currently a single PinnedTextBlock. Expand into a structured grid because benefits are scannable, not narrative.

- **Format**: A 3-column grid grouped as:
  - **You & your family**: Health cover, parent coverage, life insurance, gender-affirming care, mental health
  - **Time**: 30 days paid leave, paid sabbatical (every 5 yrs), generous parental leave (all genders), period leave
  - **Learning & life**: Coffee school, ₹50k annual learning budget, free beans for life, café meals, equity for senior roles
- **Each item**: 1-line title + 1-line specific detail (numbers where possible).
- **No vague claims**: "competitive salary" / "great culture" are banned.
- **Component**: Simple 3-up grid, no parallax.

### 8. Hiring Process — Transparent Timeline **[NEW]**
What candidates can expect. Build trust by being clear.

- **Format**: A 4-step horizontal timeline.
  - **Step 1: Apply** (10 min form + portfolio if relevant)
  - **Step 2: Cup & chat** (30-min video call with hiring manager + 1 team member; we mail you beans beforehand)
  - **Step 3: Trial day or work sample** (paid; café roles do a trial shift, corporate do a real take-home or working session)
  - **Step 4: Offer** (within 5 business days of step 3)
- **Below**: SLA — "we respond to every applicant within 7 business days, even rejections."
- **Component**: `HiringTimeline` — horizontal stepper, SVG-based, no motion.

### 9. What We Look For (and What We Don't) **[NEW]**
Sharp anti-platitudes. Most "what we look for" lists are useless. Ours should be falsifiable.

- **Format**: Two columns — "We look for" on left, "We don't hire for" on right.
- **We look for**:
  - Curiosity that survives boredom (you'll grind a lot of beans before you cup any)
  - Hospitality as instinct, not performance
  - The ability to be wrong without flinching
  - Specificity in how you describe past work
- **We don't hire for**:
  - Coffee-influencer aesthetics
  - Performative passion
  - Ego that doesn't match output
  - Resumes optimized for keywords
- **Component**: Two-column block, RevealOnScroll, no tilt.

### 10. DEI With Receipts **[NEW]**
Real numbers, not platitudes. Indian F&B has a long way to go on this; lead by showing.

- **Format**: 4-up stat band — secondary, smaller than the main StatStrip — with eyebrow "Representation, in numbers".
- **Suggested stats** (verify before publishing):
  - 48% women across the company
  - 67% first-generation hospitality workers in café roles
  - 6 cafés with wheelchair-accessible service bars (target: all by 2027)
  - 0 unpaid internships, ever
- **Component**: Reuse `StatStrip` but with `variant="minimal"` and a different palette, OR a custom mini-strip to differentiate from the headline StatStrip.

### 11. By the Numbers (Main StatStrip) **[KEEP]**
Already wired with eyebrow + caption.

### 12. FAQ for Applicants **[NEW]**
A small accordion of the most-asked questions.

- **Format**: 5-7 collapsible Q&A items.
- **Suggested questions**:
  - "I don't have prior coffee experience. Can I apply for a café role?"
  - "Are remote roles available? Which teams?"
  - "What does the trial shift involve and is it paid?"
  - "Do you sponsor visas for international hires?"
  - "How do internships work?"
  - "What if there's no open role for my skill set today?"
  - "Where are your cafés located? Are you opening in my city?"
- **Component**: Simple `<details>` elements with serif headings; no JS state needed.

### 13. Closing CTA **[KEEP, sharpen]**
- "Don't see a role that fits? Write to us anyway." → careers@brewmatch.in
- One sentence: "We hire people, not job descriptions."

---

## Image manifest

| # | Section | Description | Aspect |
|---|---------|-------------|--------|
| 1 | Hero | Barista mid-pour, focused | 16:9 |
| 2 | Photo Wall | 8-9 real internal photos | various |
| 3–6 | Success Stories | 4 employee portraits | 4:5 |
| 7 | Coffee School | A cohort photo | 16:10 |
| 8 | Career Paths | SVG-only — no raster | — |
| 9 | Hiring Process | SVG-only — no raster | — |

## Open content questions

1. The 4 employees we feature in Success Stories — names, photos, journey facts, permission.
2. Salary band data — confirm we want to publish it. (Recommended yes; differentiator.)
3. The 9 open role descriptions — real role data or stays sample for v7.0?
4. DEI numbers — confirm exact figures before publishing.
5. The benefits list — confirm every item is currently true (no aspirational items in published copy).

## Smooth-scroll notes specific to this page

- This page is **scroll-light, content-heavy**. Most sections should be still (cards, grids, timelines), not parallax.
- The Photo Wall is the only motion-heavy new section — use `RevealOnScroll` once per cell with staggered `delay`. No useScroll transforms.
- Success Stories: if implemented as a horizontal scroller, use CSS `overflow-x: auto` + `scroll-snap-type: x mandatory` for native smoothness. Do NOT JS-control horizontal scroll inside a Lenis-managed vertical scroll context — it fights Lenis.
- Career Ladder + Hiring Timeline are SVG. Zero perf cost. Keep them static even with motion enabled — the content is the message, not the motion.
- Open Roles grid is above the fold for many viewports. Preload the first 3-4 role card icons (if any) in the manifest.
