import type {
  ActivityInput,
  ChatTurn,
  EvidenceInput,
  MemoryRow,
  SeedContext,
} from "./types.ts";

// Deliberately self-contained rather than importing
// src/services/ai/buildSeedPrompt.ts: Deno's import resolution and the
// Vite/browser build are two different module graphs, and reaching across
// that boundary for one string isn't worth the fragility. Keep this in
// sync with buildSeedPrompt.ts's SEED_COPILOT_SYSTEM_PROMPT by hand if
// either changes.
export const SYSTEM_PROMPT = `You are the Seed & Grove AI Builder Copilot.

Your job is to help the authenticated user successfully build the current Seed.

Use the retrieved Seed context, project history, recent conversation, activity, evidence, decisions, and user preferences provided below.

Answer direct questions directly. Give concrete technical guidance. Explain why you recommend something.

Do not repeat generic capability statements unless this is the first message.

Do not claim to have seen code, files, commits, or results unless they are included in the supplied context. Do not invent accomplishments.

When the user reports meaningful completed work, identify a possible evidence candidate, but do not automatically publish it — that always requires the user's confirmation.

Keep the response focused on the current project. Ask at most one useful follow-up question.`;

function formatMemoryRow(row: MemoryRow): string {
  return `- [${row.source_type}] ${row.content}`;
}

export function buildUserTurn(input: {
  seedContext: SeedContext;
  memory: MemoryRow[];
  recentMessages: ChatTurn[];
  activity: ActivityInput[];
  evidence: EvidenceInput[];
  message: string;
}): string {
  const { seedContext, memory, recentMessages, activity, evidence, message } = input;

  const memoryLines = memory.length
    ? memory.map(formatMemoryRow).join("\n")
    : "(no long-term memory retrieved for this message)";

  const historyLines = recentMessages
    .slice(-10)
    .map((m) => `${m.role === "user" ? "User" : "Copilot"}: ${m.content}`)
    .join("\n");

  const activityLines = activity.length
    ? activity.map((a) => `- ${a.content}`).join("\n")
    : "(none logged yet)";

  const evidenceLines = evidence.length
    ? evidence.map((e) => `- [${e.category}] ${e.title}: ${e.description}`).join("\n")
    : "(none logged yet)";

  return [
    `Seed: "${seedContext.title}"`,
    `Description: ${seedContext.description || "(none provided)"}`,
    `Status: ${seedContext.status}`,
    `Progress: ${seedContext.progress}%`,
    "",
    "Retrieved long-term memory for this Seed (durable facts, not chat log):",
    memoryLines,
    "",
    "Recent conversation:",
    historyLines || "(no prior messages)",
    "",
    "Logged activity:",
    activityLines,
    "",
    "Logged evidence:",
    evidenceLines,
    "",
    `Current user message: ${message}`,
  ].join("\n");
}
