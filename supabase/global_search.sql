-- Seed & Grove: global candidate/job search (Candidate Dashboard).
-- Run this once in the Supabase SQL editor.
--
-- No new table, view, or RLS policy — the search itself is two plain
-- ilike queries run directly from the client against surfaces that are
-- already safe and already granted: candidate_profiles_public (contact
-- fields already redacted there) and jobs (already RLS-scoped to
-- status = 'published' for any authenticated reader). This migration
-- only adds what makes `ilike '%term%'` fast: a plain btree index can't
-- accelerate a leading-wildcard match, so partial name/title search
-- needs pg_trgm's trigram index instead.

create extension if not exists pg_trgm;

create index if not exists candidate_profiles_full_name_trgm_idx
  on public.candidate_profiles
  using gin (full_name gin_trgm_ops);

create index if not exists jobs_title_trgm_idx
  on public.jobs
  using gin (title gin_trgm_ops);
