-- Seed & Grove: published Seeds (Projects) — the Postgres mirror that
-- lets Grove's "Projects & Skills" section reach recruiters at all.
-- Run this once in the Supabase SQL editor, after setup.sql.
--
-- Seeds themselves live in localStorage, not Postgres (see
-- state/seedStore.ts's header comment, and grove_achievements.sql's own
-- note on the same constraint) — a recruiter loading another candidate's
-- profile has no way to read that candidate's browser storage. This
-- table is the read surface that makes published Seeds visible to
-- anyone else, following the exact same pattern grove_achievements.sql
-- already established for Achievements: the local record stays the
-- editable working copy, this row is written (or deleted) at the moment
-- of publish/unpublish, and Grove/recruiter pages read only from here
-- for anything beyond the owner's own session.
--
-- `id` is NOT a default gen_random_uuid(), and deliberately NOT typed
-- uuid at all — local Seed ids are generated as "seed-<timestamp>-<rand>"
-- strings (see state/seedStore.ts's generateId), not real UUIDs, unlike
-- Achievement ids (crypto.randomUUID()). This must be supplied by the
-- client as the exact same id as the local Seed record, so a later
-- lifecycle change (complete/reopen/archive/unarchive) or link edit can
-- re-upsert the same row, and grove_achievements.project_id (already a
-- plain text field, not a FK, for this same reason) continues to line up
-- with it.
--
-- Deliberately holds only what a public Project card needs to render —
-- not the full Seed shape (no conversation history, no activity log, no
-- progress percentage, nothing else from the private workspace).

create table if not exists public.grove_seeds (
  id text primary key,
  candidate_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  technologies text[] not null default '{}',
  status text not null default '',
  lifecycle_status text not null default 'in_progress' check (
    lifecycle_status in ('in_progress', 'completed', 'archived')
  ),
  repo_url text,
  demo_url text,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.grove_seeds enable row level security;

-- Owner-only writes — only state/seedPublishing.ts, acting on behalf of
-- the authenticated candidate, ever inserts/updates/deletes here.
drop policy if exists "Candidates can insert their own seeds" on public.grove_seeds;
create policy "Candidates can insert their own seeds"
  on public.grove_seeds for insert
  with check (auth.uid() = candidate_id);

drop policy if exists "Candidates can update their own seeds" on public.grove_seeds;
create policy "Candidates can update their own seeds"
  on public.grove_seeds for update
  using (auth.uid() = candidate_id)
  with check (auth.uid() = candidate_id);

drop policy if exists "Candidates can delete their own seeds" on public.grove_seeds;
create policy "Candidates can delete their own seeds"
  on public.grove_seeds for delete
  using (auth.uid() = candidate_id);

-- Any authenticated user can read — recruiters viewing a candidate's
-- Grove, and the candidate's own Grove page, both read through this
-- same policy. Every row is, by construction, something the candidate
-- explicitly published; nothing private/draft ever reaches this table.
drop policy if exists "Authenticated users can read published seeds" on public.grove_seeds;
create policy "Authenticated users can read published seeds"
  on public.grove_seeds for select
  to authenticated
  using (true);

-- A single candidate's own published Seeds (Grove + recruiter profile).
create index if not exists grove_seeds_candidate_idx
  on public.grove_seeds (candidate_id, published_at desc);

-- Reuses the set_updated_at() trigger function already created by
-- setup.sql — run that file first if you haven't.
drop trigger if exists set_grove_seeds_updated_at on public.grove_seeds;
create trigger set_grove_seeds_updated_at
  before update on public.grove_seeds
  for each row execute procedure public.set_updated_at();
