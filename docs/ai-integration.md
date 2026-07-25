# AI integration

The Seed Copilot's request/response flow is isolated behind
`src/services/ai/`, so the actual model behind it can change without
touching any component.

```
src/services/ai/
  types.ts            CopilotRequest / CopilotResponse / CopilotIntent
  buildSeedPrompt.ts   System prompt + serialized Seed context
  aiClient.ts          generateCopilotResponse() — the only entry point UI code calls
  localAssistant.ts    Local dev fallback: intent classification + KNN knowledge base
```

`CopilotChat.tsx` only ever calls `generateCopilotResponse({ user, seed,
recentMessages, activity, evidence, message })`. It has no knowledge of
where the response actually comes from.

## Provider modes

Controlled by `VITE_AI_MODE` (see `.env.example`):

- **`mock`** (default, and what runs whenever the var is unset) — routes to
  `localAssistant.ts`, a heuristic, seed-aware dev assistant. No network
  call, no API key, nothing to configure. It classifies the message into
  an intent, detects whether the Seed is KNN-flavored (from its title and
  description) or generic, and answers from a small hand-written knowledge
  base. It's honest about its limits — see `localAssistant.ts`'s
  `generalExplanation` fallback for what it does when a question falls
  outside that knowledge base (see `localAssistant.ts`'s `genericExplanation`).
- **`api`** — routes to a backend endpoint at `VITE_AI_BACKEND_URL`
  instead. This endpoint does not exist yet. If `VITE_AI_MODE=api` is set
  without `VITE_AI_BACKEND_URL`, `aiClient.ts` throws immediately with a
  clear message, which `CopilotChat.tsx` surfaces as a retryable error —
  it never silently falls back to a canned reply.

## Where a real model belongs

**Do not call Claude or OpenAI directly from the browser**, and do not put
an API key in a `VITE_` variable — anything prefixed `VITE_` is bundled
into the client JS and readable by anyone who opens dev tools.

The intended path once a real model is wanted:

```
React frontend (aiClient.ts, "api" mode)
  → POST { systemPrompt, contextSummary, message } to a Supabase Edge
    Function (or any backend endpoint you control)
      → that function holds the real ANTHROPIC_API_KEY / OPENAI_API_KEY
        as a server-side secret and calls the model
      → returns { content, intent, evidenceSuggestion? }
  → aiClient.ts returns that as a CopilotResponse, same shape the
    local assistant already returns
```

`buildSeedPrompt.ts` already produces the `systemPrompt` +
`contextSummary` payload this endpoint would need — `aiClient.ts`'s `api`
branch is already wired to send it, it just needs a real endpoint to
receive it. No changes to `CopilotChat.tsx` or any other component should
be required to switch modes.

### Steps to connect a real provider later

1. Create a Supabase Edge Function (or equivalent backend route) that
   accepts `{ systemPrompt, contextSummary, message }`, calls the model
   provider with the server-side secret, and returns
   `{ content, intent, evidenceSuggestion? }`.
2. Set `VITE_AI_BACKEND_URL` to that function's URL.
3. Set `VITE_AI_MODE=api`.
4. Keep the provider's real secret key in the Edge Function's own secret
   store — never in this repo's `.env` files.

## Known limitations of the local assistant

- Intent classification is regex/keyword-based, not a real NLU model — it
  will misclassify unusual phrasing.
- The knowledge base only covers KNN concepts plus a small generic
  fallback for any other Seed. It says so explicitly rather than
  pretending to know a topic it doesn't.
- There's no user profile / learning-style data in the app yet, so
  `CopilotRequest.user.displayName` is always `null` and prompts can't
  adapt to a stated experience level — the request shape has a slot for
  it, but nothing populates it today.
