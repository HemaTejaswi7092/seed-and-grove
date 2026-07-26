import { timeAgo } from "./dates";
import type { Achievement } from "../types/seed";
import type { EvidenceItem } from "../types/mockData";

// AchievementFeed (the Workspace tab's compact preview panel) renders the
// display-only EvidenceItem shape (shared with the VISIQ demo data); the
// full Achievement record is richer. This maps one to the other — first
// listed skill as the badge, newest first — for that compact view only.
// The full Achievement fields (technologies, contribution, outcome, proof)
// show on the Achievements tab's cards (see components/workspace/
// EvidenceGrid.tsx), which renders Achievement objects directly.
export function toDisplayAchievements(items: Achievement[]): EvidenceItem[] {
  return [...items]
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((item) => ({
      id: item.id,
      skill: item.skillsDemonstrated[0] ?? item.achievementType,
      summary: item.shortDescription,
      timestamp: timeAgo(item.createdAt),
    }));
}
