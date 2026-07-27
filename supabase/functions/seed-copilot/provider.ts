import { callClaude, callClaudeForAchievementDraft, CLAUDE_DEFAULT_MODEL } from "./claude.ts";
import { callGroq, callGroqForAchievementDraft, GROQ_DEFAULT_MODEL } from "./groq.ts";
import type {
  AchievementDraftCallFn,
  AchievementDraftToolOutput,
  CopilotToolOutput,
  ProviderCallFn,
} from "./types.ts";

interface ProviderDefinition {
  apiKeyEnv: string;
  modelEnv: string;
  defaultModel: string;
  call: ProviderCallFn;
  callAchievementDraft: AchievementDraftCallFn;
}

// The entire extension point for adding a new AI provider (Gemini, OpenAI,
// ...): write one call<Provider>() + call<Provider>ForAchievementDraft()
// pair matching ProviderCallFn/AchievementDraftCallFn in its own file (see
// claude.ts/groq.ts), then add one entry here. index.ts, memory.ts,
// intent.ts, prompt.ts, achievementDraft.ts, and the frontend never need
// to change — none of them know a provider registry exists.
const PROVIDERS: Record<string, ProviderDefinition> = {
  groq: {
    apiKeyEnv: "GROQ_API_KEY",
    modelEnv: "GROQ_MODEL",
    defaultModel: GROQ_DEFAULT_MODEL,
    call: callGroq,
    callAchievementDraft: callGroqForAchievementDraft,
  },
  anthropic: {
    apiKeyEnv: "ANTHROPIC_API_KEY",
    modelEnv: "ANTHROPIC_MODEL",
    defaultModel: CLAUDE_DEFAULT_MODEL,
    call: callClaude,
    callAchievementDraft: callClaudeForAchievementDraft,
  },
};

// Groq is the active default (no Anthropic credit currently available —
// see project history). Anthropic stays fully intact and selectable by
// setting AI_PROVIDER=anthropic as a Supabase secret; nothing was deleted.
const DEFAULT_PROVIDER = "groq";

export function resolveProviderName(): string {
  return Deno.env.get("AI_PROVIDER") || DEFAULT_PROVIDER;
}

function resolveProviderDefinition(): { name: string; definition: ProviderDefinition; apiKey: string; model: string } {
  const name = resolveProviderName();
  const definition = PROVIDERS[name];
  if (!definition) {
    throw new Error(`Unknown AI_PROVIDER "${name}". Supported: ${Object.keys(PROVIDERS).join(", ")}.`);
  }

  const apiKey = Deno.env.get(definition.apiKeyEnv);
  if (!apiKey) {
    throw new Error(`${definition.apiKeyEnv} is not configured on this function.`);
  }

  const model = Deno.env.get(definition.modelEnv) || definition.defaultModel;
  return { name, definition, apiKey, model };
}

export async function callAiProvider(userTurn: string): Promise<CopilotToolOutput> {
  const { definition, apiKey, model } = resolveProviderDefinition();
  return definition.call(userTurn, { apiKey, model });
}

// The on-demand "Publish Achievement" button's generation call — same
// provider/key/model resolution as callAiProvider above, different tool
// contract (see achievementDraft.ts).
export async function callAiProviderForAchievementDraft(
  userTurn: string,
): Promise<AchievementDraftToolOutput> {
  const { definition, apiKey, model } = resolveProviderDefinition();
  return definition.callAchievementDraft(userTurn, { apiKey, model });
}
