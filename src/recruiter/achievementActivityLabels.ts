// Shared between the Discover feed and anywhere else that needs a plain-
// English label for an achievement_type — candidate professional
// activity only, never framed as a hiring-pipeline event.
export const ACHIEVEMENT_ACTIVITY_LABEL: Record<string, string> = {
  project: "published a project",
  milestone: "hit a project milestone",
  code: "shared new code",
  dashboard: "published a dashboard",
  document: "published a document",
  certification: "earned a certification",
  deployment: "shipped a deployment",
  research: "published research",
  presentation: "gave a presentation",
  award: "received an award",
};

export function achievementActivityLabel(achievementType: string): string {
  return ACHIEVEMENT_ACTIVITY_LABEL[achievementType] ?? "published an achievement";
}
