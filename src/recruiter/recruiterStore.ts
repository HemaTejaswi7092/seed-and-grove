import { supabase } from "../lib/supabase";
import { buildJobEmbeddingText } from "../lib/jobEmbeddingText";
import { embedText } from "../services/ai/embedText";
import type {
  Job,
  JobInput,
  RecruiterProfile,
  RecruiterProfileInput,
  RecruiterProfilePublic,
} from "./types";

// Real Supabase Postgres, like feedStore.ts and unlike seedStore.ts —
// see supabase/recruiter_accounts.sql and supabase/jobs.sql for why.
// Row Level Security (not this file) is what actually enforces that a
// recruiter can only read/write their own rows; userId/recruiterId here
// are passed through from the authenticated caller, matching the
// codebase's established convention, never inferred silently.

// --- Recruiter profile -------------------------------------------------

export async function getRecruiterProfile(
  userId: string,
): Promise<RecruiterProfile | null> {
  const { data, error } = await supabase
    .from("recruiter_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as RecruiterProfile | null) ?? null;
}

export async function createRecruiterProfile(
  userId: string,
  input: RecruiterProfileInput,
): Promise<RecruiterProfile> {
  const { data, error } = await supabase
    .from("recruiter_profiles")
    .insert({ user_id: userId, ...input })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as RecruiterProfile;
}

export async function updateRecruiterProfile(
  userId: string,
  input: Partial<RecruiterProfileInput>,
): Promise<RecruiterProfile> {
  const { data, error } = await supabase
    .from("recruiter_profiles")
    .update(input)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as RecruiterProfile;
}

// --- Jobs ----------------------------------------------------------------

// Re-embeds whenever the payload carries the full semantic fields
// (title + description — always true for a real form submit from
// RecruiterJobForm.tsx). A partial update that doesn't touch those, like
// archiveJob's `{ status: 'closed' }`, leaves the embedding fields out of
// the payload entirely rather than recomputing from missing text — same
// "omit, don't clobber with a wrong value" rule as
// state/achievements.ts's toPublishedInput. Best-effort: embedText()
// never throws, so a failed embed call never blocks saving the job.
async function withJobEmbedding<T extends Partial<JobInput>>(
  input: T,
): Promise<T & { embedding?: number[]; embedding_model?: string; embedding_updated_at?: string }> {
  if (input.title === undefined || input.description === undefined) return input;

  const embedding = await embedText(
    buildJobEmbeddingText({
      title: input.title,
      description: input.description,
      required_skills: input.required_skills ?? [],
      preferred_skills: input.preferred_skills ?? [],
    }),
  );
  if (!embedding) return input;

  return {
    ...input,
    embedding,
    embedding_model: "gte-small",
    embedding_updated_at: new Date().toISOString(),
  };
}

export async function listJobs(recruiterId: string): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("recruiter_id", recruiterId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Job[];
}

export async function getJob(
  recruiterId: string,
  jobId: string,
): Promise<Job | null> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("recruiter_id", recruiterId)
    .eq("id", jobId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Job | null) ?? null;
}

export async function createJob(
  recruiterId: string,
  input: JobInput,
): Promise<Job> {
  const payload = await withJobEmbedding(input);
  const { data, error } = await supabase
    .from("jobs")
    .insert({ recruiter_id: recruiterId, ...payload })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Job;
}

export async function updateJob(
  jobId: string,
  input: Partial<JobInput>,
): Promise<Job> {
  const payload = await withJobEmbedding(input);
  const { data, error } = await supabase
    .from("jobs")
    .update(payload)
    .eq("id", jobId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Job;
}

// "Archive" — a UI action, not a distinct status. See types.ts's JobStatus.
export async function archiveJob(jobId: string): Promise<Job> {
  return updateJob(jobId, { status: "closed" });
}

export async function deleteJob(jobId: string): Promise<void> {
  const { error } = await supabase.from("jobs").delete().eq("id", jobId);
  if (error) throw new Error(error.message);
}

// --- Candidate-facing reads (Opportunities) -------------------------------
// Every published job, for any authenticated candidate — see
// opportunities_matching.sql's "Authenticated users can read published
// jobs" policy. Used for the Opportunities page's "All Jobs" section
// (unscored jobs included) and job detail views; recruiter-owned
// draft/closed jobs never come back through these.

export async function listPublishedJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Job[];
}

export async function getPublishedJob(jobId: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Job | null) ?? null;
}

// --- Recruiter company info (public slice) --------------------------------
// See opportunities_matching.sql's recruiter_profiles_public view —
// company_name/logo/location only, never work_email/job_title.

export async function getRecruiterProfilePublic(
  recruiterId: string,
): Promise<RecruiterProfilePublic | null> {
  const { data, error } = await supabase
    .from("recruiter_profiles_public")
    .select("*")
    .eq("user_id", recruiterId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as RecruiterProfilePublic | null) ?? null;
}

export async function listRecruiterProfilesPublic(
  recruiterIds: string[],
): Promise<RecruiterProfilePublic[]> {
  if (recruiterIds.length === 0) return [];
  const { data, error } = await supabase
    .from("recruiter_profiles_public")
    .select("*")
    .in("user_id", recruiterIds);

  if (error) throw new Error(error.message);
  return (data ?? []) as RecruiterProfilePublic[];
}
