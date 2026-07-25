import { buildSeedPrompt } from "./buildSeedPrompt";
import { generateLocalResponse } from "./localAssistant";
import type { CopilotRequest, CopilotResponse } from "./types";

// VITE_AI_MODE=mock (default) uses the local, seed-aware dev assistant.
// VITE_AI_MODE=api routes through a secure backend endpoint instead — see
// docs/ai-integration.md for why that indirection exists and how to wire
// it up. Never call a secret-bearing AI provider directly from the browser.
const AI_MODE = import.meta.env.VITE_AI_MODE ?? "mock";

export function generateCopilotResponse(
  request: CopilotRequest,
): Promise<CopilotResponse> {
  if (AI_MODE === "api") {
    return generateRemoteResponse(request);
  }
  return generateLocalResponse(request);
}

async function generateRemoteResponse(
  request: CopilotRequest,
): Promise<CopilotResponse> {
  const endpoint = import.meta.env.VITE_AI_BACKEND_URL;
  if (!endpoint) {
    throw new Error(
      'VITE_AI_MODE is set to "api" but VITE_AI_BACKEND_URL is not configured. See docs/ai-integration.md.',
    );
  }

  const { systemPrompt, contextSummary } = buildSeedPrompt(request);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemPrompt,
      contextSummary,
      message: request.message,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI backend request failed (${response.status}).`);
  }

  const data: unknown = await response.json();
  if (
    !data ||
    typeof data !== "object" ||
    typeof (data as { content?: unknown }).content !== "string"
  ) {
    throw new Error("AI backend returned an unexpected response shape.");
  }

  const payload = data as Partial<CopilotResponse> & { content: string };
  return {
    content: payload.content,
    intent: payload.intent ?? "general_question",
    evidenceSuggestion: payload.evidenceSuggestion,
    activityContent: payload.activityContent,
  };
}
