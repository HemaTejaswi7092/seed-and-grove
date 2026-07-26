# Achievement Detection — Verification Report

**What this tests:** the AI Copilot's decision to propose (or withhold) a
"Save as Achievement" suggestion (`evidenceCandidate`), and the accuracy
of the fields it extracts when it does.

**What this does not test:** `src/services/ai/localAssistant.ts` (the
regex-based mock fallback used when `VITE_AI_MODE=mock`). Every case below
was run against the real deployed `seed-copilot` Edge Function
(`VITE_SUPABASE_URL/functions/v1/seed-copilot`), which — per
`supabase/functions/seed-copilot/provider.ts` — currently resolves to
**Groq / Llama-3.3-70B-versatile** (`AI_PROVIDER` is unset, so it falls
back to the `"groq"` default).

**Method:** `scripts/verify-achievement-detection.sh` (checked into this
repo, safe to re-run) authenticates as the QA candidate account, then
POSTs each test message to `seed-copilot` with a fixed `seedContext` and,
where noted, a pre-populated "Logged evidence" entry. It reads the
response's presence/absence of `evidenceCandidate` as the suggest/
no-suggest decision. Raw request/response JSON for every run is written
to an output directory (not checked in — point-in-time data).

This document covers two rounds:

- **Round 1** — the original 16-case baseline, run against the
  then-unmodified prompt/schema (no changes made before or during that
  run). Found 0 hard classification failures, but two reliability gaps
  (certification detection, exact-duplicate rejection) and several
  field-extraction accuracy issues (invented technologies/outcomes,
  dropped or recomputed numbers, an omitted contribution field).
- **Round 2** — after applying targeted extraction-quality fixes (see
  "Changes applied" below) to `supabase/functions/seed-copilot/prompt.ts`
  (+ its required byte-identical mirror `src/services/ai/
  buildSeedPrompt.ts`) and `toolSchema.ts`, then redeploying. Confirms
  all five field-extraction issues found in Round 1 are fixed. **The
  reliability resampling for certification detection and duplicate
  rejection could not be completed in Round 2** — Groq began returning
  sustained `"provider temporarily unavailable"` errors partway through
  the re-run and never recovered across multiple retries at increasing
  intervals (12s, 90s, 180s+) over several minutes. That is reported
  honestly below as **pending**, not backfilled with invented numbers.

---

## Changes applied between Round 1 and Round 2

Per explicit instruction, the qualifying/disqualifying classification
rules themselves were **not** touched — only extraction-quality and
consistency reinforcement:

1. `toolSchema.ts`: `technologiesUsed` description now explicitly forbids
   inferring a tool the candidate didn't name; `outcomeOrImpact` now
   explicitly forbids inventing an impact/benefit and explicitly requires
   preserving stated numbers as given rather than computing a derived
   figure; `candidateContribution` now explicitly says to populate it
   whenever the message states what the candidate did, "even a single
   first-person clause."
2. `prompt.ts` / `buildSeedPrompt.ts` (kept byte-identical, per this
   file's own existing convention): added one sentence reinforcing that
   certifications/awards qualify exactly like a completed technical
   artifact (with a worked example); added a sentence making duplicate
   rejection "a hard rule, not a judgment call," with an explicit
   requirement that the reply text and the structured output must agree;
   added a new paragraph consolidating the four extraction-quality rules
   (no invented technologies, no invented outcomes, preserve numbers
   exactly, always populate contribution when first-person).
3. `prompt.ts`'s `buildUserTurn`: strengthened the existing "Logged
   evidence" duplicate reminder to explicitly cover the failure mode
   observed in Round 1 (reply text acknowledging the duplicate while the
   structured output still proposed it).

---

## Round 1 — baseline (unmodified prompt)

### Should create an Achievement

| # | Category | Message | Expected | Actual | Pass |
|---|---|---|---|---|---|
| S1 | Built a completed feature/artifact | "I built a customer churn dashboard in Power BI connected to PostgreSQL, reducing weekly reporting time from 4 hours to 30 minutes." | Suggest | Suggest | ✅ |
| S2 | Implemented a meaningful technical decision | "I decided to switch our real-time updates from REST polling to WebSockets, which cut server load by 40% and removed the 5-second polling delay." | Suggest | Suggest | ✅ |
| S3 | Solved a real problem | "I fixed a bug where the payment webhook was silently dropping about 15% of transactions because of a race condition in the idempotency check." | Suggest | Suggest | ✅ |
| S4 | Achieved a measurable improvement | "I added composite indexes to our database queries, which reduced average API response time from 800ms to 120ms." | Suggest | Suggest | ✅ |
| S5 | Completed a major milestone | "I completed the full MVP of our recommendation engine — it's now generating personalized suggestions end-to-end for all 10,000 of our test users." | Suggest | Suggest | ✅ |
| S6 | Deployed/published working output | "I deployed the fraud detection model to production using Docker and AWS ECS, and it's now scoring live transactions in real time." | Suggest | Suggest | ✅ |
| S7 | Earned a certification/award/recognition | "I earned the AWS Certified Solutions Architect – Associate certification after passing the exam this week." | Suggest | **Inconsistent** — see Reliability | ⚠️ |

### Field accuracy detail (Round 1)

**S1** (the worked example) — extracted exactly as expected: Title `Customer Churn Dashboard`, Technologies `Power BI, PostgreSQL`, Outcome "Reduced weekly reporting time from 4 hours to 30 minutes" (numbers exact). No invented skills, tools, or results. **Pass.**

**S2** — Outcome preserved both numbers correctly. **`candidateContribution` was left empty** despite the message being a clear first-person statement. **Field issue.**

**S3** — Technologies correctly left empty (no tool named — correct restraint). **Outcome dropped the stated 15% figure**, generalizing to "improved reliability of payment processing system." **Field issue** (violates: preserve measurable numbers).

**S4** — **Outcome was recomputed rather than preserved**: message states "800ms to 120ms," extracted outcome said "Reduced ... by 680ms" (a derived delta). **Technologies invented a generic, unstated label** — `Database Management System` — where no specific database technology was named (contrast with S3, which correctly left this empty in the identical situation). **Field issues.**

**S5** — **Technologies fabricated `Python, SQL`** — neither is mentioned anywhere in the message. **Field issue** (invention).

**S6** — Technologies correct (`Docker, AWS ECS`). **Outcome fabricated "Reduced fraud risk"** — the message only states the model is deployed and scoring transactions; no fraud-reduction result is claimed. **Field issue** (invention).

**S7** (when it does trigger) — clean extraction, no field issues. The problem was purely *whether* it fires.

### Should NOT create an Achievement

| # | Category | Message | Expected | Actual | Pass |
|---|---|---|---|---|---|
| N1 | Future plan | "I'm planning to build a Power BI dashboard for churn analysis next sprint." | No suggestion | No suggestion | ✅ |
| N2 | Question | "What's the best way to handle class imbalance in a churn prediction model?" | No suggestion | No suggestion | ✅ |
| N3 | Request for help | "Can you help me figure out why my Power BI dashboard isn't refreshing correctly?" | No suggestion | No suggestion | ✅ |
| N4 | Generic learning statement | "I learned a lot about Power BI and DAX formulas this week." | No suggestion | No suggestion | ✅ |
| N5 | Unresolved bug | "My dashboard keeps crashing when I filter by date range and I can't figure out why." | No suggestion | No suggestion | ✅ |
| N6 | Vague progress | "I worked on the dashboard some more today." | No suggestion | No suggestion | ✅ |
| N7 | Duplicate/near-duplicate of an existing Achievement | Same message as S1, sent with S1's achievement already in "Logged evidence" | No suggestion | **Inconsistent** — see Reliability | ⚠️ |
| N8 | Work mainly done by someone else | "My teammate built the churn dashboard in Power BI — I just reviewed it and gave some feedback on the layout." | No suggestion | No suggestion | ✅ |

No false positives among N1–N6 or N8.

### Extra: verification rule #6 (accept a genuinely new Achievement from the same project)

| # | Message | Existing evidence in context | Expected | Actual | Pass |
|---|---|---|---|---|---|
| X1 | "I deployed the churn model to production using Docker and set up a CI pipeline that cut deployment time from 30 minutes to 5 minutes." | S1's Power BI dashboard achievement | Suggest (not a duplicate) | Suggest | ✅ |

Correctly distinguished from the unrelated existing evidence; outcome preserved exactly. Same `candidateContribution`-omission issue as S2.

### Reliability / consistency sampling (Round 1)

**S7 (certification) — 3/5 correct (60%).** Samples: no-suggest, no-suggest, suggest, suggest, suggest. Extraction accurate whenever it fires — the failure mode was purely whether it fired.

**N7 (exact duplicate) — 4/5 correct (80%), 1 false positive.** Samples: suggest (incorrect), no-suggest, no-suggest, no-suggest, no-suggest. On the failing run, the reply text itself said *"You've already built a customer churn dashboard... This is a great milestone"* — the model's own prose recognized the duplicate, but `evidenceCandidate` was populated anyway. Free-text reasoning and forced tool-output disagreed on the same turn.

### Round 1 summary

- False positives: 1 (N7, 1 of 5 samples). False negatives: 2 of 5 (S7).
- Incorrectly extracted fields: S3 (dropped a metric), S4 (recomputed a metric; invented a technology label), S5 (invented two technologies), S6 (invented an outcome), S2 & X1 (omitted contribution).
- Overall pass rate (single primary run, 16 cases): 15/16 (93.75%).

---

## Round 2 — after extraction-quality fixes

### Field accuracy re-check (S1–S6)

All six succeeded cleanly (no provider errors) before the outage began. Direct before/after comparison:

| Case | Round 1 issue | Round 2 result |
|---|---|---|
| S2 | `candidateContribution` empty | ✅ **Fixed** — now "I decided to switch our real-time updates from REST polling to WebSockets" |
| S3 | Outcome dropped the 15% figure | ✅ **Fixed** — now "15% of transactions no longer dropped" |
| S4 | Outcome recomputed to "680ms" instead of preserving 800ms→120ms | ✅ **Fixed** — now "Reduced average API response time from 800ms to 120ms" (exact) |
| S4 | Invented `Database Management System` | ✅ **Fixed** — now correctly empty |
| S5 | Invented `Python, SQL` | ✅ **Fixed** — now correctly empty |
| S6 | Invented "Reduced fraud risk" | ✅ **Fixed** — now "scoring live transactions in real time" (only what was stated) |
| S2, X1 | `candidateContribution` omission pattern | ✅ **Fixed** — S2 above; not independently re-verified for X1 in Round 2 (blocked by the outage before reaching it), but same underlying field-description fix applies |

**New minor observation (not a Round 1 issue, not a rule violation):** S3's `technologiesUsed` in Round 2 now lists `payment webhook, idempotency check`. Neither is fabricated — both phrases are literally quoted from the message — but neither is really a "technology/tool/library" either; they're a system component and a design pattern. This is a categorization-precision nuance, not an invention, and not something this round's fixes targeted. Worth watching, not urgent enough to warrant another prompt change yet.

**No new field-accuracy regressions observed** across S1, S2, S4, S5, S6.

### Reliability resampling — S7 (certification), N7 (duplicate), N1–N6, N8, X1

**Status: incomplete, blocked by a Groq provider outage.** Partway through the Round 2 re-run, Groq began returning `"The AI provider is temporarily unavailable"` for every request. This was not the ordinary burst rate-limiting seen in Round 1 (which resolved with a few seconds' wait) — it persisted across the built-in 4-attempt retry, a follow-up 5-attempt retry at 12s intervals, and two further manual checks after 90s and 180s+ waits, all failing identically. This reads as a genuine sustained outage on the provider side, not a request-pattern problem in this script.

As a result, **no Round 2 data exists yet** for: N1–N6, N8 (all previously passed cleanly in Round 1; not expected to regress, but not re-confirmed), S7 and N7 reliability resampling (the two cases the certification/duplicate fixes specifically targeted), and X1's contribution-field re-check.

**This is reported as pending, not as a pass.** Re-running
`./scripts/verify-achievement-detection.sh` once the provider recovers
will fill in this section without needing any further code changes.

---

## Recommended next steps

1. Re-run `scripts/verify-achievement-detection.sh` once Groq's outage clears, and specifically resample S7 and N7 5x each (the same way Round 1 did) to get real before/after reliability numbers for the two consistency fixes. Until then, whether the certification and duplicate-detection reinforcement actually improved their hit rates is **unconfirmed** — the prompt/schema changes are deployed, but not yet measured.
2. If S3's `technologiesUsed` miscategorization (payment webhook / idempotency check) recurs across more problem-solving-type messages once resampled, consider narrowing the field description further (e.g. "a named product, library, or platform — not a system component or pattern described in prose").
3. No further changes to the classification rules (qualifying/disqualifying signals) are recommended — Round 1 found zero hard classification failures there, consistent with the instruction that "the classification is already good."
