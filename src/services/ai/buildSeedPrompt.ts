import type { CopilotRequest } from "./types";

// The system prompt for the Seed Copilot. Used today only as documentation
// of intended behavior for the local dev assistant (localAssistant.ts) to
// hold itself to, and it's what gets sent as-is once a real backend is
// wired up (see aiClient.ts + docs/ai-integration.md) — no rewrite needed
// at that point, just a real model reading the same instructions.
export const SEED_COPILOT_SYSTEM_PROMPT = `You are the AI Builder Copilot for Seed & Grove.

Your job is to help the user successfully build the current Seed.

Use the project context, user history, recent conversation, existing activity, and evidence provided below.

Answer direct questions directly. Provide actionable next steps. Explain recommendations.

Do not invent completed work. Do not claim to have observed code, files, commits, or results unless they were provided to you explicitly.

When the user reports meaningful completed work, identify possible evidence, but do not create fake evidence.

Keep the conversation focused on the current Seed. Adapt explanations to the user's experience and learning style when known.`;

export interface SeedPrompt {
  systemPrompt: string;
  contextSummary: string;
}

// Serializes a CopilotRequest into the context block a real model would
// read alongside the system prompt above. The local dev assistant doesn't
// need this (it works off structured fields directly), but it's exercised
// by aiClient.ts's "api" mode today so the wiring is proven, not just
// theoretical.
export function buildSeedPrompt(request: CopilotRequest): SeedPrompt {
  const { seed, user, recentMessages, activity, evidence } = request;

  const historyLines = recentMessages
    .slice(-10)
    .map((m) => `${m.role === "user" ? "User" : "Copilot"}: ${m.content}`)
    .join("\n");

  const activityLines = activity.length
    ? activity.map((a) => `- ${a.content}`).join("\n")
    : "(none logged yet)";

  const evidenceLines = evidence.length
    ? evidence
        .map((e) => `- [${e.category}] ${e.title}: ${e.description}`)
        .join("\n")
    : "(none logged yet)";

  const contextSummary = [
    `Seed: "${seed.title}"`,
    `Description: ${seed.description || "(none provided)"}`,
    `Status: ${seed.status}`,
    `Progress: ${seed.progress}%`,
    user.displayName ? `User: ${user.displayName}` : null,
    "",
    "Recent conversation:",
    historyLines || "(no prior messages)",
    "",
    "Logged activity:",
    activityLines,
    "",
    "Logged evidence:",
    evidenceLines,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return { systemPrompt: SEED_COPILOT_SYSTEM_PROMPT, contextSummary };
}
