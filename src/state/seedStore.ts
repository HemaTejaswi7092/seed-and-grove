import { detectSeedDomain } from "../lib/seedDomain";
import type {
  Achievement,
  AchievementType,
  AchievementVisibility,
  DraftSeedInput,
  Seed,
  SeedActivityItem,
  SeedConversationMessage,
  SeedStage,
} from "../types/seed";

// Temporary local persistence layer — Seeds and their achievements aren't
// in Supabase yet (see task scope). The one exception is PUBLISHED
// achievements: once a candidate publishes one, state/achievements.ts also
// writes a copy into the grove_achievements Postgres table (see that file
// and supabase/grove_achievements.sql) — this file only ever manages the
// local mirror. Everything here is keyed per authenticated userId, so
// different accounts signing in on the same browser never see each
// other's Seeds, and every record carries its own id so nothing is ever
// shared globally across workspaces. This is the ONLY place local Seed
// data is read from or written to — no component should reach into
// localStorage itself.

interface UserSeedData {
  seeds: Seed[];
  activity: SeedActivityItem[];
  achievements: Achievement[];
  messages: SeedConversationMessage[];
}

const EMPTY_DATA: UserSeedData = {
  seeds: [],
  activity: [],
  achievements: [],
  messages: [],
};

const stageToStatus: Record<SeedStage, string> = {
  Idea: "Just Started",
  Planning: "Planning",
  Building: "Currently Building",
  Scaling: "Scaling",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function storageKey(userId: string): string {
  return `seedAndGroveSeedData:${userId}`;
}

// --- Backfill ---------------------------------------------------------------
// Every field added to Seed/Achievement after their first release lands
// here, so records created before that field existed still load correctly
// instead of rendering `undefined`. Runs on every load() — cheap for the
// data sizes this app deals with, and keeps the schema evolution entirely
// inside this file rather than scattered across every reader.

function backfillSeed(seed: Seed): Seed {
  return {
    ...seed,
    technologies: seed.technologies ?? [],
    lifecycleStatus: seed.lifecycleStatus ?? "in_progress",
    completedAt: seed.completedAt ?? null,
  };
}

function backfillAchievement(achievement: Achievement): Achievement {
  // Achievement ids must be real UUIDs — they double as the
  // grove_achievements primary key once published (see state/achievements.ts).
  // Older records used a "evidence-<ts>-<rand>" id, which isn't valid there,
  // so it's replaced once, here, before anything ever tries to publish it.
  const id = UUID_RE.test(achievement.id) ? achievement.id : crypto.randomUUID();
  return {
    ...achievement,
    id,
    shortDescription: achievement.shortDescription ?? "",
    achievementType: achievement.achievementType ?? "milestone",
    skillsDemonstrated: achievement.skillsDemonstrated ?? [],
    technologiesUsed: achievement.technologiesUsed ?? [],
    projectDomain: achievement.projectDomain ?? "",
    candidateContribution: achievement.candidateContribution ?? "",
    outcomeOrImpact: achievement.outcomeOrImpact ?? "",
    proofUrl: achievement.proofUrl ?? null,
    proofLabel: achievement.proofLabel ?? null,
    relevantRoles: achievement.relevantRoles ?? [],
    verificationStatus: achievement.verificationStatus ?? null,
    updatedAt: achievement.updatedAt ?? achievement.createdAt,
  };
}

function load(userId: string): UserSeedData {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { ...EMPTY_DATA };
    const parsed = JSON.parse(raw) as Partial<UserSeedData> & {
      // Pre-Achievement-model field name — read once for migration, never
      // written again (see the "achievements" key below).
      evidence?: Achievement[];
    };
    return {
      seeds: (parsed.seeds ?? []).map(backfillSeed),
      activity: parsed.activity ?? [],
      achievements: (parsed.achievements ?? parsed.evidence ?? []).map(
        backfillAchievement,
      ),
      messages: parsed.messages ?? [],
    };
  } catch {
    return { ...EMPTY_DATA };
  }
}

function save(userId: string, data: UserSeedData): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(data));
  } catch {
    // localStorage unavailable — Seeds just won't persist across reloads.
  }
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function welcomeMessageFor(seed: Seed): SeedConversationMessage {
  const isKnn = detectSeedDomain(seed) === "knn";
  const content = isKnn
    ? `Your "${seed.title}" Seed is ready. I can help you plan the project, write the implementation, understand KNN, debug errors, and evaluate the model. What would you like to begin with?`
    : `Your "${seed.title}" Seed is ready. Tell me what you're planning to build, what you've completed so far, or where you need help.`;
  return {
    id: generateId("msg"),
    seedId: seed.id,
    role: "ai",
    content,
    createdAt: seed.createdAt,
  };
}

function parseCommaList(text: string): string[] {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

// --- Legacy migration -----------------------------------------------------
// An earlier version of this feature stored a single, unnamed "draft" Seed
// per user in sessionStorage (no id, no isolation from other Seeds). If one
// exists and this user has no Seeds in the real store yet, convert it into
// a proper, isolated Seed record once, then remove the legacy entry.
function legacyDraftKey(userId: string): string {
  return `seedAndGroveDraftSeed:${userId}`;
}

function migrateLegacyDraft(userId: string): Seed | null {
  try {
    const raw = sessionStorage.getItem(legacyDraftKey(userId));
    if (!raw) return null;
    const legacy = JSON.parse(raw) as DraftSeedInput;
    sessionStorage.removeItem(legacyDraftKey(userId));
    return createSeedRecord(userId, {
      title: legacy.name?.trim() || "Untitled Seed",
      description: legacy.description?.trim() || legacy.goal?.trim() || "",
      sourceType: "manual",
      status: stageToStatus[legacy.stage] ?? "Just Started",
      technologies: parseCommaList(legacy.technologies ?? ""),
    });
  } catch {
    return null;
  }
}

// --- Reads ------------------------------------------------------------------

export function listSeeds(userId: string): Seed[] {
  const data = load(userId);
  if (data.seeds.length === 0) {
    const migrated = migrateLegacyDraft(userId);
    if (migrated) return [migrated];
  }
  return data.seeds;
}

// Ownership is enforced here: a lookup only ever returns a Seed that lives
// in *this* userId's own storage bucket. A missing or foreign seedId both
// simply resolve to null — the caller can't tell the difference, which is
// the point (no leaking whether a Seed exists for someone else).
export function getSeed(userId: string, seedId: string): Seed | null {
  return listSeeds(userId).find((seed) => seed.id === seedId) ?? null;
}

export function getSeedActivity(
  userId: string,
  seedId: string,
): SeedActivityItem[] {
  return load(userId).activity.filter((item) => item.seedId === seedId);
}

export function getSeedAchievements(
  userId: string,
  seedId: string,
): Achievement[] {
  return load(userId).achievements.filter((item) => item.seedId === seedId);
}

export function getAchievement(
  userId: string,
  achievementId: string,
): Achievement | null {
  return (
    load(userId).achievements.find((item) => item.id === achievementId) ??
    null
  );
}

export function getSeedMessages(
  userId: string,
  seedId: string,
): SeedConversationMessage[] {
  return load(userId).messages.filter((item) => item.seedId === seedId);
}

// --- Writes -----------------------------------------------------------------

function createSeedRecord(
  userId: string,
  input: {
    title: string;
    description: string;
    sourceType: Seed["sourceType"];
    status: string;
    technologies: string[];
  },
): Seed {
  const data = load(userId);
  const now = new Date().toISOString();
  const seed: Seed = {
    id: generateId("seed"),
    userId,
    title: input.title,
    description: input.description,
    sourceType: input.sourceType,
    status: input.status,
    technologies: input.technologies,
    createdAt: now,
    updatedAt: now,
    // No defined setup-completion rule exists yet, so a brand-new Seed
    // always starts at 0% — never inherited or estimated.
    progress: 0,
    // Never published on creation — publishing is a deliberate, separate
    // act from the Seed Workspace (see setSeedPublished below).
    isPublished: false,
    publishedAt: null,
    lifecycleStatus: "in_progress",
    completedAt: null,
  };
  data.seeds.push(seed);
  data.messages.push(welcomeMessageFor(seed));
  save(userId, data);
  return seed;
}

export function createSeed(userId: string, draft: DraftSeedInput): Seed {
  return createSeedRecord(userId, {
    title: draft.name.trim() || "Untitled Seed",
    description: draft.description.trim() || draft.goal.trim(),
    sourceType: "manual",
    status: stageToStatus[draft.stage],
    technologies: parseCommaList(draft.technologies),
  });
}

export function addSeedMessage(
  userId: string,
  seedId: string,
  role: "user" | "ai",
  content: string,
): SeedConversationMessage {
  const data = load(userId);
  const message: SeedConversationMessage = {
    id: generateId("msg"),
    seedId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
  data.messages.push(message);
  save(userId, data);
  return message;
}

export function addSeedActivity(
  userId: string,
  seedId: string,
  type: string,
  content: string,
): SeedActivityItem {
  const data = load(userId);
  const item: SeedActivityItem = {
    id: generateId("activity"),
    seedId,
    type,
    content,
    createdAt: new Date().toISOString(),
  };
  data.activity.push(item);
  save(userId, data);
  return item;
}

// --- Achievements (local half — see state/achievements.ts for the public,
// Postgres-synchronizing API that wraps these) --------------------------

export interface CreateAchievementInput {
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
}

export type UpdateAchievementInput = Partial<CreateAchievementInput>;

// Always callable directly (never auto-published) — the candidate decides
// visibility right in the same review form, defaulting to "private" unless
// they explicitly chose otherwise. See services/ai/types.ts's
// EvidenceSuggestion for what the AI merely *suggests* before this point.
export function createSeedAchievement(
  userId: string,
  seedId: string,
  input: CreateAchievementInput,
): Achievement {
  const data = load(userId);
  const now = new Date().toISOString();
  const achievement: Achievement = {
    id: crypto.randomUUID(),
    seedId,
    title: input.title,
    shortDescription: input.shortDescription,
    achievementType: input.achievementType,
    skillsDemonstrated: input.skillsDemonstrated,
    technologiesUsed: input.technologiesUsed,
    projectDomain: input.projectDomain,
    candidateContribution: input.candidateContribution,
    outcomeOrImpact: input.outcomeOrImpact,
    proofUrl: input.proofUrl,
    proofLabel: input.proofLabel,
    relevantRoles: input.relevantRoles,
    visibility: input.visibility,
    verificationStatus: null,
    createdAt: now,
    updatedAt: now,
    publishedAt: input.visibility === "published" ? now : null,
  };
  data.achievements.push(achievement);
  save(userId, data);
  return achievement;
}

// The only local mutator for an existing achievement — publishedAt is kept
// consistent with visibility here so every other reader can trust it
// without re-deriving anything. state/achievements.ts calls this, then
// separately keeps grove_achievements in sync; this function itself never
// touches Postgres.
export function updateSeedAchievement(
  userId: string,
  achievementId: string,
  patch: UpdateAchievementInput,
): Achievement | null {
  const data = load(userId);
  const achievement = data.achievements.find(
    (item) => item.id === achievementId,
  );
  if (!achievement) return null;

  const wasPublished = achievement.visibility === "published";
  Object.assign(achievement, patch);
  const nowPublished = achievement.visibility === "published";

  const now = new Date().toISOString();
  achievement.updatedAt = now;
  if (nowPublished && !wasPublished) achievement.publishedAt = now;
  if (!nowPublished) achievement.publishedAt = null;

  save(userId, data);
  return achievement;
}

export function deleteSeedAchievement(
  userId: string,
  achievementId: string,
): boolean {
  const data = load(userId);
  const index = data.achievements.findIndex(
    (item) => item.id === achievementId,
  );
  if (index === -1) return false;
  data.achievements.splice(index, 1);
  save(userId, data);
  return true;
}

// --- Publishing (Seed Workspace territory) -----------------------------
// The Grove is a read-only presentation layer over these two flags — it
// never sets them itself. These setters exist for the Seed Workspace /
// achievement panel to call once that UI is built; nothing wires them up yet.

export function setSeedPublished(
  userId: string,
  seedId: string,
  isPublished: boolean,
): Seed | null {
  const data = load(userId);
  const seed = data.seeds.find((item) => item.id === seedId);
  if (!seed) return null;
  const now = new Date().toISOString();
  seed.isPublished = isPublished;
  seed.publishedAt = isPublished ? now : null;
  seed.updatedAt = now;
  save(userId, data);
  return seed;
}

export function getPublishedSeeds(userId: string): Seed[] {
  return listSeeds(userId).filter((seed) => seed.isPublished);
}

// --- Project lifecycle ------------------------------------------------
// Four explicit, candidate-triggered transitions — nothing here is ever
// called automatically from AI messages, achievement counts, or the
// (currently unused) progress field. The Seed Workspace's "Mark Project as
// Complete" button calls completeSeed only after the candidate confirms
// the review checklist; "Reopen Project" and the Archive/Unarchive
// overflow action call the other three directly.

export function completeSeed(userId: string, seedId: string): Seed | null {
  const data = load(userId);
  const seed = data.seeds.find((item) => item.id === seedId);
  if (!seed) return null;
  const now = new Date().toISOString();
  seed.lifecycleStatus = "completed";
  seed.completedAt = now;
  seed.updatedAt = now;
  save(userId, data);
  return seed;
}

export function reopenSeed(userId: string, seedId: string): Seed | null {
  const data = load(userId);
  const seed = data.seeds.find((item) => item.id === seedId);
  if (!seed) return null;
  seed.lifecycleStatus = "in_progress";
  seed.completedAt = null;
  seed.updatedAt = new Date().toISOString();
  save(userId, data);
  return seed;
}

export function archiveSeed(userId: string, seedId: string): Seed | null {
  const data = load(userId);
  const seed = data.seeds.find((item) => item.id === seedId);
  if (!seed) return null;
  seed.lifecycleStatus = "archived";
  seed.updatedAt = new Date().toISOString();
  save(userId, data);
  return seed;
}

// Always returns to "in_progress" — this is a flat three-state enum (see
// LifecycleStatus), so unarchiving can't distinguish "was completed before
// archiving" from "was in progress"; re-completing is one click away via
// Mark Project as Complete if that's the case.
export function unarchiveSeed(userId: string, seedId: string): Seed | null {
  const data = load(userId);
  const seed = data.seeds.find((item) => item.id === seedId);
  if (!seed) return null;
  seed.lifecycleStatus = "in_progress";
  seed.updatedAt = new Date().toISOString();
  save(userId, data);
  return seed;
}
