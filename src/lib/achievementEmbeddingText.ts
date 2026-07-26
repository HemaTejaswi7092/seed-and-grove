// The single semantic text block built from an Achievement — used both
// when embedding it at publish/update time (state/achievements.ts) and
// nowhere else, so the embedded text and the achievement's own fields can
// never drift apart. Deliberately one combined block, not separate
// per-field embeddings — an Achievement is already a short, atomic unit.
interface AchievementTextInput {
  title: string;
  shortDescription: string;
  skillsDemonstrated: string[];
  technologiesUsed: string[];
  projectDomain: string;
  candidateContribution: string;
  outcomeOrImpact: string;
  relevantRoles: string[];
}

export function buildAchievementEmbeddingText(achievement: AchievementTextInput): string {
  return [
    achievement.title,
    achievement.shortDescription,
    achievement.skillsDemonstrated.length
      ? `Skills: ${achievement.skillsDemonstrated.join(", ")}.`
      : "",
    achievement.technologiesUsed.length
      ? `Technologies: ${achievement.technologiesUsed.join(", ")}.`
      : "",
    achievement.projectDomain ? `Domain: ${achievement.projectDomain}.` : "",
    achievement.candidateContribution
      ? `Contribution: ${achievement.candidateContribution}`
      : "",
    achievement.outcomeOrImpact ? `Outcome: ${achievement.outcomeOrImpact}` : "",
    achievement.relevantRoles.length
      ? `Relevant roles: ${achievement.relevantRoles.join(", ")}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}
