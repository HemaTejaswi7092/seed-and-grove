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

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
export const CLAUDE_DEFAULT_MODEL = "claude-sonnet-5";

// Shared by every forced tool-call this provider makes — see groq.ts's
// identical helper for why this is split out.
async function callClaudeTool(
  systemPrompt: string,
  userTurn: string,
  toolName: string,
  toolDescription: string,
  schema: object,
  config: ProviderCallConfig,
): Promise<unknown> {
  // See groq.ts's identical timeout for why this is here.
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      // See groq.ts's identical change — kept in sync so switching
      // AI_PROVIDER doesn't also silently change response-length limits.
      max_tokens: 700,
      system: systemPrompt,
      messages: [{ role: "user", content: userTurn }],
      tools: [{ name: toolName, description: toolDescription, input_schema: schema }],
      tool_choice: { type: "tool", name: toolName },
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Claude API request failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const toolUse = (data.content ?? []).find(
    (block: { type: string }) => block.type === "tool_use",
  );

  if (!toolUse) {
    throw new Error("Claude did not return a structured tool call.");
  }

  return toolUse.input;
}

// Matches ProviderCallFn (see types.ts) — this is what makes it swappable
// with groq.ts (or a future gemini.ts/openai.ts) from provider.ts without
// either provider module knowing the other exists.
export async function callClaude(
  userTurn: string,
  config: ProviderCallConfig,
): Promise<CopilotToolOutput> {
  const parsed = await callClaudeTool(
    SYSTEM_PROMPT,
    userTurn,
    TOOL_NAME,
    TOOL_DESCRIPTION,
    COPILOT_RESPONSE_SCHEMA,
    config,
  );
  if (!isValidToolOutput(parsed)) {
    throw new Error("Claude did not return a valid structured tool response.");
  }
  return parsed as CopilotToolOutput;
}

// Matches AchievementDraftCallFn (see types.ts) — the on-demand "Publish
// Achievement" button's generation call, entirely separate from the chat
// flow above.
export async function callClaudeForAchievementDraft(
  userTurn: string,
  config: ProviderCallConfig,
): Promise<AchievementDraftToolOutput> {
  const parsed = await callClaudeTool(
    ACHIEVEMENT_DRAFT_SYSTEM_PROMPT,
    userTurn,
    ACHIEVEMENT_DRAFT_TOOL_NAME,
    ACHIEVEMENT_DRAFT_TOOL_DESCRIPTION,
    ACHIEVEMENT_DRAFT_SCHEMA,
    config,
  );
  if (!isValidAchievementDraftOutput(parsed)) {
    throw new Error("Claude did not return a valid achievement draft response.");
  }
  return parsed as AchievementDraftToolOutput;
}
