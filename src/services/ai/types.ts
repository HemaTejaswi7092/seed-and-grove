import type {
  Achievement,
  Seed,
  SeedActivityItem,
  SeedConversationMessage,
} from "../../types/seed";

export interface CopilotUserContext {
  id: string | null;
  displayName: string | null;
}

export interface CopilotRequest {
  user: CopilotUserContext;
  seed: Seed;
  recentMessages: SeedConversationMessage[];
  activity: SeedActivityItem[];
  achievements: Achievement[];
  message: string;
}

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

// What the AI notices mid-conversation — never itself a saved record. The
// candidate always reviews this in the Save-as-Achievement form before
// anything is written (see components/workspace/AchievementReviewModal.tsx
// and state/achievements.ts); "evidence" naming stays here deliberately,
// since at this stage it's an unreviewed signal, not yet an Achievement.
// Only category/title/description are ever guaranteed — everything else
// is a best-effort pre-fill the candidate can freely edit or clear.
export interface EvidenceSuggestion {
  category: string;
  title: string;
  description: string;
  skillsDemonstrated?: string[];
  technologiesUsed?: string[];
  projectDomain?: string;
  relevantRoles?: string[];
  candidateContribution?: string;
  outcomeOrImpact?: string;
}

// What the Edge Function retrieved from copilot_memory (or, for the local
// assistant, always empty) to produce this reply — surfaced behind
// CopilotChat's "Why this answer?" disclosure. Session-only: not persisted
// alongside the message in seedStore, so it won't survive a page refresh.
export interface RetrievedContextItem {
  sourceType: string;
  sourceId: string | null;
  label: string;
}

export interface CopilotResponse {
  content: string;
  intent: CopilotIntent;
  // Present only when the message is a strong, specific evidence candidate
  // (see localAssistant.ts's assessEvidence, or the Edge Function's forced
  // tool schema in "api" mode). Never fabricated — always derived from
  // what the user actually wrote, and never auto-published: CopilotChat.tsx
  // requires the user to confirm before it's written to the Seed's record.
  evidenceSuggestion?: EvidenceSuggestion;
  // Present when the message reports real work that isn't specific enough
  // to be evidence on its own, but is still worth logging as activity.
  activityContent?: string;
  // "api" mode only — see above.
  retrievedContext?: RetrievedContextItem[];
}
