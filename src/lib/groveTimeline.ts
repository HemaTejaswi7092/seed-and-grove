import { timeAgo } from "./dates";
import type { Seed } from "../types/seed";
import type { GrowthTimelineEntry } from "../types/grove";
import type { PublicEvidenceWithSeed } from "./groveSkills";

// Meaningful, published professional milestones only — never ordinary chat
// messages. Every entry traces back to a publishedAt timestamp the user
// set deliberately (a Seed publish, or an evidence publish), so the
// timeline can't include anything the Grove itself wouldn't otherwise show.
export function buildGrowthTimeline(
  publishedSeeds: Seed[],
  publicEvidence: PublicEvidenceWithSeed[],
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

    if (seed.progress >= 100) {
      entries.push({
        id: `seed-completed-${seed.id}`,
        type: "seed_completed",
        title: `Completed "${seed.title}"`,
        date: timeAgo(seed.updatedAt),
        sortKey: new Date(seed.updatedAt).getTime(),
      });
    }
  }

  const skillsIntroduced = new Set<string>();
  for (const { evidence, seed } of publicEvidence) {
    if (!evidence.publishedAt) continue;
    entries.push({
      id: `evidence-${evidence.id}`,
      type: "evidence_published",
      title: `${evidence.title} — ${seed.title}`,
      date: timeAgo(evidence.publishedAt),
      sortKey: new Date(evidence.publishedAt).getTime(),
    });

    const skill = evidence.category.trim();
    if (skill && !skillsIntroduced.has(skill)) {
      skillsIntroduced.add(skill);
      entries.push({
        id: `skill-${skill}`,
        type: "skill_demonstrated",
        title: `Demonstrated ${skill}`,
        date: timeAgo(evidence.publishedAt),
        sortKey: new Date(evidence.publishedAt).getTime(),
      });
    }
  }

  return entries.sort((a, b) => b.sortKey - a.sortKey);
}
