// The single place that keeps a candidate's local Seed record and its
// published counterpart in grove_seeds from ever diverging. Mirrors
// state/achievements.ts's role for Achievements exactly. Nothing else is
// allowed to write to grove_seeds directly — the Seed Workspace's
// publish toggle, lifecycle actions (complete/reopen/archive/unarchive),
// and the project-links editor all go through the functions below, and
// only these ever call both state/seedStore.ts (local) and
// state/groveSeedsStore.ts (Postgres).
import {
  setSeedPublished,
  completeSeed,
  reopenSeed,
  archiveSeed,
  unarchiveSeed,
  updateSeedLinks,
} from "./seedStore";
import {
  deletePublishedSeed,
  upsertPublishedSeed,
  type UpsertPublishedSeedInput,
} from "./groveSeedsStore";
import type { Seed } from "../types/seed";

function toPublishedInput(seed: Seed): UpsertPublishedSeedInput {
  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    technologies: seed.technologies,
    status: seed.status,
    lifecycle_status: seed.lifecycleStatus,
    repo_url: seed.repoUrl || null,
    demo_url: seed.demoUrl || null,
  };
}

// Publishing/unpublishing is the one action that actually controls
// whether a recruiter can see this Seed at all, so failures here are
// never silent — a failed Postgres sync could otherwise leave the local
// "Published to Grove" toggle on while nothing is really visible, or
// (worse, on unpublish) leave a stale row visible after the candidate
// thought they'd made it private. Throws on failure; the caller (Seed.tsx)
// is expected to catch and show it.
export async function setSeedPublishedAndSync(
  userId: string,
  seedId: string,
  isPublished: boolean,
): Promise<Seed | null> {
  const updated = setSeedPublished(userId, seedId, isPublished);
  if (!updated) return null;

  if (isPublished) {
    await upsertPublishedSeed(userId, toPublishedInput(updated));
  } else {
    await deletePublishedSeed(seedId);
  }
  return updated;
}

// Re-upserts the grove_seeds mirror so it picks up a lifecycle or link
// change — a no-op if the Seed isn't published, since there's nothing to
// keep in sync in that case.
async function syncIfPublished(userId: string, seed: Seed | null): Promise<void> {
  if (!seed || !seed.isPublished) return;
  await upsertPublishedSeed(userId, toPublishedInput(seed));
}

export async function completeSeedAndSync(
  userId: string,
  seedId: string,
): Promise<Seed | null> {
  const updated = completeSeed(userId, seedId);
  await syncIfPublished(userId, updated);
  return updated;
}

export async function reopenSeedAndSync(
  userId: string,
  seedId: string,
): Promise<Seed | null> {
  const updated = reopenSeed(userId, seedId);
  await syncIfPublished(userId, updated);
  return updated;
}

export async function archiveSeedAndSync(
  userId: string,
  seedId: string,
): Promise<Seed | null> {
  const updated = archiveSeed(userId, seedId);
  await syncIfPublished(userId, updated);
  return updated;
}

export async function unarchiveSeedAndSync(
  userId: string,
  seedId: string,
): Promise<Seed | null> {
  const updated = unarchiveSeed(userId, seedId);
  await syncIfPublished(userId, updated);
  return updated;
}

export async function updateSeedLinksAndSync(
  userId: string,
  seedId: string,
  links: { repoUrl: string; demoUrl: string },
): Promise<Seed | null> {
  const updated = updateSeedLinks(userId, seedId, links);
  await syncIfPublished(userId, updated);
  return updated;
}
