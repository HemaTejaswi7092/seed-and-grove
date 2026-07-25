import { detectSeedDomain } from "../lib/seedDomain";
import type {
  DraftSeedInput,
  Seed,
  SeedActivityItem,
  SeedConversationMessage,
  SeedEvidenceItem,
  SeedStage,
} from "../types/seed";

// Temporary local persistence layer — Seeds aren't in Supabase yet (see task
// scope). Everything is keyed per authenticated userId, so different
// accounts signing in on the same browser never see each other's Seeds,
// and every record carries its own seedId so nothing is ever shared
// globally across workspaces. This is the ONLY place Seed data is read
// from or written to — no component should reach into localStorage itself.

interface UserSeedData {
  seeds: Seed[];
  activity: SeedActivityItem[];
  evidence: SeedEvidenceItem[];
  messages: SeedConversationMessage[];
}

const EMPTY_DATA: UserSeedData = {
  seeds: [],
  activity: [],
  evidence: [],
  messages: [],
};

const stageToStatus: Record<SeedStage, string> = {
  Idea: "Just Started",
  Planning: "Planning",
  Building: "Currently Building",
  Scaling: "Scaling",
};

function storageKey(userId: string): string {
  return `seedAndGroveSeedData:${userId}`;
}

function load(userId: string): UserSeedData {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { ...EMPTY_DATA };
    const parsed = JSON.parse(raw) as Partial<UserSeedData>;
    return {
      seeds: parsed.seeds ?? [],
      activity: parsed.activity ?? [],
      evidence: parsed.evidence ?? [],
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

export function getSeedEvidence(
  userId: string,
  seedId: string,
): SeedEvidenceItem[] {
  return load(userId).evidence.filter((item) => item.seedId === seedId);
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
    createdAt: now,
    updatedAt: now,
    // No defined setup-completion rule exists yet, so a brand-new Seed
    // always starts at 0% — never inherited or estimated.
    progress: 0,
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

// Written only when the Copilot judges a message specific enough to be
// evidence (see services/ai/localAssistant.ts's assessEvidence rules) —
// never on every message.
export function addSeedEvidence(
  userId: string,
  seedId: string,
  input: { category: string; title: string; description: string },
): SeedEvidenceItem {
  const data = load(userId);
  const item: SeedEvidenceItem = {
    id: generateId("evidence"),
    seedId,
    category: input.category,
    title: input.title,
    description: input.description,
    createdAt: new Date().toISOString(),
    verified: false,
  };
  data.evidence.push(item);
  save(userId, data);
  return item;
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
