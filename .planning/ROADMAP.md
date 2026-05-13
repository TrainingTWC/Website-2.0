# Roadmap: v1.1 Third Intelligence Context & Personality

**Milestone:** v1.1
**Continuing from:** v1.0 (last phase was 0 — no phases executed)
**Phase numbering:** 1–3

---

## Phase 1 — Fix AI Connectivity

**Goal:** Third Intelligence produces real recommendations instead of errors.

**Requirements covered:** AI-01, AI-02

### Tasks

1. In `convex/recommendations.ts`, change `process.env.GOOGLE_AI_API_KEY` → `process.env.GEMINI_API_KEY`
2. Add graceful error handling for empty/malformed Gemini responses (null-safe path through `json.candidates`)
3. Verify the fix by confirming the error message is gone when the key is present

### Success Criteria

- User completes the 6-question flow and sees a product recommendation (not an error) when `GEMINI_API_KEY` is set in Convex env
- Missing API key shows a clear "not configured" message (not a crash)
- Malformed Gemini response returns a fallback explanation, not a thrown exception

### Depends On

Nothing — can start immediately.

---

## Phase 2 — Product Context Document

**Goal:** A single source-of-truth file exists that encodes the Third Wave Coffee brand and gives every product a full personality profile.

**Requirements covered:** CTX-01, CTX-02, PROD-01, PROD-02, PROD-03, PROD-04, PROD-05

### Tasks

1. Create `convex/productContext.ts`
2. Write `BRAND_CONTEXT` — shop story, mission, specialty coffee philosophy, Third Intelligence voice directive (crisp, confident, knowledgeable)
3. Write `PRODUCT_PERSONALITIES` — for each of the 18 SKUs:
   - **Archetype** — one-word character type (e.g., The Rebel, The Wanderer, The Sage)
   - **Tagline** — one punchy sentence that captures the product's essence
   - **Voice** — how the AI should *talk about* this product (3–5 descriptors)
   - **Ideal customer** — one sentence profile of who this is for
   - **Mood** — when/where to drink this; the atmosphere it evokes
   - **Brewing ritual** — recommended brew method and why it unlocks the best of this product
4. Export both as named constants ready to be imported by `recommendations.ts`

### Success Criteria

- File is self-documenting — a developer reading it understands every product's character without looking elsewhere
- All 18 SKUs have a personality entry keyed by product name (exact match to seed data)
- Brand context covers: what TWC stands for, what "specialty coffee" means in this context, how Third Intelligence should position itself
- Merch entries have enough personality to enable sensible cross-sells (e.g., "this mug belongs with ritual brewers")

### Depends On

Phase 1 (none technically, but personality work is wasted without a working AI)

---

## Phase 3 — Enhanced AI Prompt

**Goal:** The AI prompt uses the context document so every recommendation reads as if written by an expert TWC barista, not a generic chatbot.

**Requirements covered:** CTX-03, PROMPT-01, PROMPT-02, PROMPT-03, PROMPT-04

### Tasks

1. Import `BRAND_CONTEXT` and `PRODUCT_PERSONALITIES` from `convex/productContext.ts` into `recommendations.ts`
2. Rewrite the AI prompt to:
   - Open with the brand voice directive (from `BRAND_CONTEXT`)
   - Inject personality profiles for all products in the catalog
   - Instruct Gemini to reference the matched product's archetype, mood, and brewing ritual in the explanation
   - Prohibit generic phrasing ("perfect for you", "great choice") — require flavor-specific, ritual-specific language
   - For cross-sells, require personality-compatibility reasoning
3. Ensure prompt stays within Gemini token limits (soft cap: 8000 input tokens)
4. Update the `explanation` field prompt so output is 2–3 sentences max, crisp and confident

### Success Criteria

- Explanation for a dark-roast match references roast character, not just "you'll love it"
- Explanation for a single-origin match mentions origin story or flavor notes specific to that product
- Cross-sell suggestion has a brief rationale (not just a product name)
- Response is ≤3 sentences — focused, not verbose
- Prompt compiles and calls Gemini without token errors

### Depends On

Phase 2 (needs `productContext.ts` to exist)

---

## Milestone Completion Criteria

- [ ] AI-01 through AI-02 verified (Phase 1)
- [ ] CTX-01 through CTX-02 verified (Phase 2)
- [ ] PROD-01 through PROD-05 verified (Phase 2)
- [ ] PROMPT-01 through PROMPT-04 verified (Phase 3)
- [ ] End-to-end test: a user completes the flow and receives a personality-informed recommendation

---
*Roadmap created: 2026-05-13*
*Next step: `/gsd-plan-phase 1`*
