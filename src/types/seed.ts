export type SeedStage = "Idea" | "Planning" | "Building" | "Scaling";

// Where a Seed came from. Only "manual" is actually creatable today (via
// /seed/new) — "github"/"imported"/"generated" are structured in now so a
// future repository-import feature has a field to write into without a
// data-model migration. No import logic exists yet.
export type SeedSourceType = "manual" | "github" | "imported" | "generated";

// Independent of SeedStage above — stage is "what phase of building is
// this" (a candidate-chosen label shown as a pill), lifecycle is "is this
// project still open" (a small explicit state machine). A Seed can be
// Stage=Building/Lifecycle=in_progress, or Stage=Scaling/Lifecycle=
// completed — the two never imply each other. Only ever changes via
// state/seedStore.ts's completeSeed/reopenSeed/archiveSeed/unarchiveSeed,
// all deliberate candidate actions — never inferred from AI messages,
// achievement count, or the (currently unused) progress field.
export type LifecycleStatus = "in_progress" | "completed" | "archived";

// Raw form input from /seed/new, before it becomes a real Seed record.
export interface DraftSeedInput {
  name: string;
  goal: string;
  stage: SeedStage;
  technologies: string;
  description: string;
}

export interface Seed {
  id: string;
  userId: string;
  title: string;
  description: string;
  sourceType: SeedSourceType;
  status: string;
  // Comma-separated input from /seed/new, parsed into a searchable list —
  // also the default source for a new achievement's technologies_used
  // pre-fill (see services/ai/localAssistant.ts).
  technologies: string[];
  createdAt: string;
  updatedAt: string;
  progress: number;
  // Publishing is intentional and happens in the Seed Workspace, never
  // automatically — the Grove only ever reads these two fields, it never
  // sets them. See state/seedStore.ts's setSeedPublished.
  isPublished: boolean;
  publishedAt: string | null;
  lifecycleStatus: LifecycleStatus;
  completedAt: string | null;
  // Shown on the Grove Projects card when set — editable from the Seed
  // Workspace, independent of publish state (a candidate can fill these
  // in before ever publishing).
  repoUrl: string;
  demoUrl: string;
}

export interface SeedActivityItem {
  id: string;
  seedId: string;
  type: string;
  content: string;
  createdAt: string;
}

// Suggested achievement types. "achievement" itself was deliberately
// dropped from this list — the record itself is now called an Achievement,
// so a type value of "achievement" would be redundant; "award" covers that
// case (a certification/recognition that isn't tied to a concrete
// project/milestone/deliverable).
export const ACHIEVEMENT_TYPES = [
  "project",
  "milestone",
  "code",
  "dashboard",
  "document",
  "certification",
  "deployment",
  "research",
  "presentation",
  "award",
] as const;
export type AchievementType = (typeof ACHIEVEMENT_TYPES)[number];

export type AchievementVisibility = "private" | "published";

// The candidate-reviewed, structured record — what the AI merely suggests
// (see services/ai/types.ts's EvidenceSuggestion) becomes this only once
// the candidate saves it via the Save-as-Achievement review form. This is
// the local (camelCase) shape, stored in the same per-user localStorage
// blob as everything else in this file. Publishing copies the same fields,
// snake_cased, into Postgres — see types/grove.ts's PublishedAchievement
// and state/achievements.ts, which is the only thing that ever writes
// there, keeping this record and its published counterpart from diverging.
export interface Achievement {
  id: string; // a real UUID (crypto.randomUUID()) — doubles as the
  // grove_achievements primary key once published, so publishing never
  // needs a second, separately-tracked id.
  seedId: string;
  title: string;
  shortDescription: string;
  achievementType: AchievementType;
  skillsDemonstrated: string[];
  technologiesUsed: string[];
  projectDomain: string;
  candidateContribution: string;
  outcomeOrImpact: string;
  proofUrl: string | null;
  proofLabel: string | null;
  relevantRoles: string[];
  visibility: AchievementVisibility;
  // Reserved for future verification (e.g. a recruiter or peer confirming
  // the claim) — nothing sets or reads this yet.
  verificationStatus: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface SeedConversationMessage {
  id: string;
  seedId: string;
  role: "user" | "ai";
  content: string;
  createdAt: string;
}
