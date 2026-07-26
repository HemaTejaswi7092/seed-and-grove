import { supabase } from "../lib/supabase";
import type {
  Job,
  JobInput,
  RecruiterProfile,
  RecruiterProfileInput,
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
  const { data, error } = await supabase
    .from("jobs")
    .insert({ recruiter_id: recruiterId, ...input })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Job;
}

export async function updateJob(
  jobId: string,
  input: Partial<JobInput>,
): Promise<Job> {
  const { data, error } = await supabase
    .from("jobs")
    .update(input)
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
