// This function takes no request body — it always matches against the
// CALLER's own published Achievements and profile (via their JWT), never
// an arbitrary candidate id. See index.ts.

// A candidate's own published Achievement, read directly from
// grove_achievements (not through match_achievements — there's no query
// embedding to rank against yet at this point, every one of the
// candidate's own published Achievements is used to build their
// aggregate representation). `embedding` comes back from PostgREST as a
// pgvector text literal ("[0.1,0.2,...]") — parsed in matching.ts.
export interface AchievementRow {
  id: string;
  title: string;
  short_description: string;
  skills_demonstrated: string[];
  technologies_used: string[];
  project_domain: string;
  candidate_contribution: string;
  outcome_or_impact: string;
  relevant_roles: string[];
  embedding: string | null;
}

export interface CandidateProfileRow {
  headline: string;
  roles_of_interest: string;
  about_interests: string;
  about_direction: string;
  work_mode: string;
}

// Row shape returned by the match_jobs() Postgres function (a superset —
// it also returns its own `similarity`, which matching.ts deliberately
// ignores and recomputes in JS instead, so every job is scored the exact
// same way regardless of whether its embedding came from the RPC or was
// just backfilled on demand in this request — see index.ts). Also used,
// with `embedding` filled in after an on-demand embed call, for published
// jobs that had no embedding yet.
export interface JobMatchRow {
  id: string;
  recruiter_id: string;
  title: string;
  location: string | null;
  employment_type: string;
  work_mode: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  application_url: string;
  created_at: string;
  embedding: string; // pgvector text literal, parsed in matching.ts
}

// A published job read directly (not through match_jobs) — used to find
// jobs missing an embedding so one can be generated for them before
// scoring. Same fields as JobMatchRow minus `embedding`.
export interface UnembeddedJobRow {
  id: string;
  recruiter_id: string;
  title: string;
  location: string | null;
  employment_type: string;
  work_mode: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  application_url: string;
  created_at: string;
}

export interface RecruiterProfilePublicRow {
  user_id: string;
  company_name: string;
  company_logo_url: string | null;
  company_location: string | null;
}

export interface MatchedAchievement {
  id: string;
  title: string;
  shortDescription: string;
  similarity: number;
}

// What the frontend renders on a scored job card — see
// src/components/opportunities/JobMatchCard.tsx. Same concise shape as
// the recruiter side's CandidateMatchResult: no long responsibilities/
// skills/gaps sections.
export interface JobMatchResult {
  jobId: string;
  recruiterId: string;
  title: string;
  location: string | null;
  employmentType: string;
  workMode: string;
  shortDescription: string;
  applicationUrl: string;
  matchScore: number; // 0-100
  matchLabel: string;
  matchSentence: string;
  achievements: MatchedAchievement[];
}
