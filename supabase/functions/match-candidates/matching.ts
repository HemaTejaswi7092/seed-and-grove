import type {
  AchievementMatchRow,
  CandidateMatchResult,
  CandidateProfileRow,
  MatchCandidatesRequestBody,
} from "./types.ts";

// One semantic block from the complete job posting — not separate
// title/skills embeddings compared independently. This is what gets
// embedded and compared against each Achievement's own combined block
// (see src/lib/achievementEmbeddingText.ts on the candidate side).
export function buildJobEmbeddingText(job: MatchCandidatesRequestBody): string {
  return [
    job.title,
    job.description,
    job.requiredSkills.length ? `Required skills: ${job.requiredSkills.join(", ")}.` : "",
    job.preferredSkills.length ? `Preferred skills: ${job.preferredSkills.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

// Evidence-grounded, not generated — the sentence is built directly from
// the candidate's own strongest matching Achievement, so it can never say
// anything the Achievement itself doesn't already say.
function buildMatchSentence(top: AchievementMatchRow): string {
  const detail = top.short_description.trim() || top.outcome_or_impact.trim();
  return detail ? `Matches through "${top.title}" — ${detail}` : `Matches through "${top.title}"`;
}

function clampToPercent(similarity: number): number {
  return Math.round(Math.max(0, Math.min(1, similarity)) * 100);
}

// Groups retrieved Achievements by candidate, ranks candidates by their
// single strongest piece of evidence (max similarity, not an average —
// one excellent match should outrank several mediocre ones), and keeps
// each candidate's top 1-3 Achievements. Achievement rows are assumed
// already sorted by similarity desc (match_achievements' own ORDER BY).
export function groupAndRankCandidates(
  achievementRows: AchievementMatchRow[],
  profilesById: Map<string, CandidateProfileRow>,
  maxCandidates: number,
): CandidateMatchResult[] {
  const byCandidate = new Map<string, AchievementMatchRow[]>();
  for (const row of achievementRows) {
    const existing = byCandidate.get(row.candidate_id);
    if (existing) existing.push(row);
    else byCandidate.set(row.candidate_id, [row]);
  }

  const ranked = Array.from(byCandidate.entries())
    .map(([candidateId, rows]) => {
      const top = rows.slice(0, 3);
      const score = rows[0].similarity; // rows are already similarity-sorted
      return { candidateId, top, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCandidates);

  return ranked.map(({ candidateId, top, score }) => {
    const profile = profilesById.get(candidateId);
    return {
      candidateId,
      name: profile?.full_name?.trim() || "Candidate",
      headline: profile?.headline ?? "",
      matchScore: clampToPercent(score),
      matchSentence: buildMatchSentence(top[0]),
      achievements: top.map((a) => ({
        id: a.id,
        title: a.title,
        shortDescription: a.short_description,
        similarity: clampToPercent(a.similarity) / 100,
      })),
    };
  });
}
