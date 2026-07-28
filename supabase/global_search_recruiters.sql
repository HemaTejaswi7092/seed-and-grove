-- Seed & Grove: extend global search to recruiters (Candidate Dashboard).
-- Run this once in the Supabase SQL editor, after global_search.sql and
-- recruiter_grove_profile.sql.
--
-- Mirrors global_search.sql's candidate_profiles_full_name_trgm_idx exactly,
-- same reasoning: a plain btree index can't accelerate a leading-wildcard
-- ilike '%term%' match, so partial company-name search needs pg_trgm's
-- trigram index instead. No new table, view, or RLS policy — recruiter
-- search reads recruiter_profiles_public, which is already granted to
-- `authenticated` and already excludes work_email (see
-- opportunities_matching.sql). Indexes company_name only, not job_title,
-- matching the existing precedent for candidates (full_name is indexed,
-- the secondary field `headline` is searched without one).

create index if not exists recruiter_profiles_company_name_trgm_idx
  on public.recruiter_profiles
  using gin (company_name gin_trgm_ops);
