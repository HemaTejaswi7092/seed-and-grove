-- Seed & Grove: the private Seed record — the Seed Workspace's source of
-- truth going forward, replacing what used to live only in localStorage
-- (see state/seedStore.ts's old header comment: "Seeds and their
-- achievements aren't in Supabase yet"). Run this once in the Supabase
-- SQL editor, after setup.sql.
--
-- This is deliberately a SEPARATE table from grove_seeds, not a merge into
-- it — same reason candidate_profiles has a private base table plus a
-- public candidate_profiles_public view (see candidate_profiles.sql):
-- grove_seeds is meant to be publicly readable (any authenticated user —
-- recruiters, other candidates), while a draft/private Seed must never be.
-- grove_seeds stays exactly what it already was: a published-snapshot
-- mirror kept in sync by state/seedPublishing.ts, now syncing FROM this
-- table instead of from localStorage. Both share the same `id` (see
-- seedPublishing.ts), which is what "Grove publication references the
-- same persisted Seed" (not a coincidentally-matching second id) actually
-- means here.
--
-- id stays `text`, matching grove_seeds.id's existing type — new Seeds are
-- created with crypto.randomUUID() client-side (a valid text value, same
-- convention already used for Achievement ids), so no migration of
-- grove_seeds.id's type is needed.

create table if not exists public.seeds (
  id text primary key,
  candidate_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  source_type text not null default 'manual'
    check (source_type in ('manual', 'github', 'imported', 'generated')),
  status text not null default 'Just Started',
  technologies text[] not null default '{}',
  progress integer not null default 0,
  is_published boolean not null default false,
  published_at timestamptz,
  lifecycle_status text not null default 'in_progress'
    check (lifecycle_status in ('in_progress', 'completed', 'archived')),
  completed_at timestamptz,
  repo_url text not null default '',
  demo_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.seeds enable row level security;

-- Private, owner-only — unlike grove_seeds, there is no "anyone
-- authenticated can read" policy here at all. A draft Seed is never
-- visible to anyone but the candidate who owns it.
drop policy if exists "Candidates can read their own seeds" on public.seeds;
create policy "Candidates can read their own seeds"
  on public.seeds for select
  using (auth.uid() = candidate_id);

drop policy if exists "Candidates can insert their own seeds" on public.seeds;
create policy "Candidates can insert their own seeds"
  on public.seeds for insert
  with check (auth.uid() = candidate_id);

drop policy if exists "Candidates can update their own seeds" on public.seeds;
create policy "Candidates can update their own seeds"
  on public.seeds for update
  using (auth.uid() = candidate_id)
  with check (auth.uid() = candidate_id);

drop policy if exists "Candidates can delete their own seeds" on public.seeds;
create policy "Candidates can delete their own seeds"
  on public.seeds for delete
  using (auth.uid() = candidate_id);

create index if not exists seeds_candidate_id_idx
  on public.seeds (candidate_id, updated_at desc);

-- Reuses the set_updated_at() trigger function already created by
-- setup.sql.
drop trigger if exists set_seeds_updated_at on public.seeds;
create trigger set_seeds_updated_at
  before update on public.seeds
  for each row execute procedure public.set_updated_at();
