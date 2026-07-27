// Field names match the Postgres columns verbatim (snake_case) — same
// convention as auth/types.ts's Profile and types/feed.ts's FeedPost,
// since both recruiter_profiles and jobs are real Supabase-backed tables.
// See supabase/recruiter_accounts.sql and supabase/jobs.sql.

import type { CertificationEntry, EducationEntry, ExperienceEntry } from "../types/grove";

// A Recruiter Grove "Featured Video" — deliberately just a link, not an
// upload (no video storage anywhere in this app) — see
// recruiter_grove_profile.sql.
export interface VideoEntry {
  id: string;
  title: string;
  url: string;
}

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
  // Recruiter Grove fields — see recruiter_grove_profile.sql. experience/
  // education/certifications reuse candidate_profiles' exact jsonb shape
  // (types/grove.ts) verbatim, camelCase-as-stored.
  professional_bio: string;
  hiring_philosophy: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications: CertificationEntry[];
  industry: string;
  team_or_department: string;
  company_description: string;
  hiring_domains: string[];
  hiring_skills: string[];
  // Seniority levels recruited for (Internship/New Grad/Mid Level/...) —
  // distinct from hiring_roles (what) and hiring_domains (which fields).
  // See recruiter_grove_hiring_levels.sql.
  hiring_levels: string[];
  videos: VideoEntry[];
  created_at: string;
  updated_at: string;
}

// What the signup wizard / Recruiter Grove editor sends — user_id is
// supplied separately by recruiterStore.ts (from the authenticated
// caller), never taken from here. The Grove fields are optional: the
// signup wizard's createRecruiterProfile call never sets them (Postgres
// applies the column defaults on insert — see recruiter_grove_profile.sql)
// — only RecruiterGroveEditor.tsx sets them, on update.
export interface RecruiterProfileInput {
  work_email: string;
  company_name: string;
  job_title: string;
  company_website: string | null;
  company_location: string | null;
  company_logo_url: string | null;
  hiring_locations: string[];
  hiring_roles: string[];
  professional_bio?: string;
  hiring_philosophy?: string;
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  certifications?: CertificationEntry[];
  industry?: string;
  team_or_department?: string;
  company_description?: string;
  hiring_domains?: string[];
  hiring_skills?: string[];
  hiring_levels?: string[];
  videos?: VideoEntry[];
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
  // Where "Apply Externally" sends a candidate — applying always happens
  // off-platform (see supabase/opportunities_matching.sql's header
  // comment); there is no internal application system to link to
  // instead.
  application_url: string;
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
  application_url: string;
  status: JobStatus;
}

// --- Candidate Opportunities (semantic candidate -> jobs matching) ------
// Same engine as CandidateMatch above (see match-jobs-for-candidate's
// header comment) — candidate-facing side of one shared matching engine,
// not a second algorithm.

// Public, non-sensitive slice of recruiter_profiles — see
// supabase/opportunities_matching.sql's recruiter_profiles_public view,
// widened by recruiter_posts_and_grove.sql and recruiter_grove_profile.sql
// to cover the full Recruiter Grove. work_email stays excluded.
export interface RecruiterProfilePublic {
  user_id: string;
  company_name: string;
  company_website: string | null;
  company_logo_url: string | null;
  company_location: string | null;
  job_title: string;
  hiring_roles: string[];
  hiring_locations: string[];
  professional_bio: string;
  hiring_philosophy: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications: CertificationEntry[];
  industry: string;
  team_or_department: string;
  company_description: string;
  hiring_domains: string[];
  hiring_skills: string[];
  hiring_levels: string[];
  videos: VideoEntry[];
}

export interface JobMatchAchievement {
  id: string;
  title: string;
  shortDescription: string;
  similarity: number; // 0-1
}

// Raw response shape from the match-jobs-for-candidate Edge Function —
// see that function's types.ts. state/opportunitiesStore.ts merges this
// onto the unscored JobListing entries below by jobId.
export interface JobMatchResult {
  jobId: string;
  recruiterId: string;
  title: string;
  location: string | null;
  employmentType: string;
  workMode: string;
  shortDescription: string;
  applicationUrl: string;
  matchScore: number;
  matchLabel: string;
  matchSentence: string;
  achievements: JobMatchAchievement[];
}

// One job as rendered on the Opportunities page — used for BOTH a scored
// "Recommended for You" card and an unscored "All Jobs" card (matchScore/
// matchLabel/matchSentence/achievements are null when this job has no
// embedding yet, or the candidate has no published Achievements to match
// with). companyName/companyLogoUrl/companyLocation are filled in
// client-side from RecruiterProfilePublic, keyed by recruiterId, the same
// way for both sections.
export interface JobListing {
  jobId: string;
  recruiterId: string;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  location: string | null;
  workMode: WorkMode;
  employmentType: EmploymentType;
  shortDescription: string;
  applicationUrl: string;
  createdAt: string;
  matchScore: number | null; // 0-100
  matchLabel: string | null;
  matchSentence: string | null;
  achievements: JobMatchAchievement[];
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
  matchLabel: string; // "Excellent Match" | "Strong Match" | "Good Match" | "Potential Match"
  matchSentence: string;
  achievements: MatchedAchievement[];
}
