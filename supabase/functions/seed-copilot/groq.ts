import type { CopilotToolOutput, ProviderCallConfig } from "./types.ts";
import { SYSTEM_PROMPT } from "./prompt.ts";
import { COPILOT_RESPONSE_SCHEMA, isValidToolOutput, TOOL_DESCRIPTION, TOOL_NAME } from "./toolSchema.ts";

// Groq's OpenAI-compatible API — same request/response shape as OpenAI's
// Chat Completions endpoint, which is why this module (and a future
// openai.ts) can share almost identical request-building logic while
// still being a fully separate, independently swappable provider module.
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Verified against Groq's live model docs (console.groq.com/docs/models,
// console.groq.com/docs/tool-use) at implementation time — an active
// production model with full tool-use support, including forced
// tool_choice (not just "auto"), and a 131K context window. Not guessed.
// Override with GROQ_MODEL if Groq's lineup changes later.
export const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile";

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: TOOL_NAME,
    description: TOOL_DESCRIPTION,
    parameters: COPILOT_RESPONSE_SCHEMA,
  },
};

// Matches ProviderCallFn (see types.ts) — swappable with claude.ts (or a
// future gemini.ts/openai.ts) from provider.ts without either provider
// module knowing the other exists.
export async function callGroq(
  userTurn: string,
  config: ProviderCallConfig,
): Promise<CopilotToolOutput> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userTurn },
      ],
      tools: [TOOL_SCHEMA],
      tool_choice: { type: "function", function: { name: TOOL_NAME } },
    }),
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

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawArguments);
  } catch {
    throw new Error("Groq's tool call arguments were not valid JSON.");
  }

  if (!isValidToolOutput(parsed)) {
    throw new Error("Groq did not return a valid structured tool response.");
  }

  return parsed as CopilotToolOutput;
}
