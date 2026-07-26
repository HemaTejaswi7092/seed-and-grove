import type { Seed } from "../types/seed";
import type { PublishedAchievement, SkillSummary } from "../types/grove";

export interface PublishedAchievementWithSeed {
  achievement: PublishedAchievement;
  seed: Seed;
}

// Skills come only from published achievements' own skills_demonstrated
// field — never from profile text or user-entered keywords (per Grove
// spec). Each skill carries the achievement(s) that back it, so the UI
// can show "supported by" instead of a bare, unsupported skill name. One
// achievement can demonstrate several skills, so this flattens across the
// array rather than assuming one skill per achievement.
export function deriveSkillsFromAchievements(
  items: PublishedAchievementWithSeed[],
): SkillSummary[] {
  const bySkill = new Map<string, SkillSummary>();

  for (const { achievement, seed } of items) {
    for (const rawSkill of achievement.skills_demonstrated) {
      const skill = rawSkill.trim();
      if (!skill) continue;

      const existing = bySkill.get(skill);
      const supporting = { title: achievement.title, seedTitle: seed.title };

      if (existing) {
        existing.achievementCount += 1;
        existing.supportingAchievements.push(supporting);
      } else {
        bySkill.set(skill, {
          skill,
          achievementCount: 1,
          supportingAchievements: [supporting],
        });
      }
    }
  }

  return Array.from(bySkill.values()).sort(
    (a, b) => b.achievementCount - a.achievementCount,
  );
}
