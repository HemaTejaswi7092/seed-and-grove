import { supabase } from "../lib/supabase";
import { listRecruiterProfilesPublic } from "../recruiter/recruiterStore";
import { matchRank } from "../lib/searchRank";
import type { CandidateProfilePublic } from "../types/grove";
import type { EmploymentType, RecruiterProfilePublic, WorkMode } from "../recruiter/types";

// Global Dashboard search — plain ilike queries against surfaces that are
// already safe to read (see supabase/global_search.sql's header comment):
// candidate_profiles_public already redacts contact_email/resume_url,
// recruiter_profiles_public already excludes work_email (see
// opportunities_matching.sql), and jobs is already RLS-scoped to
// status = 'published' for any authenticated reader. No new table, view,
// RPC, or policy — this file only adds the query shape, not new access.

// The final, displayed result count.
const DISPLAY_LIMIT = 5;
// What's actually fetched from the DB before ranking — wider than
// DISPLAY_LIMIT so relevance sorting (exact > prefix > partial) has more
// than just "whichever 5 rows the DB happened to return first" to work
// with. Still a small, bounded query, not an unbounded scan.
const FETCH_LIMIT = 20;

export interface CandidateSearchResult {
  kind: "candidate";
  candidateId: string;
  fullName: string;
  avatarUrl: string | null;
  headline: string;
  location: string;
}

// A recruiter's personal name is never public anywhere in this app
// (profiles' RLS is own-row-only — see setup.sql; Recruiter Grove and
// Company Posts identify recruiters by company, never a personal name,
// by deliberate design). Searching recruiters by company_name/job_title
// — both already public on recruiter_profiles_public — mirrors that
// existing boundary instead of introducing a new exposure.
export interface RecruiterSearchResult {
  kind: "recruiter";
  recruiterId: string;
  companyName: string;
  companyLogoUrl: string | null;
  jobTitle: string;
  companyLocation: string | null;
}

// One "People" result can be either — GlobalSearchBar renders and routes
// each according to `kind`.
export type PersonSearchResult = CandidateSearchResult | RecruiterSearchResult;

export interface JobSearchResult {
  jobId: string;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  location: string | null;
  workMode: WorkMode;
  employmentType: EmploymentType;
}

const CANDIDATE_COLUMNS = "user_id, full_name, avatar_url, headline, location";
const RECRUITER_COLUMNS = "user_id, company_name, company_logo_url, job_title, company_location";

function toCandidateResult(row: CandidateProfilePublic): CandidateSearchResult {
  return {
    kind: "candidate",
    candidateId: row.user_id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    headline: row.headline,
    location: row.location,
  };
}

function toRecruiterResult(row: RecruiterProfilePublic): RecruiterSearchResult {
  return {
    kind: "recruiter",
    recruiterId: row.user_id,
    companyName: row.company_name,
    companyLogoUrl: row.company_logo_url,
    jobTitle: row.job_title,
    companyLocation: row.company_location,
  };
}

// Matches full_name OR headline — run as two separate ilike queries
// (rather than one .or() filter) so a search term containing characters
// PostgREST's filter-string syntax treats specially (a comma, a
// parenthesis) can't break or be misinterpreted by the query; the results
// are just merged and deduped by candidateId afterward. Ranked by the
// BEST match across either field: a candidate whose headline exactly
// matches ranks as an exact match even if their name doesn't, e.g.
// searching "Data Analyst" surfaces someone with that headline even when
// their name has nothing to do with it. Returns every match found (not
// sliced to a display limit yet) so searchPeople can rank candidates and
// recruiters together before cutting down to one combined list.
async function rankedCandidates(
  term: string,
): Promise<{ result: CandidateSearchResult; rank: number }[]> {
  const [byName, byHeadline] = await Promise.all([
    supabase
      .from("candidate_profiles_public")
      .select(CANDIDATE_COLUMNS)
      .ilike("full_name", `%${term}%`)
      .limit(FETCH_LIMIT),
    supabase
      .from("candidate_profiles_public")
      .select(CANDIDATE_COLUMNS)
      .ilike("headline", `%${term}%`)
      .limit(FETCH_LIMIT),
  ]);

  if (byName.error) throw new Error(byName.error.message);
  if (byHeadline.error) throw new Error(byHeadline.error.message);

  const merged = new Map<string, CandidateProfilePublic>();
  for (const row of [
    ...((byName.data ?? []) as CandidateProfilePublic[]),
    ...((byHeadline.data ?? []) as CandidateProfilePublic[]),
  ]) {
    merged.set(row.user_id, row);
  }

  return Array.from(merged.values()).map((row) => ({
    result: toCandidateResult(row),
    rank: Math.min(matchRank(term, row.full_name), matchRank(term, row.headline)),
  }));
}

// Same shape as rankedCandidates, on recruiter_profiles_public's
// company_name/job_title instead of full_name/headline — see
// RecruiterSearchResult's header comment for why those specific fields.
async function rankedRecruiters(
  term: string,
): Promise<{ result: RecruiterSearchResult; rank: number }[]> {
  const [byCompany, byTitle] = await Promise.all([
    supabase
      .from("recruiter_profiles_public")
      .select(RECRUITER_COLUMNS)
      .ilike("company_name", `%${term}%`)
      .limit(FETCH_LIMIT),
    supabase
      .from("recruiter_profiles_public")
      .select(RECRUITER_COLUMNS)
      .ilike("job_title", `%${term}%`)
      .limit(FETCH_LIMIT),
  ]);

  if (byCompany.error) throw new Error(byCompany.error.message);
  if (byTitle.error) throw new Error(byTitle.error.message);

  const merged = new Map<string, RecruiterProfilePublic>();
  for (const row of [
    ...((byCompany.data ?? []) as RecruiterProfilePublic[]),
    ...((byTitle.data ?? []) as RecruiterProfilePublic[]),
  ]) {
    merged.set(row.user_id, row);
  }

  return Array.from(merged.values()).map((row) => ({
    result: toRecruiterResult(row),
    rank: Math.min(matchRank(term, row.company_name), matchRank(term, row.job_title)),
  }));
}

// The "People" search — candidates AND recruiters together, ranked by the
// same relevance tiers (exact > prefix > partial) across both, not two
// separate lists competing for space. Previously this only ever searched
// candidates; recruiters had no code path into search at all.
export async function searchPeople(
  query: string,
  limit = DISPLAY_LIMIT,
): Promise<PersonSearchResult[]> {
  const term = query.trim();
  if (!term) return [];

  const [candidates, recruiters] = await Promise.all([
    rankedCandidates(term),
    rankedRecruiters(term),
  ]);

  return [...candidates, ...recruiters]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map(({ result }) => result);
}

export async function searchJobs(
  query: string,
  limit = DISPLAY_LIMIT,
): Promise<JobSearchResult[]> {
  const term = query.trim();
  if (!term) return [];

  const { data, error } = await supabase
    .from("jobs")
    .select("id, recruiter_id, title, location, work_mode, employment_type")
    .eq("status", "published")
    .ilike("title", `%${term}%`)
    .limit(FETCH_LIMIT);

  if (error) throw new Error(error.message);
  const jobs = (data ?? []) as {
    id: string;
    recruiter_id: string;
    title: string;
    location: string | null;
    work_mode: WorkMode;
    employment_type: EmploymentType;
  }[];
  if (jobs.length === 0) return [];

  // Ranked and cut down to `limit` BEFORE the company lookup, so that
  // lookup only ever covers the jobs actually shown.
  const rankedJobs = jobs
    .slice()
    .sort((a, b) => matchRank(term, a.title) - matchRank(term, b.title))
    .slice(0, limit);

  const recruiterIds = Array.from(new Set(rankedJobs.map((job) => job.recruiter_id)));
  const companies = await listRecruiterProfilesPublic(recruiterIds);
  const companyByRecruiterId = new Map(companies.map((c) => [c.user_id, c]));

  return rankedJobs.map((job) => {
    const company = companyByRecruiterId.get(job.recruiter_id);
    return {
      jobId: job.id,
      title: job.title,
      companyName: company?.company_name?.trim() || "A company",
      companyLogoUrl: company?.company_logo_url ?? null,
      location: job.location,
      workMode: job.work_mode,
      employmentType: job.employment_type,
    };
  });
}
