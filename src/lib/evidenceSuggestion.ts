import type { AchievementReviewFormValues } from "../components/workspace/AchievementReviewModal";
import type { CreateAchievementInput } from "../state/seedStore";
import type { EvidenceSuggestion } from "../services/ai/types";
import type { AchievementVisibility, Seed } from "../types/seed";
import { seedDomainLabel } from "./seedDomain";

// The manual "Add Achievement" action's starting point (ProjectHeader's
// button and the completion workflow's built-in entry point both use
// this) — blank except for what's already known about the project
// itself, so most achievements need zero typing in the "More Details"
// section at all. Still fully editable there. seedId association happens
// separately, at the createAchievement(userId, seedId, input) call site
// — never a form field.
export function buildEmptyAchievementFormValues(seed: Seed): AchievementReviewFormValues {
  return {
    title: "",
    shortDescription: "",
    achievementType: "milestone",
    skillsDemonstrated: "",
    technologiesUsed: seed.technologies.join(", "),
    projectDomain: seedDomainLabel(seed),
    candidateContribution: "",
    outcomeOrImpact: "",
    proofUrl: "",
    proofLabel: "",
    relevantRoles: "",
    visibility: "private",
  };
}

// Shared by the chat flow's "Save as Achievement" card (CopilotChat.tsx)
// and the required project-completion workflow (Seed.tsx /
// ProjectCompletionWorkflow.tsx) — one mapping from the AI's best-
// effort suggestion to the review form's editable fields, so every entry
// point can never drift apart. Only category/title/description are ever
// guaranteed on the suggestion; everything else falls back to an empty/
// generic default the candidate can freely edit before saving.
export function evidenceSuggestionToFormValues(
  suggestion: EvidenceSuggestion,
  visibility: AchievementVisibility,
): AchievementReviewFormValues {
  return {
    title: suggestion.title,
    shortDescription: suggestion.description,
    achievementType: "milestone",
    skillsDemonstrated: (suggestion.skillsDemonstrated ?? [suggestion.category]).join(", "),
    technologiesUsed: (suggestion.technologiesUsed ?? []).join(", "),
    projectDomain: suggestion.projectDomain ?? "",
    candidateContribution: suggestion.candidateContribution ?? "",
    outcomeOrImpact: suggestion.outcomeOrImpact ?? "",
    proofUrl: "",
    proofLabel: "",
    relevantRoles: (suggestion.relevantRoles ?? []).join(", "),
    visibility,
  };
}

// The suggestions-review screen's quick actions (Publish to Grove / Save
// as Draft) save a suggestion exactly as the AI produced it, with no
// detour through the comma-string review form — this goes straight to
// state/achievements.ts's createAchievement. "Edit" still goes through
// evidenceSuggestionToFormValues + AchievementReviewModal instead, for
// when the candidate wants to change something first.
export function evidenceSuggestionToCreateInput(
  suggestion: EvidenceSuggestion,
  visibility: AchievementVisibility,
): CreateAchievementInput {
  return {
    title: suggestion.title,
    shortDescription: suggestion.description,
    achievementType: "milestone",
    skillsDemonstrated: suggestion.skillsDemonstrated ?? [suggestion.category],
    technologiesUsed: suggestion.technologiesUsed ?? [],
    projectDomain: suggestion.projectDomain ?? "",
    candidateContribution: suggestion.candidateContribution ?? "",
    outcomeOrImpact: suggestion.outcomeOrImpact ?? "",
    proofUrl: null,
    proofLabel: null,
    relevantRoles: suggestion.relevantRoles ?? [],
    visibility,
  };
}
