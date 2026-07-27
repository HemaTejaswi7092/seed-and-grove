import { matchLabel, similarityToPercent } from "../_shared/matching.ts";
import type {
  AchievementRow,
  CandidateProfileRow,
  JobMatchResult,
  JobMatchRow,
} from "./types.ts";

const MAX_SUPPORTING_ACHIEVEMENTS = 3;

// One semantic block from EVERY published Achievement plus public
// profile interest/target-role fields — the candidate's "complete
// published professional context," per the approved spec. This is what
// gets embedded ONCE into a single aggregate candidate representation,
// then compared against each job's own embedding — mirroring
// match-candidates/matching.ts's buildJobEmbeddingText on the other side
// of the same engine, just aggregating many Achievements instead of one
// job posting.
export function buildCandidateEmbeddingText(
  achievements: AchievementRow[],
  profile: CandidateProfileRow | null,
): string {
  const achievementText = achievements
    .map((a) =>
      [
        a.title,
        a.short_description,
        a.skills_demonstrated.length ? `Skills: ${a.skills_demonstrated.join(", ")}.` : "",
        a.technologies_used.length ? `Technologies: ${a.technologies_used.join(", ")}.` : "",
        a.project_domain ? `Domain: ${a.project_domain}.` : "",
        a.candidate_contribution ? `Contribution: ${a.candidate_contribution}` : "",
        a.outcome_or_impact ? `Outcome: ${a.outcome_or_impact}` : "",
        a.relevant_roles.length ? `Relevant roles: ${a.relevant_roles.join(", ")}.` : "",
      ]
        .filter(Boolean)
        .join(" "),
    )
    .join(" ");

  const profileText = profile
    ? [
        profile.headline,
        profile.roles_of_interest ? `Target roles: ${profile.roles_of_interest}.` : "",
        profile.about_interests ? `Professional interests: ${profile.about_interests}.` : "",
        profile.about_direction ? `Direction: ${profile.about_direction}.` : "",
        profile.work_mode ? `Preferred work mode: ${profile.work_mode}.` : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return [achievementText, profileText].filter(Boolean).join(" ");
}

// pgvector returns a vector column as its text literal ("[0.1,0.2,...]")
// over PostgREST — that's valid JSON array syntax, so JSON.parse handles
// it directly.
function parseVector(literal: string): number[] {
  return JSON.parse(literal) as number[];
}

// Both sides are gte-small output (mean-pooled + normalized), so cosine
// similarity is a plain dot product — no second pgvector round trip
// needed to re-rank a candidate's own handful of Achievements, or to
// score a job whose embedding was just generated on demand (see
// index.ts) rather than returned by match_jobs.
export function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

// One semantic block from the complete job posting — title, full
// description (which doubles as "responsibilities," there is no separate
// field), required/preferred qualifications. Mirrors
// src/lib/jobEmbeddingText.ts (browser, used at publish time) and
// match-candidates/matching.ts's buildJobEmbeddingText exactly; this copy
// exists only because it runs at a different point (on-demand backfill
// for a job that was never successfully embedded at publish time) against
// a raw jobs row shape.
export function buildJobEmbeddingText(job: {
  title: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
}): string {
  return [
    job.title,
    job.description,
    job.required_skills.length ? `Required skills: ${job.required_skills.join(", ")}.` : "",
    job.preferred_skills.length ? `Preferred skills: ${job.preferred_skills.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

// Evidence-grounded, not generated — built directly from the specific
// Achievement that most closely matches THIS job, same non-LLM approach
// as match-candidates/matching.ts's buildMatchSentence, just phrased back
// to the candidate instead of to a recruiter.
function buildMatchSentence(top: AchievementRow): string {
  const detail = top.short_description.trim() || top.outcome_or_impact.trim();
  return detail
    ? `Your work on "${top.title}" closely aligns with this role — ${detail}`
    : `Your work on "${top.title}" closely aligns with this role.`;
}

// Scores EVERY job passed in — no similarity floor, no cap on which jobs
// get a percentage (per the "even a weak semantic match must still show
// its percentage" rule; any threshold-based filtering happens only in
// the frontend's optional "Recommended" highlight, never here). For each
// job, also separately re-ranks the candidate's OWN Achievements against
// that SPECIFIC job's embedding to pick the top 1-3 pieces of supporting
// evidence — the aggregate score answers "how well does this job fit me
// overall," this answers "which of my Achievements is why."
export function buildJobMatches(
  jobRows: JobMatchRow[],
  achievements: AchievementRow[],
  queryEmbedding: number[],
): JobMatchResult[] {
  const embeddedAchievements = achievements
    .filter((a): a is AchievementRow & { embedding: string } => !!a.embedding)
    .map((a) => ({ achievement: a, vector: parseVector(a.embedding) }));

  return jobRows.map((job) => {
    const jobVector = parseVector(job.embedding);
    const percent = similarityToPercent(dot(jobVector, queryEmbedding));

    const rankedAchievements = embeddedAchievements
      .map(({ achievement, vector }) => ({
        achievement,
        similarity: dot(vector, jobVector),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, MAX_SUPPORTING_ACHIEVEMENTS);

    const topAchievement = rankedAchievements[0]?.achievement;

    return {
      jobId: job.id,
      recruiterId: job.recruiter_id,
      title: job.title,
      location: job.location,
      employmentType: job.employment_type,
      workMode: job.work_mode,
      shortDescription: job.description,
      applicationUrl: job.application_url,
      matchScore: percent,
      matchLabel: matchLabel(percent),
      matchSentence: topAchievement
        ? buildMatchSentence(topAchievement)
        : `This role's description aligns with your published work.`,
      achievements: rankedAchievements.map(({ achievement, similarity }) => ({
        id: achievement.id,
        title: achievement.title,
        shortDescription: achievement.short_description,
        similarity: similarityToPercent(similarity) / 100,
      })),
    };
  });
}
