import type {
  Achievement,
  AchievementType,
  AchievementVisibility,
  Seed,
  SeedActivityItem,
  SeedConversationMessage,
  TimelineEvent,
  TimelineEventType,
} from "../types/seed";

// Local-only persistence layer — deliberately narrow. The Seed record
// itself now lives in Postgres (see state/seedsStore.ts and
// supabase/seeds.sql) — this file only ever held it as a stopgap before
// that table existed, and every workspace/list read now goes through
// seedsStore.ts instead. What's still genuinely local, by design, and
// stays here: the Copilot chat transcript, the free-form activity log
// (Copilot context, not the Timeline tab), the Timeline tab's own events,
// and DRAFT (unpublished) Achievements — none of these have a Postgres
// home, and a published Achievement's public copy already lives in
// grove_achievements (see state/achievements.ts). Everything here is
// keyed per authenticated userId, so different accounts signing in on the
// same browser never see each other's data, and every record carries its
// own id so nothing is ever shared globally. This is the ONLY place this
// local data is read from or written to — no component should reach into
// localStorage itself.

interface UserSeedData {
  activity: SeedActivityItem[];
  achievements: Achievement[];
  messages: SeedConversationMessage[];
  timeline: TimelineEvent[];
}

const EMPTY_DATA: UserSeedData = {
  activity: [],
  achievements: [],
  messages: [],
  timeline: [],
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function storageKey(userId: string): string {
  return `seedAndGroveSeedData:${userId}`;
}

// --- Backfill ---------------------------------------------------------------
// Every field added to Achievement after its first release lands here, so
// records created before that field existed still load correctly instead
// of rendering `undefined`. Runs on every load() — cheap for the data
// sizes this app deals with, and keeps the schema evolution entirely
// inside this file rather than scattered across every reader.

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
      activity: parsed.activity ?? [],
      achievements: (parsed.achievements ?? parsed.evidence ?? []).map(
        backfillAchievement,
      ),
      messages: parsed.messages ?? [],
      timeline: parsed.timeline ?? [],
    };
  } catch {
    return { ...EMPTY_DATA };
  }
}

function save(userId: string, data: UserSeedData): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(data));
  } catch {
    // localStorage unavailable — this local-only data just won't persist
    // across reloads; the Seed record itself (Postgres) is unaffected.
  }
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function welcomeMessageFor(seed: Seed): SeedConversationMessage {
  return {
    id: generateId("msg"),
    seedId: seed.id,
    role: "ai",
    content: `Your "${seed.title}" Seed is ready. Tell me what you're planning to build, what you've completed so far, or where you need help.`,
    createdAt: seed.createdAt,
  };
}

// --- Reads ------------------------------------------------------------------

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

export function getSeedTimeline(userId: string, seedId: string): TimelineEvent[] {
  return load(userId).timeline.filter((item) => item.seedId === seedId);
}

// --- Writes -----------------------------------------------------------------

// Called once, right after state/seedsStore.ts's createSeed() succeeds
// (see state/seedPublishing.ts's createSeedAndSync) — seeds the welcome
// Copilot message and the "project_created" Timeline event for a
// brand-new Seed. Never called on its own; a Seed with no local record
// yet (e.g. right after being created on another device) simply has no
// welcome message/timeline entries here until this device creates them,
// which is fine — neither is essential workspace data.
export function initializeLocalSeedRecord(seed: Seed): void {
  const data = load(seed.userId);
  data.messages.push(welcomeMessageFor(seed));
  pushTimelineEvent(data, seed.id, "project_created");
  save(seed.userId, data);
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

// Pushes onto an already-`load()`ed data object without its own save() —
// used by initializeLocalSeedRecord above, which is already mid-mutation
// and calls save(userId, data) itself once, afterward. Keeps a
// project-lifecycle event and the write that caused it in the same
// localStorage transaction instead of a separate read/write round-trip.
// See addTimelineEvent below for the standalone version other files
// (state/seedPublishing.ts, state/achievements.ts, CopilotChat.tsx) use.
function pushTimelineEvent(
  data: UserSeedData,
  seedId: string,
  type: TimelineEventType,
  detail?: string,
): TimelineEvent {
  const event: TimelineEvent = {
    id: generateId("timeline"),
    seedId,
    type,
    detail: detail ?? null,
    createdAt: new Date().toISOString(),
  };
  data.timeline.push(event);
  return event;
}

export function addTimelineEvent(
  userId: string,
  seedId: string,
  type: TimelineEventType,
  detail?: string,
): TimelineEvent {
  const data = load(userId);
  const event = pushTimelineEvent(data, seedId, type, detail);
  save(userId, data);
  return event;
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

// Local cleanup only, called when a Seed is deleted (see
// state/seedPublishing.ts's deleteSeedAndSync) — removes this device's
// local activity/messages/timeline/draft-achievements for that seedId.
// Never the only cleanup step: published Achievements and the Seed's own
// grove_seeds/feed_posts rows are Postgres's job, not this file's.
export function clearLocalSeedData(userId: string, seedId: string): void {
  const data = load(userId);
  data.activity = data.activity.filter((item) => item.seedId !== seedId);
  data.achievements = data.achievements.filter((item) => item.seedId !== seedId);
  data.messages = data.messages.filter((item) => item.seedId !== seedId);
  data.timeline = data.timeline.filter((item) => item.seedId !== seedId);
  save(userId, data);
}
