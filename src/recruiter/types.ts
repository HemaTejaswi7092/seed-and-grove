// Field names match the Postgres columns verbatim (snake_case) — same
// convention as auth/types.ts's Profile and types/feed.ts's FeedPost,
// since both recruiter_profiles and jobs are real Supabase-backed tables.
// See supabase/recruiter_accounts.sql and supabase/jobs.sql.

export interface RecruiterProfile {
  user_id: string;
  work_email: string;
  company_name: string;
  job_title: string;
  company_website: string | null;
  company_location: string | null;
  company_logo_url: string | null;
  hiring_locations: string[];
  hiring_roles: string[];
  created_at: string;
  updated_at: string;
}

// What the signup wizard / recruiter profile editor sends — user_id is
// supplied separately by recruiterStore.ts (from the authenticated
// caller), never taken from here.
export interface RecruiterProfileInput {
  work_email: string;
  company_name: string;
  job_title: string;
  company_website: string | null;
  company_location: string | null;
  company_logo_url: string | null;
  hiring_locations: string[];
  hiring_roles: string[];
}

export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "temporary";

export type WorkMode = "remote" | "hybrid" | "onsite";

// No ATS/pipeline states — see supabase/jobs.sql's header comment.
// "Archive" is a UI action that sets this to "closed", not a distinct
// fourth value.
export type JobStatus = "draft" | "published" | "closed";

export interface Job {
  id: string;
  recruiter_id: string;
  title: string;
  location: string | null;
  employment_type: EmploymentType;
  work_mode: WorkMode;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_level: string | null;
  education: string | null;
  work_authorization: string | null;
  status: JobStatus;
  created_at: string;
  updated_at: string;
}

export interface JobInput {
  title: string;
  location: string | null;
  employment_type: EmploymentType;
  work_mode: WorkMode;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_level: string | null;
  education: string | null;
  work_authorization: string | null;
  status: JobStatus;
}

// --- AI candidate matching (Phase B) ---------------------------------
// Response shape from the match-candidates Edge Function — camelCase,
// display-ready. Deliberately concise: no responsibilities/skills/
// technologies/gaps sections, just enough to act on. Every field traces
// back to a real, published Achievement — see that function's own header
// comment for the full retrieval → grouping → ranking pipeline.

export interface MatchedAchievement {
  id: string;
  title: string;
  shortDescription: string;
  similarity: number; // 0-1
}

export interface CandidateMatch {
  candidateId: string;
  name: string;
  headline: string;
  matchScore: number; // 0-100
  matchSentence: string;
  achievements: MatchedAchievement[];
}
