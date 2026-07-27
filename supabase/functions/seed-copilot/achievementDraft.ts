import type { ActivityInput, ChatTurn, EvidenceInput, SeedContext } from "./types.ts";

// Fires automatically when a candidate marks a Seed complete (see
// Seed.tsx's handleConfirmComplete) — never something the candidate has
// to discover through chat. Given everything already known about this
// Seed, produce 0–3 credible, distinct achievement suggestions for the
// candidate to review. This is a different tool contract from the chat
// flow's COPILOT_RESPONSE_SCHEMA (toolSchema.ts) — there's no `message`
// to reply with, no memoryCandidate, and `suggestions` (possibly empty)
// plus `reason` are always required so "nothing new to suggest" is a
// normal, legible result rather than an empty/ambiguous response.
//
// Completion and suggestion generation are deliberately two separate
// actions server-side too: this module has no awareness of Seed
// lifecycle state at all, and Seed.tsx always marks the Seed complete
// first, independently, before ever calling this — a failure here never
// undoes or blocks that.

export const ACHIEVEMENT_DRAFT_TOOL_NAME = "provide_achievement_suggestions";

export const ACHIEVEMENT_DRAFT_TOOL_DESCRIPTION =
  "Produce 0 to 3 credible, distinct achievement suggestions from this completed Seed's context, none of them duplicating what's already logged.";

// Reused verbatim from toolSchema.ts's evidenceCandidate field
// descriptions — same extraction-quality rules apply whether an
// achievement is proposed mid-chat or suggested on project completion;
// keep these two in sync by hand if either changes.
const SUGGESTION_ITEM_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    category: { type: "string" },
    skillsDemonstrated: {
      type: "array",
      items: { type: "string" },
      description: "Specific skills this work demonstrates, e.g. [\"SQL\", \"Data Modeling\"]. Omit if unclear.",
    },
    technologiesUsed: {
      type: "array",
      items: { type: "string" },
      description:
        "Specific technologies/tools/libraries used, e.g. [\"PostgreSQL\", \"Power BI\"]. Only technologies explicitly named in the context — never infer or add one you'd merely expect them to have used. Omit entirely if none were named.",
    },
    projectDomain: {
      type: "string",
      description: "A short label for the problem domain, e.g. \"Computer Vision\" or \"E-commerce Analytics\". Omit if unclear.",
    },
    relevantRoles: {
      type: "array",
      items: { type: "string" },
      description: "Professional roles this achievement is relevant evidence for, e.g. [\"Data Analyst\", \"BI Developer\"]. Omit if unclear.",
    },
    candidateContribution: {
      type: "string",
      description:
        "What specifically the candidate did, in their own words from the context — not a generic restatement. Always populate this whenever the context states what they personally did, even a single first-person clause.",
    },
    outcomeOrImpact: {
      type: "string",
      description:
        "The measurable or observed result, ONLY if the context states one — quote it as given. Preserve exact figures (e.g. \"800ms to 120ms\", \"15%\") rather than computing a derived difference. Never infer or add an impact/benefit that wasn't stated — omit this field entirely rather than guess.",
    },
  },
  required: ["title", "summary", "category"],
};

export const ACHIEVEMENT_DRAFT_SCHEMA = {
  type: "object",
  properties: {
    reason: {
      type: "string",
      description:
        "One short sentence explaining why suggestions is empty (e.g. \"nothing completed yet beyond what's already logged\"). Leave empty whenever suggestions has at least one item.",
    },
    suggestions: {
      type: "array",
      maxItems: 3,
      description:
        "0 to 3 credible achievement drafts, each describing genuinely DIFFERENT completed work — never two suggestions for the same piece of work, and never anything that duplicates or nearly duplicates an achievement already logged for this Seed (see \"Already-logged achievements\" below, which includes both published and private/draft entries). Extract every field conservatively — never a best-effort guess at facts the context doesn't state. Empty array if there's nothing genuinely new and demonstrable.",
      items: SUGGESTION_ITEM_SCHEMA,
    },
  },
  required: ["reason", "suggestions"],
};

export const ACHIEVEMENT_DRAFT_SYSTEM_PROMPT = `You are reviewing a Seed's full context on behalf of the candidate, right after they marked it complete. Your only job is to surface 0 to 3 genuine, demonstrable achievements from it for their review — you are not chatting, and there is no reply to write.

Suggest an achievement only when the context shows: something built or completed, a meaningful technical decision that was implemented, a measurable result or improvement, a significant problem that was solved, a major project milestone reached, or a working artifact produced (dashboard, model, deployment, document, certification, presentation, research result, or award) — and the candidate's own contribution is clearly demonstrated, not just mentioned in passing. Certifications and awards qualify exactly like a completed technical artifact.

Do not suggest anything for a Seed that's still just an idea or plan, an unresolved error with no completed fix, a generic learning statement, vague progress with no concrete output, or work primarily done by someone else.

A strong suggestion usually has at least two of: the candidate's action or contribution, the method or technology used, a completed output, a measurable result or impact, or supporting proof. If the context only weakly reports one of these, leave it out rather than guessing.

Compare every candidate suggestion against BOTH the logged evidence below AND your own other suggestions in this same response — never suggest something that duplicates or nearly duplicates an existing logged achievement (published or private/draft, no distinction), and never produce two suggestions describing the same underlying work from slightly different angles. Each suggestion in your list must be genuinely distinct completed work. If there's truly only one real achievement in the context, return exactly one — don't pad the list to reach a target count.

When you do suggest one, extract every field conservatively — never infer a technology, tool, or platform that wasn't named. Never infer or add an outcome, benefit, or business impact that wasn't claimed. Preserve every number exactly as given rather than computing a derived difference. Always fill in the candidate's own contribution whenever the context states what they personally did, even in a single first-person clause.

This is always only a suggestion: the candidate reviews, edits, publishes, saves as draft, or dismisses each one individually — nothing is ever saved or published automatically.`;

function formatChatTurn(turn: ChatTurn): string {
  return `${turn.role === "user" ? "User" : "Copilot"}: ${turn.content}`;
}

export function buildAchievementDraftUserTurn(input: {
  seedContext: SeedContext;
  recentMessages: ChatTurn[];
  activity: ActivityInput[];
  evidence: EvidenceInput[];
}): string {
  const { seedContext, recentMessages, activity, evidence } = input;

  const historyLines = recentMessages.slice(-20).map(formatChatTurn).join("\n");
  const activityLines = activity.length
    ? activity.map((a) => `- ${a.content}`).join("\n")
    : "(none logged yet)";
  const evidenceLines = evidence.length
    ? evidence.map((e) => `- [${e.category}] ${e.title}: ${e.description}`).join("\n")
    : "(none logged yet)";

  return [
    `Seed: "${seedContext.title}" — just marked complete`,
    `Description: ${seedContext.description || "(none provided)"}`,
    `Status: ${seedContext.status}`,
    `Progress: ${seedContext.progress}%`,
    "",
    "Recent conversation:",
    historyLines || "(no prior messages)",
    "",
    "Logged activity:",
    activityLines,
    "",
    "Already-logged achievements for this Seed (published and private/draft):",
    evidenceLines,
    "",
    "Task: review everything above and surface 0 to 3 genuine, distinct, demonstrable achievements to suggest right now.",
  ].join("\n");
}

export function isValidAchievementDraftOutput(
  value: unknown,
): value is { reason: string; suggestions: unknown[] } {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { reason?: unknown }).reason === "string" &&
    Array.isArray((value as { suggestions?: unknown }).suggestions)
  );
}
