import { supabase } from "../lib/supabase";
import { listPublishedJobs, listRecruiterProfilesPublic } from "../recruiter/recruiterStore";
import type { JobListing, JobMatchResult } from "../recruiter/types";

// Real Supabase Postgres reads/Edge Function call, same pattern as
// recruiter/matchingStore.ts on the other side of the same engine.

interface MatchJobsResponse {
  matches: JobMatchResult[];
  hasPublishedAchievements: boolean;
}

// supabase-js's own error.message for a non-2xx Edge Function response is
// always the generic "Edge Function returned a non-2xx status code" — see
// the identical helper in recruiter/matchingStore.ts, duplicated here
// rather than shared since it's a few lines and the two call sites have
// no other reason to depend on each other.
async function extractEdgeFunctionErrorMessage(error: {
  message?: string;
  context?: Response;
}): Promise<string> {
  const fallback = error.message || "The matching service request failed.";
  if (!error.context || typeof error.context.json !== "function") {
    return fallback;
  }
  try {
    const body: unknown = await error.context.json();
    if (
      body &&
      typeof body === "object" &&
      typeof (body as { error?: unknown }).error === "string"
    ) {
      return (body as { error: string }).error;
    }
  } catch {
    // Response body wasn't JSON (or already consumed) — use the fallback.
  }
  return fallback;
}

// Calls match-jobs-for-candidate — always matches against the CALLER's
// own published Achievements and profile (no candidate id to pass). See
// that function's header comment for the full pipeline.
export async function matchJobsForCandidate(): Promise<MatchJobsResponse> {
  const { data, error } = await supabase.functions.invoke<MatchJobsResponse>(
    "match-jobs-for-candidate",
    { body: {} },
  );

  if (error) {
    throw new Error(await extractEdgeFunctionErrorMessage(error));
  }
  if (!data) {
    throw new Error("The matching service returned an unexpected response.");
  }
  return data;
}

// Every published job, unscored — the "All Jobs" section's base data.
// Opportunities.tsx overlays scored fields from matchJobsForCandidate's
// result on top of this for jobs that got a score, keeping "no embedding
// yet" jobs visible (rule 6) rather than hidden.
export async function listAllJobListings(): Promise<JobListing[]> {
  const jobs = await listPublishedJobs();
  const recruiterIds = Array.from(new Set(jobs.map((job) => job.recruiter_id)));
  const companies = await listRecruiterProfilesPublic(recruiterIds);
  const companyByRecruiterId = new Map(companies.map((c) => [c.user_id, c]));

  return jobs.map((job) => {
    const company = companyByRecruiterId.get(job.recruiter_id);
    return {
      jobId: job.id,
      recruiterId: job.recruiter_id,
      title: job.title,
      companyName: company?.company_name?.trim() || "A company",
      companyLogoUrl: company?.company_logo_url ?? null,
      location: job.location,
      workMode: job.work_mode,
      employmentType: job.employment_type,
      shortDescription: job.description,
      applicationUrl: job.application_url,
      createdAt: job.created_at,
      matchScore: null,
      matchLabel: null,
      matchSentence: null,
      achievements: [],
    };
  });
}
