import type { Seed } from "../types/seed";

export type SeedDomain = "knn" | "generic";

// Lightweight topic detection from a Seed's own title/description, shared
// by the welcome-message generator (state/seedStore.ts) and the Copilot's
// response generator (services/ai). Keeping it in one place means both
// agree on what a Seed is "about" without duplicating the regex, and
// without either layer depending on the other.
export function detectSeedDomain(
  seed: Pick<Seed, "title" | "description">,
): SeedDomain {
  const text = `${seed.title} ${seed.description}`.toLowerCase();
  return /\bknn\b|k-nearest|k nearest neighbo(u)?rs?/.test(text)
    ? "knn"
    : "generic";
}

// A readable label for the achievement review form's "Project domain"
// pre-fill (see services/ai/localAssistant.ts) — only ever a starting
// point, always candidate-editable. Empty for "generic" rather than
// guessing, since the detector only actually recognizes one domain today.
export function seedDomainLabel(
  seed: Pick<Seed, "title" | "description">,
): string {
  return detectSeedDomain(seed) === "knn"
    ? "Machine Learning / Classification"
    : "";
}
