-- Seed & Grove: published Achievements (Phase 1 — candidate evidence
-- foundation for future recruiter discovery).
-- Run this once in the Supabase SQL editor, after setup.sql.
--
-- This table holds ONLY published Achievements. A private/draft
-- Achievement never gets a row here at all — presence in this table *is*
-- "published," so there is no visibility column to keep in sync. The
-- local (localStorage) Achievement record in state/seedStore.ts is the
-- editable working copy; state/achievements.ts is the ONLY code that ever
-- writes here, and it does so at the moment of publish/edit/unpublish/
-- delete, keeping this row and the local record from ever diverging.
--
-- `id` is NOT a default gen_random_uuid() — it must be supplied by the
-- client as the exact same id as the local Achievement record (a real
-- UUID generated client-side, see types/seed.ts's Achievement.id), so a
-- later edit or unpublish can target the same row from both sides without
-- a separate id-mapping table.
--
-- This is deliberately the single source of truth the product rule calls
-- for: "the same candidate-approved evidence shown in Grove should later
-- power recruiter matching." Grove reads from this table for published
-- Achievements; a future recruiter-discovery feature would query this
-- same table, never a second copy. No search/matching logic is built yet
-- — this migration only makes the table exist and be queryable.

create table if not exists public.grove_achievements (
  id uuid primary key,
  candidate_id uuid not null references auth.users (id) on delete cascade,
  -- Informational only, not a foreign key — Seeds live in localStorage,
  -- not Postgres (see state/seedStore.ts), so this can't be a real FK.
  project_id text not null,
  title text not null,
  short_description text not null default '',
  achievement_type text not null check (
    achievement_type in (
      'project',
      'milestone',
      'code',
      'dashboard',
      'document',
      'certification',
      'deployment',
      'research',
      'presentation',
      'award'
    )
  ),
  skills_demonstrated text[] not null default '{}',
  technologies_used text[] not null default '{}',
  project_domain text not null default '',
  candidate_contribution text not null default '',
  outcome_or_impact text not null default '',
  proof_url text,
  proof_label text,
  relevant_roles text[] not null default '{}',
  -- Reserved for future verification — nothing sets or reads this yet.
  verification_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.grove_achievements enable row level security;

-- Owner-only writes — only state/achievements.ts, acting on behalf of the
-- authenticated candidate, ever inserts/updates/deletes here.
drop policy if exists "Candidates can insert their own achievements" on public.grove_achievements;
create policy "Candidates can insert their own achievements"
  on public.grove_achievements for insert
  with check (auth.uid() = candidate_id);

drop policy if exists "Candidates can update their own achievements" on public.grove_achievements;
create policy "Candidates can update their own achievements"
  on public.grove_achievements for update
  using (auth.uid() = candidate_id)
  with check (auth.uid() = candidate_id);

drop policy if exists "Candidates can delete their own achievements" on public.grove_achievements;
create policy "Candidates can delete their own achievements"
  on public.grove_achievements for delete
  using (auth.uid() = candidate_id);

-- Any authenticated user can read — this is the read surface a future
-- recruiter-discovery feature will query (no matching logic built here).
-- Every row is, by construction, something the candidate explicitly
-- published; nothing private or draft ever reaches this table.
drop policy if exists "Authenticated users can read published achievements" on public.grove_achievements;
create policy "Authenticated users can read published achievements"
  on public.grove_achievements for select
  to authenticated
  using (true);

-- A single candidate's own Grove (own-profile read, most common query).
create index if not exists grove_achievements_candidate_idx
  on public.grove_achievements (candidate_id, created_at desc);

-- Reuses the set_updated_at() trigger function already created by
-- setup.sql — run that file first if you haven't.
drop trigger if exists set_grove_achievements_updated_at on public.grove_achievements;
create trigger set_grove_achievements_updated_at
  before update on public.grove_achievements
  for each row execute procedure public.set_updated_at();
