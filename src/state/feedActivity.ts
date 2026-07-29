// Single place every automatic Community Feed post gets created from —
// the moment an action already makes something public (publishing a
// Seed, publishing an Achievement, updating a Grove profile, publishing a
// Job), a feed_posts row is created here so the Community Feed reflects
// it without the candidate/recruiter having to separately click "Share
// to Feed". Deliberately does NOT cover creating a private Seed/draft
// achievement — those aren't public yet, so there's nothing to announce
// (see seedPublishing.ts's setSeedPublishedAndSync, the actual "made
// public" moment).
//
// Every function here is best-effort: a feed-post failure must never
// block or roll back the real action (publishing a Seed still succeeds
// even if the Community Feed announcement fails to write) — same
// philosophy as achievements.ts's silent embedding failure. Callers never
// need to catch anything from these.
import { createFeedPost } from "./feedStore";
import type { Seed } from "../types/seed";

async function postBestEffort(
  userId: string,
  input: Parameters<typeof createFeedPost>[1],
): Promise<void> {
  try {
    await createFeedPost(userId, input);
  } catch {
    // Swallowed by design — see header comment.
  }
}

// Fires once, at the exact private→public transition (see
// seedPublishing.ts's before/after check) — never re-fires on a later
// edit to an already-published Seed, which is what keeps "publishing the
// same project twice" from creating duplicate posts.
export async function postSeedPublished(
  userId: string,
  authorName: string,
  seed: Seed,
): Promise<void> {
  await postBestEffort(userId, {
    seed_id: seed.id,
    evidence_id: null,
    post_type: seed.lifecycleStatus === "completed" ? "project_completed" : "project_started",
    caption: `${authorName} published "${seed.title}" to Grove.`,
    author_name: authorName,
    author_account_type: "candidate",
    project_title: seed.title,
    achievement_title: null,
    evidence_summary: null,
    skills: [],
    visibility: "public",
  });
}

// Fires when an already-published Seed transitions to completed — a
// distinct moment from postSeedPublished above (a Seed can be published
// while still in progress, then completed later).
export async function postSeedCompleted(
  userId: string,
  authorName: string,
  seed: Seed,
): Promise<void> {
  await postBestEffort(userId, {
    seed_id: seed.id,
    evidence_id: null,
    post_type: "project_completed",
    caption: `${authorName} completed "${seed.title}".`,
    author_name: authorName,
    author_account_type: "candidate",
    project_title: seed.title,
    achievement_title: null,
    evidence_summary: null,
    skills: [],
    visibility: "public",
  });
}

export async function postAchievementPublished(
  userId: string,
  authorName: string,
  achievement: {
    id: string;
    title: string;
    shortDescription: string;
    seedId: string;
    projectTitle: string;
    achievementType: string;
    skillsDemonstrated: string[];
  },
): Promise<void> {
  const isMilestone = achievement.achievementType === "milestone";
  await postBestEffort(userId, {
    seed_id: achievement.seedId,
    evidence_id: achievement.id,
    post_type: isMilestone ? "milestone_completed" : "achievement_added",
    caption: isMilestone
      ? `${authorName} reached a milestone: "${achievement.title}".`
      : `${authorName} added a new achievement: "${achievement.title}".`,
    author_name: authorName,
    author_account_type: "candidate",
    project_title: achievement.projectTitle,
    achievement_title: achievement.title,
    evidence_summary: achievement.shortDescription,
    skills: achievement.skillsDemonstrated,
    visibility: "public",
  });
}

// Only called when the caller has already confirmed a meaningful field
// (headline/professional summary) actually changed — see
// candidateProfileStore.ts's updateCandidateProfileFields — so saving the
// same values twice, or editing an unrelated section, never posts again.
export async function postGroveProfileUpdated(
  userId: string,
  authorName: string,
): Promise<void> {
  await postBestEffort(userId, {
    seed_id: null,
    evidence_id: null,
    post_type: "grove_update",
    caption: `${authorName} updated their Grove profile.`,
    author_name: authorName,
    author_account_type: "candidate",
    project_title: null,
    achievement_title: null,
    evidence_summary: null,
    skills: [],
    visibility: "public",
  });
}

// Fires once, at the exact draft→published transition for a Job — see
// recruiterStore.ts's before/after check, same duplicate-prevention
// approach as postSeedPublished.
export async function postJobPosted(
  recruiterId: string,
  authorName: string,
  companyName: string,
  job: { title: string },
): Promise<void> {
  await postBestEffort(recruiterId, {
    seed_id: null,
    evidence_id: null,
    post_type: "job_posted",
    caption: `${companyName} posted a new job: "${job.title}".`,
    author_name: authorName,
    author_account_type: "recruiter",
    project_title: null,
    achievement_title: null,
    evidence_summary: null,
    skills: [],
    visibility: "public",
  });
}
