import type { CopilotToolOutput, ProviderCallConfig } from "./types.ts";
import { SYSTEM_PROMPT } from "./prompt.ts";
import { COPILOT_RESPONSE_SCHEMA, isValidToolOutput, TOOL_DESCRIPTION, TOOL_NAME } from "./toolSchema.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
export const CLAUDE_DEFAULT_MODEL = "claude-sonnet-5";

const TOOL_SCHEMA = {
  name: TOOL_NAME,
  description: TOOL_DESCRIPTION,
  input_schema: COPILOT_RESPONSE_SCHEMA,
};

// Matches ProviderCallFn (see types.ts) — this is what makes it swappable
// with groq.ts (or a future gemini.ts/openai.ts) from provider.ts without
// either provider module knowing the other exists.
export async function callClaude(
  userTurn: string,
  config: ProviderCallConfig,
): Promise<CopilotToolOutput> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userTurn }],
      tools: [TOOL_SCHEMA],
      tool_choice: { type: "tool", name: TOOL_NAME },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Claude API request failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const toolUse = (data.content ?? []).find(
    (block: { type: string }) => block.type === "tool_use",
  );

  if (!toolUse || !isValidToolOutput(toolUse.input)) {
    throw new Error("Claude did not return a valid structured tool response.");
  }

  return toolUse.input as CopilotToolOutput;
}
