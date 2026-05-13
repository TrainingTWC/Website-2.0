# Requirements: BrewMatch AI — Third Wave Coffee

**Defined:** 2026-05-13
**Core Value:** Every customer leaves with a recommendation that feels personally curated, not a filter result.

## v1.1 Requirements

Requirements for Milestone v1.1 — Third Intelligence Context & Personality.

### AI Connectivity

- [ ] **AI-01**: Mistral API key is read from the correct Convex env variable (`MISTRAL_API_KEY`) so recommendations no longer error on every request
- [ ] **AI-02**: AI response parsing handles malformed or empty Mistral responses without surfacing a raw error to the user

### Brand Context

- [ ] **CTX-01**: A context document exists in the codebase that encodes TWC's brand story, mission, and specialty coffee philosophy
- [ ] **CTX-02**: The context document defines a consistent "Third Intelligence voice" — crisp, confident, knowledgeable, no generic chatbot phrasing
- [ ] **CTX-03**: The AI prompt injects this brand context so every explanation reads as if written by an expert TWC barista

### Product Personalities

- [ ] **PROD-01**: Every coffee bean product (9 SKUs) has a full character profile: archetype, voice tone, ideal customer, mood, brewing ritual, and a one-line personality tagline
- [ ] **PROD-02**: Every cold brew bag product (2 SKUs) has a full character profile
- [ ] **PROD-03**: Every easy coffee bag product (4 SKUs) has a full character profile
- [ ] **PROD-04**: Merch products (3 SKUs) have a brief personality note linking them to their gifting/lifestyle context
- [ ] **PROD-05**: Personality profiles are co-located with product data in a single `convex/productContext.ts` file — one source of truth

### AI Prompt Enhancement

- [ ] **PROMPT-01**: The AI prompt includes the brand voice directive so Mistral writes in TWC's voice, not a generic assistant voice
- [ ] **PROMPT-02**: The AI prompt includes personality profiles for all products so Mistral can reference them when writing match explanations
- [ ] **PROMPT-03**: Match explanations are specific (flavor notes, brewing suggestion, archetype connection) — not generic ("this is a great coffee for you")
- [ ] **PROMPT-04**: Cross-sell logic is informed by personality compatibility (e.g., El Diablo + Tiger Mug make sense together)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Personality data stored in Convex DB | Personalities don't change often; in-code is simpler and faster |
| Per-user personality learning | No authentication in kiosk mode |
| Multi-language personality profiles | English-only for current deployment |
| AI image generation for products | Out of budget/scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AI-01 | Phase 1 | Pending |
| AI-02 | Phase 1 | Pending |
| CTX-01 | Phase 2 | Pending |
| CTX-02 | Phase 2 | Pending |
| CTX-03 | Phase 3 | Pending |
| PROD-01 | Phase 2 | Pending |
| PROD-02 | Phase 2 | Pending |
| PROD-03 | Phase 2 | Pending |
| PROD-04 | Phase 2 | Pending |
| PROD-05 | Phase 2 | Pending |
| PROMPT-01 | Phase 3 | Pending |
| PROMPT-02 | Phase 3 | Pending |
| PROMPT-03 | Phase 3 | Pending |
| PROMPT-04 | Phase 3 | Pending |

**Coverage:**
- v1.1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-13*
*Last updated: 2026-05-13 — initial definition*
