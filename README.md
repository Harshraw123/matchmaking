# Matchmaker — System Flow

Internal matchmaking workspace for The Date Crew. Compatibility scores and ranking are **deterministic**; AI only writes explanations and intro emails from verified facts.

## Quick start

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo login: `matchmaker@thedatecrew.com` / `Matchmaker@2026!`

Optional: set `GEMINI_API_KEY` in `.env` for AI copy (model: `gemini-3.5-flash-lite`). Without a key, deterministic templates are used.

---

## End-to-end flow

```
Candidate pool
      │
      ▼
checkEligibility     → drop impossible / dealbreaker pairs
      │
      ▼
scoreCandidate       → 7-factor score (0–100) + coverage %
      │
      ▼
rankCandidatesSync   → sort by score (deterministic tie-breakers)
      │
      ▼
[optional AI polish] → rewrite explanation + intro for top N only
      │                    (never changes scores or order)
      ▼
Matchmaker UI / Send intro
```

| Entry | What happens |
|-------|----------------|
| `GET …/matches` | Full pipeline via `rankCandidates` |
| `POST …/matches/ai-explain` | Score one pair → AI explain or intro |
| `POST …/matches/send` | Persist introduction (no re-scoring) |

---

## Matching engine (`lib/matching/`)

| File / function | What it does | Why |
|-----------------|--------------|-----|
| `types.ts` | Shared profile, prefs, score, config types | One contract for eligibility, scoring, APIs |
| `eligibility.ts` → `checkEligibility` | Hard filters: self, same gender, already introduced, non-negotiables | Never score pairs that cannot proceed |
| `preferences.ts` | Age/location/trinary/set-overlap helpers | Reusable preference math for factors |
| `scoring.ts` → `scoreCandidate` | Weighted 7 factors → overall score, coverage, strengths, conflicts, unknowns | Scores stay algorithmic and reproducible |
| `ranking.ts` → `rankCandidatesSync` | Eligibility → score → deterministic copy → sort | Stable ranking without LLM influence |
| `ranking.ts` → `rankCandidates` | Same as sync, then Gemini polish on top N | Better copy without changing order |
| `explanations.ts` → `generateDeterministic*` | Template explanation + intro email | Always-available offline fallback |
| `explanations.ts` → `generateGemini*` | Gemini narrative / intro / combined | Batch AI path used by ranking |

**Scoring weights (defaults):** mutual prefs 30% · children/values 20% · lifestyle 15% · career/education 15% · relocation 10% · language 5% · completeness 5%.

Missing data lowers **coverage**, not the factor score to zero. Caste/religion are never used in default scoring.

---

## AI layer (`lib/ai/`)

| File / function | What it does | Why |
|-----------------|--------------|-----|
| `client.ts` → `callGeminiJson` / `callOpenAiJson` | Shared HTTP + JSON parsing for providers | One place for keys, timeouts, model fallbacks |
| `prompts.ts` → `getMatchTier`, payload + prompt builders | Tier labels, grounded system prompts, structured payload | Keep AI output fact-bound and JSON-shaped |
| `openai.ts` → `generateAiMatchInsights` | Gemini → OpenAI → deterministic | On-demand explain+intro for the AI API route |
| `openai.ts` → `generateAiIntroEmail` | Gemini intro, else deterministic draft | On-demand intro-only path |

**AI rules:** only use supplied facts; never invent bio; never change scores; Zod-validate structured responses when used on the API path.

---

## Around the engine

| Area | Role |
|------|------|
| `app/api/…` | Auth-gated REST: customers, prefs, notes, matches, AI |
| `lib/db/store.ts` | In-memory demo store (+ optional Postgres) |
| `lib/auth/session.ts` | Cookie sessions for matchmakers |
| `lib/data/synthetic.ts` | Seed profiles for offline demo |
| `lib/matching/__tests__/` | Unit tests for eligibility, scoring, ranking, AI fallback |
