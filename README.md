# The Date Crew — Matchmaker Workspace (MVP)

> **Built by a Full-Stack Engineer** as part of the internship assessment.  
> A high-intent, internal relationship-management platform for executive matchmakers.  
> **100% Type-Safe (TypeScript)** • **12/12 Unit Tests Passing** • **Zero-Config Offline Demo Mode**

---

## 💡 Engineering Philosophy & Why I Built It This Way

When designing this platform, I deliberately avoided building a generic admin dashboard or outsourcing the core matching logic to an unpredictable LLM prompt. Matrimonial matchmaking involves real human lives and sensitive cultural expectations; matchmakers need **explainable mathematical reasoning**, not black-box hallucinations.

Here are the four design principles I followed:

1. **Deterministic Core, AI as an Augmentation**: The compatibility score (0–100) and eligibility decisions are computed using pure mathematical functions in TypeScript. The LLM (Google Gemini or OpenAI) is used strictly to synthesize polite rationales and draft warm intro notes based *only* on verified facts.
2. **Two-Way Reciprocal Matching**: A good match isn't one-sided. If Candidate B fits Client A's dreams, but Client A violates Candidate B's non-negotiables, the system flags it or excludes it.
3. **Score Coverage Metric**: An 85% match calculated with 95% of the data is trustworthy. An 85% match calculated with half the preferences missing is a gamble. I introduced a dedicated `Score Coverage` percentage so matchmakers immediately know when they need to pick up the phone and confirm missing details.
4. **Zero-Friction Evaluation**: The project runs right out of the box with 116 synthetic profiles and local session auth. You do not need to configure PostgreSQL or paste an AI API key just to test the product.

---

## ⚡ Quick Start (Ready in 30 Seconds)

You don't need a live database or API keys to test everything.

```bash
# 1. Clone & install
git clone <your-repo-url>
cd matchmaker
npm install

# 2. Run the 12 core matching engine unit tests
npm test

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 🔑 Demo Login Credentials
I pre-seeded two matchmaker accounts:

* **Email**: `matchmaker@thedatecrew.com`
* **Password**: `Matchmaker@2026!`
* *(Tip: There is a one-click **"Autofill Demo Account"** button on the `/login` screen)*

---

## 🧠 How the Matching Algorithm Works

The algorithm is located in `lib/matching/` and has zero UI dependencies. You can run it in a Node CLI or test runner independently.

It runs in two distinct stages:

```
[Candidate Pool: 116 Profiles]
           │
           ▼
Stage 1: Eligibility Filtering (Hard Dealbreakers)
  ├── 1. Same-gender exclusion (opposite-gender rule)
  ├── 2. Exclude self
  ├── 3. Active introduction check (prevents duplicate spam)
  └── 4. Non-negotiables (conflicting stance on children, relocation dealbreakers)
           │
           ▼ (Eligible Candidates Only)
Stage 2: 7-Factor Weighted Scoring Model
  ├── Mutual Partner Preferences : 30% (reciprocal + gender strategy)
  ├── Children & Long-Term Values : 20% (Yes/No/Maybe matrix + values overlap)
  ├── Lifestyle & Habits         : 15% (pets, dietary habits, hobbies overlap)
  ├── Career & Education         : 15% (degree prestige, income tier, stability)
  ├── Relocation & Geography     : 10% (same metro cluster or relocation willingness)
  ├── Language Harmony           :  5% (shared spoken mother tongues)
  └── Profile Completeness       :  5% (verification badge & profile depth)
           │
           ▼
[Output: Overall Compatibility (0-100), Score Coverage %, Strengths & Friction Points]
```

### 1. The Mathematical Formula

$$\text{Overall Score} = \text{round}\left( \frac{\sum (w_i \times s_i)}{\sum w_i} \right)$$

$$\text{Score Coverage} = \text{round}\left( \frac{\sum w_{\text{known}}}{\sum w_{\text{total}}} \times 100 \right)$$

Missing data points are never punished with a punitive score of zero; instead, they are labeled as `Unknown` and reduce the **Score Coverage** metric.

### 2. Gender-Specific Heuristics
Per the assessment requirements, male and female clients often have distinct operational priorities in matrimonial searches:
* **For Male Clients**: Accommodates stated preferred age brackets (often younger candidates within tolerance), height differentials, and financial flexibility.
* **For Female Clients**: Prioritizes professional stability, education tier (IIT/IIM/tier-1 colleges), career trajectory, and relocation feasibility.
* **Symmetry**: Both strategies still run mutual reciprocal verification to ensure fair compatibility.

### 3. Ethical Isolation of Sensitive Data
Religion and caste are optional biodata fields. **They are completely excluded from the default mathematical scoring functions.** They cannot be inferred by proxies (like family names or cities), and matchmakers must explicitly toggle an access-control lock to view them.

---

## 🤖 AI Integration & Defensive Fallbacks

I integrated **Google Gemini** (and OpenAI as secondary) in `lib/ai/openai.ts`.

### How it works:
1. The matching engine computes the numerical score, identifies top strengths, and highlights friction points.
2. We send this structured payload to Gemini (`gemini-2.5-flash` in JSON mode).
3. The prompt explicitly orders the model:
   * **Do not invent biographical details.**
   * **Do not calculate or alter compatibility scores.**
   * **Do not promise guaranteed marriage outcomes.**
4. The output is validated at runtime using a strict **Zod schema** (`explanation` and `introDraft`).
5. **If the API key is missing, times out, or fails**: A deterministic rule-based template generates the rationale and email draft instantly without breaking the page.

---

## 🧪 12 Unit Tests Covering Real Edge Cases

Run `npm test` to verify the matching engine:

```bash
> npm test
✔ 1. Same-gender candidates are excluded
✔ 2. Explicit non-negotiable preference conflicts are excluded
✔ 3. Compatible children preferences improve alignment
✔ 4. Male-specific and female-specific strategies differ appropriately
✔ 5. Mutual preference alignment affects ranking
✔ 6. Missing preferences are treated as unknown
✔ 7. Score coverage decreases when applicable information is missing
✔ 8. Scores remain strictly within 0–100
✔ 9. Candidate ranking is deterministic
✔ 10. Duplicate introductions are prevented where required
✔ 11. Sensitive attributes do not influence default scoring
✔ 12. AI failure does not break the matching engine
```

---

## 🧭 Codebase Tour

```
matchmaker/
├── app/
│   ├── login/page.tsx               # Luxury login with demo autofill
│   ├── dashboard/page.tsx           # 6 operational metrics, search, multi-filters, table
│   ├── customers/[id]/
│   │   ├── page.tsx                 # Full biodata tabs, consultation notes, match history
│   │   └── matches/page.tsx         # Ranked candidate cards, factor breakdown, Send Match
│   └── api/                         # REST endpoints (auth, clients, preferences, notes, matches)
├── components/
│   ├── layout/app-shell.tsx         # Responsive sidebar with mobile backdrop drawer
│   ├── modals/
│   │   ├── edit-profile-modal.tsx   # Live client biodata editor with instant persistence
│   │   └── send-match-modal.tsx     # Introduction preview & custom message editor
│   └── ui/                          # Minimalist black & white design tokens
├── lib/
│   ├── matching/                    # 🎯 PURE DOMAIN MATCHING ENGINE
│   │   ├── eligibility.ts           # Hard dealbreakers & constraint checks
│   │   ├── preferences.ts           # Tolerance brackets & distance normalization
│   │   ├── scoring.ts               # 7-factor calculation & coverage formula
│   │   ├── ranking.ts               # Deterministic sorting & tie-breaking
│   │   └── explanations.ts          # Grounded rationale & intro generators
│   ├── ai/openai.ts                 # Google Gemini / OpenAI with Zod validation & fallback
│   ├── auth/session.ts              # scrypt password hashing + signed HTTP-only cookies
│   ├── data/synthetic.ts            # 116 synthetic Indian profiles (tech, law, finance, etc.)
│   └── db/store.ts                  # In-memory demo store + Postgres adapter
├── docs/
│   ├── MATCHING-ALGORITHM.md        # 3-paragraph assessment submission write-up
│   └── TECH-LEAD-BRIEF.md           # Architecture brief for engineering leadership
```

---

## 🎯 3 Interactive Scenarios to Test During the Review

When reviewing the running application:

1. **Test the Operations Dashboard (`/dashboard`)**:
   * Filter by `City: Mumbai` and `Journey Stage: Ready for Matches`.
   * Watch the metrics update in real-time. Notice how clicking any client takes you to their biodata.
2. **Test Gender-Specific Discovery (`/customers/cust-m-1/matches`)**:
   * Inspect **Rohan Varma** (31, Founder in Mumbai).
   * Notice how candidate cards display their score out of 100 alongside the **Data Coverage %**.
   * Click **"View 7-Factor Score Breakdown"** to inspect the math behind each recommendation.
3. **Test the Send Match Workflow**:
   * On any recommendation card, click **"Send Match"**.
   * The modal pre-fills with an AI-generated introduction.
   * Edit the message, click **"Confirm & Send Intro"**, and notice how the status updates to `SENT` and automatically logs a consultation note into the client's history.

---

## ⚙️ Environment Variables (Optional)

Create a `.env` file from `.env.example` if you want to connect live external services:

```env
# Optional: Google Gemini API (Recommended)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite

# Optional: OpenAI API Key (Alternative)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: PostgreSQL Database (Drizzle ORM)
DATABASE_URL=postgresql://postgres:password@localhost:5432/matchmaker

# Session secret for cookie signing
SESSION_SECRET=the-date-crew-matchmaker-session-secret-2026
```

---

## 🔮 What I Would Build Next in Production

* **Biometric & Identity Verification**: Integrate with DigiLocker or Aadhaar API for automated identity and marital status checks.
* **Closed-Loop Outcome Feedback**: Collect post-date feedback from clients (e.g., chemistry, communication style) and feed that back into weight calibrations.
* **Real-time Team Locks**: Use WebSockets so multiple matchmakers don't accidentally reach out to the same candidate simultaneously.
>>>>>>> 958f4a7 (Initial commit)
