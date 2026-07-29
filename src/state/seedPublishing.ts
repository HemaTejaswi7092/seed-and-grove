// The single orchestrator for everything that touches a Seed's Postgres
// row (state/seedsStore.ts) and everything that has to stay in sync with
// it: the public grove_seeds mirror (state/groveSeedsStore.ts), the local
// Timeline/Copilot-message record (state/seedStore.ts, still genuinely
// local by design), and — on delete — every other record that would
// otherwise be orphaned (published Achievements, feed activity). Nothing
// else is allowed to write to seeds/grove_seeds directly; every Seed
// Workspace action (create, publish toggle, lifecycle transitions,
// metadata edit, link edit, delete) goes through one of the functions
// below.
import {
  initializeLocalSeedRecord,
  addTimelineEvent,
  clearLocalSeedData,
  getSeedAchievements,
} from "./seedStore";
import {
  createSeed as createSeedRemote,
  getSeed,
  updateSeed,
  deleteSeed as deleteSeedRemote,
  type UpdateSeedInput,
} from "./seedsStore";
import {
  deletePublishedSeed,
  upsertPublishedSeed,
  type UpsertPublishedSeedInput,
} from "./groveSeedsStore";
import { deletePublishedAchievementsByProject } from "./groveAchievementsStore";
import { deleteFeedPostsForSeed } from "./feedStore";
import { postSeedPublished, postSeedCompleted } from "./feedActivity";
import type { DraftSeedInput, Seed } from "../types/seed";

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

// Re-upserts the grove_seeds mirror so it picks up whatever just changed —
// a no-op if the Seed isn't published, since there's nothing to keep in
// sync in that case. Same id both places (see supabase/seeds.sql's header
// comment) is what makes this a real sync rather than a second,
// independently-drifting copy.
async function syncIfPublished(seed: Seed | null): Promise<void> {
  if (!seed || !seed.isPublished) return;
  await upsertPublishedSeed(seed.userId, toPublishedInput(seed));
}

export async function createSeedAndSync(
  userId: string,
  draft: DraftSeedInput,
): Promise<Seed> {
  const seed = await createSeedRemote(userId, draft);
  initializeLocalSeedRecord(seed);
  return seed;
}

// Publishing/unpublishing is the one action that actually controls
// whether a recruiter can see this Seed at all, so failures here are
// never silent — a failed Postgres sync could otherwise leave the
// "Published to Grove" toggle on while nothing is really visible, or
// (worse, on unpublish) leave a stale row visible after the candidate
// thought they'd made it private. Throws on failure; the caller (Seed.tsx)
// is expected to catch and show it.
export async function setSeedPublishedAndSync(
  userId: string,
  seedId: string,
  isPublished: boolean,
  authorName: string,
): Promise<Seed | null> {
  // Read before writing so the Community Feed post below only fires on a
  // genuine private→published transition, never on a second publish(true)
  // call against an already-published Seed (see feedActivity.ts's header
  // comment on why this matters for "no duplicate posts").
  const before = await getSeed(userId, seedId);

  const now = new Date().toISOString();
  const updated = await updateSeed(userId, seedId, {
    is_published: isPublished,
    published_at: isPublished ? now : null,
  });
  if (!updated) return null;

  if (isPublished) {
    await upsertPublishedSeed(userId, toPublishedInput(updated));
    // Only the private→published transition is Timeline-worthy —
    // unpublishing isn't in the recorded event list (see types/seed.ts).
    addTimelineEvent(userId, seedId, "project_published");
    if (!before?.isPublished) {
      await postSeedPublished(userId, authorName, updated);
    }
  } else {
    await deletePublishedSeed(seedId);
  }
  return updated;
}

export async function updateSeedDetailsAndSync(
  userId: string,
  seedId: string,
  patch: { title: string; description: string; technologies: string[] },
): Promise<Seed | null> {
  const updated = await updateSeed(userId, seedId, {
    title: patch.title,
    description: patch.description,
    technologies: patch.technologies,
  });
  await syncIfPublished(updated);
  if (updated) addTimelineEvent(userId, seedId, "details_updated");
  return updated;
}

export async function updateSeedLinksAndSync(
  userId: string,
  seedId: string,
  links: { repoUrl: string; demoUrl: string },
): Promise<Seed | null> {
  const patch: UpdateSeedInput = {
    repo_url: links.repoUrl.trim(),
    demo_url: links.demoUrl.trim(),
  };
  const updated = await updateSeed(userId, seedId, patch);
  await syncIfPublished(updated);
  return updated;
}

// --- Project lifecycle ------------------------------------------------
// Four explicit, candidate-triggered transitions — nothing here is ever
// called automatically from AI messages, achievement counts, or the
// progress field. The Seed Workspace's "Mark Project as Complete" button
// calls completeSeedAndSync only after the candidate confirms the review
// checklist; "Reopen Project" and the Archive/Unarchive overflow action
// call the other three directly.

export async function completeSeedAndSync(
  userId: string,
  seedId: string,
  authorName: string,
): Promise<Seed | null> {
  // Same before/after guard as setSeedPublishedAndSync — only post when
  // this call is the actual in_progress→completed transition, not a
  // re-completion of an already-completed Seed.
  const before = await getSeed(userId, seedId);

  const updated = await updateSeed(userId, seedId, {
    lifecycle_status: "completed",
    completed_at: new Date().toISOString(),
  });
  await syncIfPublished(updated);
  if (updated) {
    addTimelineEvent(userId, seedId, "project_completed");
    if (updated.isPublished && before?.lifecycleStatus !== "completed") {
      await postSeedCompleted(userId, authorName, updated);
    }
  }
  return updated;
}

export async function reopenSeedAndSync(
  userId: string,
  seedId: string,
): Promise<Seed | null> {
  const updated = await updateSeed(userId, seedId, {
    lifecycle_status: "in_progress",
    completed_at: null,
  });
  await syncIfPublished(updated);
  if (updated) addTimelineEvent(userId, seedId, "project_reopened");
  return updated;
}

export async function archiveSeedAndSync(
  userId: string,
  seedId: string,
): Promise<Seed | null> {
  const updated = await updateSeed(userId, seedId, { lifecycle_status: "archived" });
  await syncIfPublished(updated);
  return updated;
}

// Always returns to "in_progress" — this is a flat three-state enum (see
// LifecycleStatus), so unarchiving can't distinguish "was completed before
// archiving" from "was in progress"; re-completing is one click away via
// Mark Project as Complete if that's the case.
export async function unarchiveSeedAndSync(
  userId: string,
  seedId: string,
): Promise<Seed | null> {
  const updated = await updateSeed(userId, seedId, { lifecycle_status: "in_progress" });
  await syncIfPublished(updated);
  return updated;
}

// --- Delete -------------------------------------------------------------
// Deletes leaf references first, the Seed's own rows last, so a failure
// partway through never leaves the Seed itself gone while something still
// points at it — same ordering principle as state/achievements.ts's
// deleteAchievement. Runs the Achievement/feed-post cleanup unconditionally
// (not just when the Seed itself is published) — an Achievement can be
// published independently of its parent Seed, so a private Seed can still
// have real grove_achievements/feed_posts rows to clean up.
export async function deleteSeedAndSync(userId: string, seedId: string): Promise<void> {
  const publishedAchievementIds = await deletePublishedAchievementsByProject(seedId);

  const localAchievementIds = getSeedAchievements(userId, seedId).map((item) => item.id);
  const allAchievementIds = Array.from(
    new Set([...publishedAchievementIds, ...localAchievementIds]),
  );
  await deleteFeedPostsForSeed(userId, seedId, allAchievementIds);

  // Not every Seed is published — deletePublishedSeed throws if nothing
  // was removed, which would wrongly abort deleting a private Seed that
  // was never in grove_seeds to begin with. Best-effort here is correct:
  // the seeds row deleted below is this Seed's actual source of truth.
  try {
    await deletePublishedSeed(seedId);
  } catch {
    // No published row to remove — expected for a private Seed.
  }

  await deleteSeedRemote(userId, seedId);
  clearLocalSeedData(userId, seedId);
}
