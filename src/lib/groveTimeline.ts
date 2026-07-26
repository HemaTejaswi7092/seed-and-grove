import { timeAgo } from "./dates";
import type { Seed } from "../types/seed";
import type { GrowthTimelineEntry } from "../types/grove";
import type { PublishedAchievementWithSeed } from "./groveSkills";

// Meaningful, published professional milestones only — never ordinary chat
// messages. Every entry traces back to a publishedAt/completedAt timestamp
// the user set deliberately (a Seed publish, a Seed completion, or an
// achievement publish — grove_achievements' created_at is stable across
// edits, since upsert never touches it after the initial insert, so it
// reliably means "first published at"), so the timeline can't include
// anything the Grove itself wouldn't otherwise show.
export function buildGrowthTimeline(
  publishedSeeds: Seed[],
  publishedAchievements: PublishedAchievementWithSeed[],
): GrowthTimelineEntry[] {
  const entries: GrowthTimelineEntry[] = [];

  for (const seed of publishedSeeds) {
    if (!seed.publishedAt) continue;
    entries.push({
      id: `seed-published-${seed.id}`,
      type: "seed_published",
      title: `Published "${seed.title}" to the Grove`,
      date: timeAgo(seed.publishedAt),
      sortKey: new Date(seed.publishedAt).getTime(),
    });

    if (seed.lifecycleStatus === "completed" && seed.completedAt) {
      entries.push({
        id: `seed-completed-${seed.id}`,
        type: "seed_completed",
        title: `Completed "${seed.title}"`,
        date: timeAgo(seed.completedAt),
        sortKey: new Date(seed.completedAt).getTime(),
      });
    }
  }

  const skillsIntroduced = new Set<string>();
  for (const { achievement, seed } of publishedAchievements) {
    entries.push({
      id: `achievement-${achievement.id}`,
      type: "achievement_published",
      title: `${achievement.title} — ${seed.title}`,
      date: timeAgo(achievement.created_at),
      sortKey: new Date(achievement.created_at).getTime(),
    });

    for (const rawSkill of achievement.skills_demonstrated) {
      const skill = rawSkill.trim();
      if (!skill || skillsIntroduced.has(skill)) continue;
      skillsIntroduced.add(skill);
      entries.push({
        id: `skill-${skill}`,
        type: "skill_demonstrated",
        title: `Demonstrated ${skill}`,
        date: timeAgo(achievement.created_at),
        sortKey: new Date(achievement.created_at).getTime(),
      });
    }
  }

  return entries.sort((a, b) => b.sortKey - a.sortKey);
}
