import type { GroveStrength } from "../types/grove";

export interface GroveStrengthInput {
  hasHeadlineOrBio: boolean;
  hasFirstSeed: boolean;
  hasAchievementCaptured: boolean;
  hasFirstPublishedSeed: boolean;
  hasPublishedAchievement: boolean;
  hasAboutSection: boolean;
}

// Every factor is a plain boolean read from real data — no weighting, no
// estimation. "X of 6 completed" is always exactly how many of these are
// true, so the number can never drift from what the page actually shows.
export function calculateGroveStrength(
  input: GroveStrengthInput,
): GroveStrength {
  const items = [
    {
      key: "first_seed",
      label: "Create your first Seed",
      done: input.hasFirstSeed,
    },
    {
      key: "achievement_captured",
      label: "Capture your first achievement",
      done: input.hasAchievementCaptured,
    },
    {
      key: "publish_seed",
      label: "Publish a Seed to your Grove",
      done: input.hasFirstPublishedSeed,
    },
    {
      key: "published_achievement",
      label: "Publish an achievement to your Grove",
      done: input.hasPublishedAchievement,
    },
    {
      key: "headline",
      label: "Add a headline or bio",
      done: input.hasHeadlineOrBio,
    },
    {
      key: "about",
      label: "Add an About the Builder section",
      done: input.hasAboutSection,
    },
  ];

  return {
    completed: items.filter((item) => item.done).length,
    total: items.length,
    items,
  };
}
