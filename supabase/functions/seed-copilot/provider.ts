import { callClaude, CLAUDE_DEFAULT_MODEL } from "./claude.ts";
import { callGroq, GROQ_DEFAULT_MODEL } from "./groq.ts";
import type { CopilotToolOutput, ProviderCallFn } from "./types.ts";

interface ProviderDefinition {
  apiKeyEnv: string;
  modelEnv: string;
  defaultModel: string;
  call: ProviderCallFn;
}

// The entire extension point for adding a new AI provider (Gemini, OpenAI,
// ...): write one call<Provider>() function matching ProviderCallFn in its
// own file (see claude.ts/groq.ts), then add one entry here. index.ts,
// memory.ts, intent.ts, prompt.ts, and the frontend never need to change —
// none of them know a provider registry exists.
const PROVIDERS: Record<string, ProviderDefinition> = {
  groq: {
    apiKeyEnv: "GROQ_API_KEY",
    modelEnv: "GROQ_MODEL",
    defaultModel: GROQ_DEFAULT_MODEL,
    call: callGroq,
  },
  anthropic: {
    apiKeyEnv: "ANTHROPIC_API_KEY",
    modelEnv: "ANTHROPIC_MODEL",
    defaultModel: CLAUDE_DEFAULT_MODEL,
    call: callClaude,
  },
};

// Groq is the active default (no Anthropic credit currently available —
// see project history). Anthropic stays fully intact and selectable by
// setting AI_PROVIDER=anthropic as a Supabase secret; nothing was deleted.
const DEFAULT_PROVIDER = "groq";

export function resolveProviderName(): string {
  return Deno.env.get("AI_PROVIDER") || DEFAULT_PROVIDER;
}

export async function callAiProvider(userTurn: string): Promise<CopilotToolOutput> {
  const providerName = resolveProviderName();
  const definition = PROVIDERS[providerName];
  if (!definition) {
    throw new Error(
      `Unknown AI_PROVIDER "${providerName}". Supported: ${Object.keys(PROVIDERS).join(", ")}.`,
    );
  }

  const apiKey = Deno.env.get(definition.apiKeyEnv);
  if (!apiKey) {
    throw new Error(`${definition.apiKeyEnv} is not configured on this function.`);
  }

  const model = Deno.env.get(definition.modelEnv) || definition.defaultModel;
  return definition.call(userTurn, { apiKey, model });
}
