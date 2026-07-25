export type SeedStage = "Idea" | "Planning" | "Building" | "Scaling";

// Where a Seed came from. Only "manual" is actually creatable today (via
// /seed/new) — "github"/"imported"/"generated" are structured in now so a
// future repository-import feature has a field to write into without a
// data-model migration. No import logic exists yet.
export type SeedSourceType = "manual" | "github" | "imported" | "generated";

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
  createdAt: string;
  updatedAt: string;
  progress: number;
  // Publishing is intentional and happens in the Seed Workspace, never
  // automatically — the Grove only ever reads these two fields, it never
  // sets them. See state/seedStore.ts's setSeedPublished.
  isPublished: boolean;
  publishedAt: string | null;
}

export interface SeedActivityItem {
  id: string;
  seedId: string;
  type: string;
  content: string;
  createdAt: string;
}

export interface SeedEvidenceItem {
  id: string;
  seedId: string;
  category: string;
  title: string;
  description: string;
  createdAt: string;
  verified: boolean;
  // Independent of the parent Seed's isPublished flag — publishing a Seed
  // does not itself publish its evidence. Set only from the Seed
  // Workspace's evidence panel, never inferred or defaulted to "public".
  visibility: "private" | "public";
  publishedAt: string | null;
}

export interface SeedConversationMessage {
  id: string;
  seedId: string;
  role: "user" | "ai";
  content: string;
  createdAt: string;
}
