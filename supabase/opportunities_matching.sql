-- Seed & Grove: candidate-side semantic Opportunities matching.
-- Run this once in the Supabase SQL editor, after achievement_embeddings.sql.
--
-- Mirrors that file's shape exactly, on the other side of the same
-- engine: jobs get the same embedding columns/index/RPC pattern
-- grove_achievements already has, so the SAME gte-small + pgvector
-- inner-product approach powers both directions (recruiter -> candidates
-- via match_achievements, candidate -> jobs via match_jobs below). No
-- second matching approach, just the other axis of the same one.

-- 1. Jobs: application URL (required for external-only Apply) + embedding
--    columns, same shape as grove_achievements'.
alter table public.jobs
  add column if not exists application_url text not null default '',
  add column if not exists embedding extensions.vector(384),
  add column if not exists embedding_model text,
  add column if not exists embedding_updated_at timestamptz;

create index if not exists jobs_embedding_idx
  on public.jobs
  using hnsw (embedding extensions.vector_ip_ops);

-- 2. Candidate read access to published jobs. jobs.sql only ever granted
--    owner-only access ("no public-read policy yet... adding that later
--    is one more policy, not a schema change" — that's this). Postgres
--    OR's multiple permissive SELECT policies together, so this adds
--    published-job visibility for every authenticated user WITHOUT
--    loosening a recruiter's existing full access to their own
--    draft/closed jobs.
drop policy if exists "Authenticated users can read published jobs" on public.jobs;
create policy "Authenticated users can read published jobs"
  on public.jobs for select
  to authenticated
  using (status = 'published');

-- 3. The job-side counterpart to match_achievements — same inner-product
--    trick (embeddings are pre-normalized by gte-small, so negative inner
--    product == cosine similarity). Returns `embedding` itself (unlike
--    match_achievements) because match-jobs-for-candidate needs it to
--    re-rank the candidate's OWN achievements against each specific job
--    for supporting evidence, not just the aggregate ranking score.
--
--    Defaults deliberately apply NO similarity floor (min_similarity=-1,
--    the lowest cosine similarity can ever be) and a generous match_count
--    — every published job with an embedding must get a real score, even
--    a weak one. Any "strongest matches only" filtering is a frontend
--    concern (the optional Recommended highlight), never a retrieval-time
--    cutoff here.
create or replace function public.match_jobs(
  query_embedding extensions.vector(384),
  match_count int default 1000,
  min_similarity float default -1
)
returns table (
  id uuid,
  recruiter_id uuid,
  title text,
  location text,
  employment_type text,
  work_mode text,
  description text,
  required_skills text[],
  preferred_skills text[],
  application_url text,
  created_at timestamptz,
  embedding extensions.vector(384),
  similarity float
)
language sql stable
as $$
  select
    j.id, j.recruiter_id, j.title, j.location, j.employment_type, j.work_mode,
    j.description, j.required_skills, j.preferred_skills, j.application_url,
    j.created_at, j.embedding,
    (-1) * (j.embedding <#> query_embedding) as similarity
  from public.jobs j
  where j.status = 'published'
    and j.embedding is not null
    and (j.embedding <#> query_embedding) < (-1) * min_similarity
  order by j.embedding <#> query_embedding
  limit match_count;
$$;

grant execute on function public.match_jobs(extensions.vector, int, float) to authenticated;

-- 4. Public, non-sensitive slice of recruiter_profiles — recruiter_accounts.sql
--    left this fully owner-only (like candidate_profiles started out; see
--    candidate_profiles.sql's header comment for the identical pattern).
--    A candidate reading a published job needs the company name/logo/
--    location; work_email and job_title stay private.
drop view if exists public.recruiter_profiles_public;
create view public.recruiter_profiles_public as
select
  user_id,
  company_name,
  company_logo_url,
  company_location
from public.recruiter_profiles;

grant select on public.recruiter_profiles_public to authenticated;
