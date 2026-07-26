import type { CopilotIntent, MemorySourceType } from "./types.ts";

// Ported from src/services/ai/localAssistant.ts's classifyIntent — same
// regexes, same precedence order. Classifying before calling Claude (rather
// than asking Claude to classify) keeps retrieval-scoping deterministic,
// fast, and free of an extra model round trip.
const DEBUG_RE =
  /\b(error|exception|traceback|bug|stuck|not working|doesn'?t work|fails?|crash(es|ing)?|mismatch)\b/i;
const RESULT_RE =
  /(\d{1,3}(\.\d+)?)\s*%.*(\d{1,3}(\.\d+)?)\s*%|from\s+\d.*to\s+\d|\b(improved|increased|decreased)\b/i;
const DECISION_RE = /\b(chose|selected|decided|picked|went with|settled on)\b/i;
const CODE_RE = /\b(code|script|snippet|starter file|implementation)\b/i;
const PLAN_RE =
  /\b(project plan|create a plan|make a plan|roadmap|game plan|get started|where (do|should) i start|next step|outline the steps|architecture|design the system)\b/i;
const IDEAS_RE = /\bideas?\b|\bbrainstorm\b/i;
const EXPLAIN_RE =
  /\b(what is|what'?s|why (does|is|do)|how does|explain|purpose of|difference between|how do i (choose|pick|select|decide)|what does .* mean)\b/i;
const PROGRESS_RE =
  /\b(i|we) (finished|completed|did|implemented|built|wrote|added|fixed|started|worked on|working on)\b/i;

export function classifyIntent(message: string): CopilotIntent {
  const text = message.trim();
  if (!text) return "general_question";

  if (DEBUG_RE.test(text)) return "asking_for_debugging";
  if (RESULT_RE.test(text)) return "reporting_result";
  if (DECISION_RE.test(text)) return "reporting_decision";
  if (CODE_RE.test(text)) return "asking_for_code";
  if (PLAN_RE.test(text)) return "asking_for_plan";
  if (IDEAS_RE.test(text)) return "asking_for_ideas";
  if (EXPLAIN_RE.test(text)) return "asking_for_explanation";
  if (PROGRESS_RE.test(text)) return "reporting_progress";
  return "general_question";
}

// These two source types are foundational to a Seed regardless of what's
// being asked right now — e.g. "how should I clean the dataset?" needs the
// dataset memory even though its intent is asking_for_plan, not "dataset".
// Always pulled in (subject to the overall retrieval cap), everything else
// is scoped by the classified intent below.
const ALWAYS_RELEVANT: MemorySourceType[] = ["project_goal", "dataset"];

const INTENT_SOURCE_TYPES: Record<CopilotIntent, MemorySourceType[]> = {
  asking_for_ideas: ["architecture_decision", "project_note"],
  asking_for_plan: ["architecture_decision", "milestone", "technical_decision"],
  asking_for_explanation: ["technical_decision", "architecture_decision"],
  asking_for_code: ["architecture_decision", "technical_decision"],
  asking_for_debugging: ["technical_decision", "project_note"],
  reporting_progress: ["milestone", "architecture_decision"],
  reporting_result: ["measurable_result", "technical_decision"],
  reporting_decision: ["architecture_decision", "technical_decision"],
  general_question: ["project_note", "user_preference"],
};

// The full set of source_types worth retrieving for this message, in
// priority order (foundational types first). memory.ts caps the actual
// row count — this only decides which types are eligible.
export function relevantSourceTypes(intent: CopilotIntent): MemorySourceType[] {
  const fromIntent = INTENT_SOURCE_TYPES[intent];
  return [...new Set([...ALWAYS_RELEVANT, ...fromIntent, "user_preference"])];
}
