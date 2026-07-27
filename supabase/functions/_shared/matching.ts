// Seed & Grove — shared semantic matching engine.
//
// The ONE place similarity scores get turned into a percentage and a
// label, for BOTH matching directions:
//   - match-candidates (recruiter -> candidates)
//   - match-jobs-for-candidate (candidate -> jobs)
// Neither function computes its own percentage/label logic — they both
// import this. Per-direction differences (grouping achievements by
// candidate vs. ranking jobs directly, and the audience-specific wording
// of the one-sentence explanation) live in each function's own matching.ts,
// but the actual scoring math is not duplicated.

export type MatchLabel = "Excellent Match" | "Strong Match" | "Good Match" | "Potential Match";

// gte-small embeddings are mean-pooled and normalized (see either
// function's index.ts), so cosine similarity is already in [-1, 1] and
// pgvector's <#> (negative inner product) recovers it directly — this
// just clamps for float noise and turns it into a display percentage.
export function similarityToPercent(similarity: number): number {
  return Math.round(Math.max(0, Math.min(1, similarity)) * 100);
}

// Fixed thresholds shared by both directions — a 78% match reads as
// "Strong Match" whether it's a recruiter looking at a candidate or a
// candidate looking at a job.
export function matchLabel(percent: number): MatchLabel {
  if (percent >= 90) return "Excellent Match";
  if (percent >= 75) return "Strong Match";
  if (percent >= 60) return "Good Match";
  return "Potential Match";
}
