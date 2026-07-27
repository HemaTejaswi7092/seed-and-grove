# AI integration

The Seed Copilot's request/response flow is isolated behind
`src/services/ai/`, so the actual model behind it can change without
touching any component.

```
src/services/ai/
  types.ts             CopilotRequest / CopilotResponse / CopilotIntent
  buildSeedPrompt.ts    Reference copy of the system prompt (documentation
                        only — see below for where the live prompt lives)
  aiClient.ts           generateCopilotResponse() — the only entry point UI code calls
  localAssistant.ts     Local dev fallback: intent classification + KNN knowledge base
```

`CopilotChat.tsx` only ever calls `generateCopilotResponse({ user, seed,
recentMessages, activity, evidence, message })`. It has no knowledge of
where the response actually comes from, or which AI provider answered it.

## Provider modes (frontend)

Controlled by `VITE_AI_MODE` (see `.env.example`):

- **`mock`** (default, and what runs whenever the var is unset) — routes to
  `localAssistant.ts`, a heuristic, seed-aware dev assistant. No network
  call, no API key, nothing to configure.
- **`api`** — routes to the real, deployed `seed-copilot` Supabase Edge
  Function via `supabase.functions.invoke("seed-copilot", { body })`. This
  is a real, model-backed Copilot with retrieval over the builder's own
  long-term project memory (see below). Requires the Edge Function to be
  deployed and the active provider's secret set — see "Deployment" below.

## AI provider layer (server-side, Edge Function only)

Which model actually answers is a separate axis from `VITE_AI_MODE`,
selected entirely server-side by the `AI_PROVIDER` Supabase secret — the
frontend has no knowledge of it and never changes.

```
supabase/functions/seed-copilot/
  toolSchema.ts   The structured-output contract ({ message,
                  memoryCandidate?, evidenceCandidate? }) as one JSON
                  schema, shared by every provider so they can't drift.
  claude.ts       Anthropic Messages API (x-api-key, tools/tool_choice).
  groq.ts         Groq's OpenAI-compatible Chat Completions API
                  (Authorization: Bearer, tools/tool_choice).
  provider.ts     Registry + dispatcher — reads AI_PROVIDER, resolves that
                  provider's api key + model secrets, calls it.
  index.ts        Everything else (auth, memory, prompt) — imports only
                  provider.ts's callAiProvider(), never a specific provider.
```

- **`AI_PROVIDER=groq`** (default if unset) — Groq, via
  `https://api.groq.com/openai/v1/chat/completions`. Reads `GROQ_API_KEY`
  (required) and `GROQ_MODEL` (optional override).
- **`AI_PROVIDER=anthropic`** — Claude, via
  `https://api.anthropic.com/v1/messages`. Reads `ANTHROPIC_API_KEY`
  (required) and `ANTHROPIC_MODEL` (optional override). Fully intact, not
  deleted — this project switched its *active* provider to Groq because
  the Anthropic account in use ran out of credit, not because anything was
  wrong with the Claude integration itself.

Default models (verified against each provider's current docs at the time
they were wired up — not guessed):

- Groq: `llama-3.1-8b-instant` (131K context, full tool-use support
  including forced `tool_choice`, active production model).
- Anthropic: `claude-sonnet-5`.

### Adding another provider (Gemini, OpenAI, ...)

This is the entire extension point — nothing outside these two steps
changes, and nothing outside `provider.ts` needs to know a new provider
exists:

1. Write a new file (e.g. `gemini.ts`) exporting a function matching
   `ProviderCallFn` from `types.ts`: `(userTurn: string, config: {
   apiKey: string; model: string }) => Promise<CopilotToolOutput>`. Build
   that provider's request using `toolSchema.ts`'s shared schema, parse
   its response, validate with `toolSchema.ts`'s `isValidToolOutput`.
2. Register it in `provider.ts`'s `PROVIDERS` map with its secret names
   (e.g. `GEMINI_API_KEY` / `GEMINI_MODEL`) and default model.

`index.ts`, `memory.ts`, `intent.ts`, `prompt.ts`, and the entire frontend
are provider-agnostic and require zero changes.

## Architecture

```
React frontend (aiClient.ts, "api" mode)
  → supabase.functions.invoke("seed-copilot", { seedId, seedContext,
    message, recentMessages, activity, evidence })
      → supabase/functions/seed-copilot/index.ts:
        1. Authenticates the caller from their own JWT (no service-role
           key anywhere in this function).
        2. Classifies the message's intent (planning, debugging,
           explanation, decision, result, ...) — see intent.ts.
        3. Retrieves this user's relevant long-term memory for this Seed
           from Postgres (copilot_memory table), scoped by the classified
           intent — see memory.ts.
        4. Builds a prompt from Seed context + retrieved memory + recent
           conversation + activity + evidence — see prompt.ts.
        5. Calls the active provider (provider.ts → claude.ts or
           groq.ts) with forced structured output, so the reply is always
           { message, memoryCandidate?, evidenceCandidate? }.
        6. If the model flagged a durable fact worth remembering, saves
           it to copilot_memory.
      → returns { message, intent, retrievedContext, evidenceCandidate? }
  → aiClient.ts maps that into the same CopilotResponse shape
    localAssistant.ts already returns — no changes needed anywhere else.
```

## Long-term memory vs. conversation history

These are deliberately two different things:

- **Conversation history** (`SeedConversationMessage`, in
  `state/seedStore.ts`) is the full chat log, client-side, sent fresh on
  every request as `recentMessages`. Every message lives here.
- **`copilot_memory`** (Postgres, server-side) holds only durable,
  reusable facts: project goals, datasets, architecture/technical
  decisions, milestones, measurable results, and stated preferences. Not
  every message becomes memory — the model itself decides, via the forced
  schema's optional `memoryCandidate` field (see `toolSchema.ts`), and
  only writes when a message states something durable, not for questions
  or small talk.

**Phase 1 (current)**: retrieval is plain, filtered, recency-ordered —
this user's rows, this Seed's rows (plus general, cross-Seed rows), of the
source types relevant to the classified intent. No embeddings, no
semantic search yet.

**Phase 2 (not built)**: add an embedding column to `copilot_memory` and a
similarity-search RPC, so retrieval finds relevant memory by meaning, not
just by type/recency. The migration for this will pick a specific
embedding model and set the vector column's dimension to match it exactly
— not guessed in advance.

## Security

- The browser never calls any AI provider directly and never sees
  `GROQ_API_KEY` or `ANTHROPIC_API_KEY` — each is a Supabase secret, read
  only inside its own provider module via `Deno.env.get(...)`, resolved
  through `provider.ts`.
- The Edge Function never uses the Supabase service-role key. It creates
  its Postgres client from the caller's own JWT
  (`Authorization: Bearer <token>`, attached automatically by
  `supabase.functions.invoke`), so every read/write it makes is subject to
  that user's Row Level Security policies — the same isolation the rest of
  the app relies on.
- `copilot_memory` RLS (see `supabase/copilot_memory.sql`) restricts every
  row to `auth.uid() = user_id`. Retrieval additionally filters to the
  requested `seed_id` — a different Seed's memory is never eligible, even
  for the same user.
- If the active provider call fails for any reason (bad/missing key, rate
  limit, network error, invalid model output), the client only ever
  receives a fixed, generic message — `"The AI provider is temporarily
  unavailable. Please try again."` The real error (including any provider
  response text) is logged server-side only, via `console.error`, never
  returned in the response body. Auth and request-validation errors keep
  their own specific messages — those aren't provider failures.

## Evidence

Evidence candidates are never auto-published. `CopilotChat.tsx` shows a
confirm/dismiss card; `addSeedEvidence` only runs when the user clicks
"Add to evidence."

## Deployment

```bash
# One-time: install the CLI, authenticate, link (see project setup notes
# for the full walkthrough — token-based login, since browser-based
# `supabase login` doesn't work in a non-TTY shell).
npm install -g supabase
supabase link --project-ref <project-ref>

# Set the active provider's secret. Groq is the default if AI_PROVIDER is
# unset at all, so setting GROQ_API_KEY alone is enough to go live on Groq:
supabase secrets set GROQ_API_KEY=gsk_your_real_key_here

# Optional overrides:
supabase secrets set GROQ_MODEL=llama-3.1-8b-instant
supabase secrets set AI_PROVIDER=groq   # or "anthropic"

# To switch back to (or add) Anthropic instead/alongside:
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-real-key-here
supabase secrets set AI_PROVIDER=anthropic

# Deploy (from the repo root):
supabase functions deploy seed-copilot --project-ref <project-ref>

# Verify:
supabase secrets list --project-ref <project-ref>       # names only
supabase functions list --project-ref <project-ref>     # status: ACTIVE
```

Frontend: set `VITE_AI_MODE=api` in `.env.local` (never `GROQ_API_KEY` or
`ANTHROPIC_API_KEY` there, never a `VITE_` variable, never committed —
those only ever live as Supabase secrets, read server-side).

### Testing

1. Sign in to the running app, open a Seed's Workspace.
2. Send a message. In the browser devtools Network tab, confirm a POST to
   `.../functions/v1/seed-copilot` — a 200 means the active provider
   answered; a 502 with the fixed "temporarily unavailable" message means
   the provider call failed (check the Edge Function's logs for the real
   reason — `[debug]`-tagged lines trace every stage).
3. To confirm memory retrieval end-to-end: state a durable fact (e.g. "I'm
   using the TMDB 5000 dataset"), then in a later message ask something
   that should reference it (e.g. "how should I clean the dataset?") and
   check the reply actually uses that context — or inspect
   `copilot_memory` directly in the Supabase Table Editor / SQL Editor,
   filtered to your `user_id`.
4. To confirm provider isolation, temporarily set `AI_PROVIDER=anthropic`,
   redeploy, and repeat — behavior should be identical from the frontend's
   perspective (same response shape, same memory, same evidence-candidate
   flow) since only the provider layer changed.

### Groq free-tier rate limits

Groq's free tier is rate-limited per-model (requests/minute, tokens/minute,
and a daily cap) and limits change over time — check
[console.groq.com](https://console.groq.com) → your project → Limits for
the current numbers before load-testing or demoing to multiple users at
once. A `429` from Groq surfaces to the client the same way any other
provider failure does: the fixed "temporarily unavailable" message, with
the real `429`/rate-limit detail in the Edge Function's server-side logs
only.

## Known limitations

- Intent classification (both `localAssistant.ts` and the Edge Function's
  `intent.ts`) is regex/keyword-based, not a real NLU model — unusual
  phrasing can be misclassified. The two classifiers are kept in sync by
  hand; there's no shared module between the Vite/browser build and the
  Deno Edge Function.
- Memory retrieval (Phase 1) is not semantic — it can miss a relevant
  memory whose wording doesn't match the classified intent's expected
  source types. Phase 2's embeddings will address this.
- "Why this answer?" retrieved-context display in `CopilotChat.tsx` is
  session-only — it doesn't persist across a page refresh, since
  `SeedConversationMessage` isn't extended to store it.
- There's no user profile / learning-style data in the app yet, so
  `CopilotRequest.user.displayName` is always `null`.
- No per-provider retry/backoff logic yet — a transient failure (e.g. a
  Groq rate limit) surfaces as an immediate error with a Retry button
  (`CopilotChat.tsx`) rather than being retried automatically.
