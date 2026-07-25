import type {
  Seed,
  SeedActivityItem,
  SeedEvidenceItem,
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
  evidence: SeedEvidenceItem[];
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

export interface EvidenceSuggestion {
  category: string;
  title: string;
  description: string;
}

export interface CopilotResponse {
  content: string;
  intent: CopilotIntent;
  // Present only when the message is a strong, specific evidence candidate
  // (see localAssistant.ts's assessEvidence). Never fabricated — always
  // derived from what the user actually wrote.
  evidenceSuggestion?: EvidenceSuggestion;
  // Present when the message reports real work that isn't specific enough
  // to be evidence on its own, but is still worth logging as activity.
  activityContent?: string;
}
