import type {
  AchievementDraftToolOutput,
  CopilotToolOutput,
  ProviderCallConfig,
} from "./types.ts";
import { SYSTEM_PROMPT } from "./prompt.ts";
import { COPILOT_RESPONSE_SCHEMA, isValidToolOutput, TOOL_DESCRIPTION, TOOL_NAME } from "./toolSchema.ts";
import {
  ACHIEVEMENT_DRAFT_SCHEMA,
  ACHIEVEMENT_DRAFT_SYSTEM_PROMPT,
  ACHIEVEMENT_DRAFT_TOOL_DESCRIPTION,
  ACHIEVEMENT_DRAFT_TOOL_NAME,
  isValidAchievementDraftOutput,
} from "./achievementDraft.ts";

// Groq's OpenAI-compatible API — same request/response shape as OpenAI's
// Chat Completions endpoint, which is why this module (and a future
// openai.ts) can share almost identical request-building logic while
// still being a fully separate, independently swappable provider module.
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Switched from llama-3.3-70b-versatile to this smaller/faster model to
// raise the effective request budget under Groq's per-day token quota
// (see max_tokens comment below) — an active production model with full
// tool-use support, including forced tool_choice (not just "auto"), and
// a 131K context window. Actually read from the GROQ_MODEL env var at
// request time (see provider.ts's resolveProviderDefinition); this is
// only the fallback when that secret isn't set.
export const GROQ_DEFAULT_MODEL = "llama-3.1-8b-instant";

// Shared by every forced tool-call this provider makes (currently: the
// chat flow and the on-demand achievement-draft flow) — one place that
// builds the request, sends it, and pulls the raw JSON arguments back out
// of the tool call. Each caller below still does its own shape
// validation, since "valid" means something different per schema.
async function callGroqTool(
  systemPrompt: string,
  userTurn: string,
  toolName: string,
  toolDescription: string,
  schema: object,
  config: ProviderCallConfig,
): Promise<unknown> {
  // Explicit deadline — without this, a Groq-side hang would otherwise run
  // until the Edge Function's own platform timeout kills it, which shows
  // up identically to every other failure mode. Rejects with a
  // DOMException named "TimeoutError" (see providerError.ts).
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      // Groq's per-day token quota counts this reservation as part of a
      // request's "requested" capacity even when the reply is much
      // shorter (confirmed against a live 429 body: a bare "hi" with no
      // Seed context still requested ~2900 tokens, almost entirely fixed
      // system-prompt/tool-schema/max_tokens overhead, not the message).
      // 700 comfortably covers a chat reply plus the structured fields
      // without materially changing what the model can say.
      max_tokens: 700,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userTurn },
      ],
      tools: [
        {
          type: "function",
          function: { name: toolName, description: toolDescription, parameters: schema },
        },
      ],
      tool_choice: { type: "function", function: { name: toolName } },
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Groq API request failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  const rawArguments = toolCall?.function?.arguments;

  if (typeof rawArguments !== "string") {
    throw new Error("Groq did not return a structured tool call.");
  }

  try {
    return JSON.parse(rawArguments);
  } catch {
    throw new Error("Groq's tool call arguments were not valid JSON.");
  }
}

// Matches ProviderCallFn (see types.ts) — swappable with claude.ts (or a
// future gemini.ts/openai.ts) from provider.ts without either provider
// module knowing the other exists.
export async function callGroq(
  userTurn: string,
  config: ProviderCallConfig,
): Promise<CopilotToolOutput> {
  const parsed = await callGroqTool(
    SYSTEM_PROMPT,
    userTurn,
    TOOL_NAME,
    TOOL_DESCRIPTION,
    COPILOT_RESPONSE_SCHEMA,
    config,
  );
  if (!isValidToolOutput(parsed)) {
    throw new Error("Groq did not return a valid structured tool response.");
  }
  return parsed as CopilotToolOutput;
}

// Matches AchievementDraftCallFn (see types.ts) — the on-demand "Publish
// Achievement" button's generation call, entirely separate from the chat
// flow above.
export async function callGroqForAchievementDraft(
  userTurn: string,
  config: ProviderCallConfig,
): Promise<AchievementDraftToolOutput> {
  const parsed = await callGroqTool(
    ACHIEVEMENT_DRAFT_SYSTEM_PROMPT,
    userTurn,
    ACHIEVEMENT_DRAFT_TOOL_NAME,
    ACHIEVEMENT_DRAFT_TOOL_DESCRIPTION,
    ACHIEVEMENT_DRAFT_SCHEMA,
    config,
  );
  if (!isValidAchievementDraftOutput(parsed)) {
    throw new Error("Groq did not return a valid achievement draft response.");
  }
  return parsed as AchievementDraftToolOutput;
}
