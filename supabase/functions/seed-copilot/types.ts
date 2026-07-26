// Mirrors src/services/ai/types.ts's CopilotIntent by value (kept as a
// separate copy, not a shared import — see index.ts's top comment for why
// Edge Functions here stay self-contained rather than reaching into src/).
// If you add an intent on one side, add it on the other.
export type CopilotIntent =
  | "asking_for_ideas"
  | "asking_for_plan"
  | "asking_for_explanation"
  | "asking_for_code"
  | "asking_for_debugging"
  | "reporting_progress"
  | "reporting_result"
  | "reporting_decision"
  | "general_question";

// Must match the source_type check constraint in supabase/copilot_memory.sql.
export type MemorySourceType =
  | "project_goal"
  | "dataset"
  | "architecture_decision"
  | "technical_decision"
  | "milestone"
  | "measurable_result"
  | "user_preference"
  | "project_note";

export interface MemoryRow {
  id: string;
  seed_id: string | null;
  source_type: MemorySourceType;
  source_id: string | null;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ChatTurn {
  role: "user" | "ai";
  content: string;
}

export interface ActivityInput {
  type: string;
  content: string;
}

export interface EvidenceInput {
  category: string;
  title: string;
  description: string;
}

export interface SeedContext {
  title: string;
  description: string;
  status: string;
  progress: number;
}

// Request body sent by src/services/ai/aiClient.ts.
export interface CopilotRequestBody {
  seedId: string;
  seedContext: SeedContext;
  message: string;
  recentMessages: ChatTurn[];
  activity: ActivityInput[];
  evidence: EvidenceInput[];
}

export interface RetrievedContextItem {
  sourceType: MemorySourceType;
  sourceId: string | null;
  label: string;
}

export interface EvidenceCandidate {
  title: string;
  summary: string;
  category: string;
  confidence: "low" | "medium" | "high";
  // Best-effort pre-fill for the candidate's Save-as-Achievement review
  // form (see src/services/ai/types.ts's EvidenceSuggestion, which this
  // maps onto 1:1) — the model omits any of these it isn't confident
  // about, and the candidate edits everything before anything is saved.
  skillsDemonstrated?: string[];
  technologiesUsed?: string[];
  projectDomain?: string;
  relevantRoles?: string[];
  candidateContribution?: string;
  outcomeOrImpact?: string;
}

export interface MemoryCandidate {
  sourceType: MemorySourceType;
  content: string;
}

// What every provider's forced structured-output call must return —
// provider-agnostic, see toolSchema.ts for the JSON schema each provider
// wraps in its own wire format (claude.ts, groq.ts, ...).
export interface CopilotToolOutput {
  message: string;
  memoryCandidate?: MemoryCandidate;
  evidenceCandidate?: EvidenceCandidate;
}

// What provider.ts resolves before calling a provider — the model name is
// decided centrally (env override or that provider's default), so
// individual provider modules never read Deno.env themselves and stay
// trivially swappable/testable.
export interface ProviderCallConfig {
  apiKey: string;
  model: string;
}

// The shape every provider module (claude.ts, groq.ts, a future
// gemini.ts/openai.ts, ...) must implement. Adding a new provider is:
// write one function matching this signature, register it in provider.ts.
// Nothing else in the app — index.ts, memory.ts, intent.ts, prompt.ts, the
// frontend — needs to change.
export type ProviderCallFn = (
  userTurn: string,
  config: ProviderCallConfig,
) => Promise<CopilotToolOutput>;

// What this function returns to the frontend.
export interface CopilotResponseBody {
  message: string;
  intent: CopilotIntent;
  retrievedContext: RetrievedContextItem[];
  evidenceCandidate?: EvidenceCandidate;
  activityContent?: string;
  // Informational only — lets the caller see what got persisted, useful
  // for debugging. Never a signal the frontend needs to act on.
  memorySaved?: MemoryCandidate;
}
