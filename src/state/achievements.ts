// The single place that keeps a candidate's local Achievement record and
// its published counterpart in grove_achievements from ever diverging.
// Nothing else is allowed to write to either store directly — the review
// form, the Edit/Delete menu, and CopilotChat's "Save as Achievement" all
// go through the three functions below, and only these three ever call
// both state/seedStore.ts (local) and state/groveAchievementsStore.ts
// (Postgres).
import {
  createSeedAchievement,
  deleteSeedAchievement,
  getAchievement,
  updateSeedAchievement,
  type CreateAchievementInput,
  type UpdateAchievementInput,
} from "./seedStore";
import {
  deletePublishedAchievement,
  upsertPublishedAchievement,
  type UpsertPublishedAchievementInput,
} from "./groveAchievementsStore";
import { buildAchievementEmbeddingText } from "../lib/achievementEmbeddingText";
import { embedAchievementText } from "../services/ai/embedAchievement";
import type { Achievement } from "../types/seed";

// Re-embeds on every publish/update — the cheapest correct option, since
// gte-small runs free inside embed-achievement (see that function's
// header comment) and an Achievement's text is short. Failure here is
// silent by design: the embedding fields are simply omitted from the
// upsert payload (see UpsertPublishedAchievementInput's comment), never
// set to a wrong or stale value.
async function toPublishedInput(
  achievement: Achievement,
): Promise<UpsertPublishedAchievementInput> {
  const base: UpsertPublishedAchievementInput = {
    id: achievement.id,
    project_id: achievement.seedId,
    title: achievement.title,
    short_description: achievement.shortDescription,
    achievement_type: achievement.achievementType,
    skills_demonstrated: achievement.skillsDemonstrated,
    technologies_used: achievement.technologiesUsed,
    project_domain: achievement.projectDomain,
    candidate_contribution: achievement.candidateContribution,
    outcome_or_impact: achievement.outcomeOrImpact,
    proof_url: achievement.proofUrl,
    proof_label: achievement.proofLabel,
    relevant_roles: achievement.relevantRoles,
  };

  const embedding = await embedAchievementText(buildAchievementEmbeddingText(achievement));
  if (!embedding) return base;

  return {
    ...base,
    embedding,
    embedding_model: "gte-small",
    embedding_updated_at: new Date().toISOString(),
  };
}

// Creating never auto-publishes on its own — it publishes only if the
// candidate explicitly chose "Published" right there in the review form
// (input.visibility). Left at the default "private", nothing ever touches
// Postgres.
export async function createAchievement(
  userId: string,
  seedId: string,
  input: CreateAchievementInput,
): Promise<Achievement> {
  const achievement = createSeedAchievement(userId, seedId, input);
  if (achievement.visibility === "published") {
    await upsertPublishedAchievement(userId, await toPublishedInput(achievement));
  }
  return achievement;
}

// The one update function referenced throughout this feature's design:
// applies the edit locally, then reconciles Postgres to match — publishing
// if the edit turned it published, unpublishing (deleting the row) if the
// edit turned it private, or just pushing the field changes through if it
// was already published and stays published.
export async function updateAchievement(
  userId: string,
  achievementId: string,
  patch: UpdateAchievementInput,
): Promise<Achievement | null> {
  const updated = updateSeedAchievement(userId, achievementId, patch);
  if (!updated) return null;

  if (updated.visibility === "published") {
    await upsertPublishedAchievement(userId, await toPublishedInput(updated));
  } else {
    await deletePublishedAchievement(updated.id);
  }
  return updated;
}

// Hard delete only — no soft-delete/trash for the MVP. Removes the
// grove_achievements row FIRST when published, and only removes the local
// record once that succeeds (or immediately, for a private achievement,
// which was never in Postgres). Deleting in the other order — local
// first — would leave an orphaned published row behind if the Postgres
// call then failed, with no local record left to retry the delete from.
export async function deleteAchievement(
  userId: string,
  achievementId: string,
): Promise<boolean> {
  const existing = getAchievement(userId, achievementId);
  if (!existing) return false;

  if (existing.visibility === "published") {
    await deletePublishedAchievement(achievementId);
  }
  return deleteSeedAchievement(userId, achievementId);
}
