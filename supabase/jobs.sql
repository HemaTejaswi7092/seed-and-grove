-- Seed & Grove: recruiter Jobs (Phase A).
-- Run this once in the Supabase SQL editor, after recruiter_accounts.sql.
--
-- Unlike Seeds/Evidence (client-side localStorage — see state/seedStore.ts),
-- Jobs are real Postgres from the start: they're genuinely recruiter-owned
-- data with no prototype-era reason to defer a proper schema, and a future
-- phase (candidate discovery launched from a specific job) will need them
-- queryable server-side anyway.
--
-- No ATS/pipeline concepts here by design — status is only
-- draft/published/closed. "Archive" is a UI action that sets status to
-- 'closed'; there is no separate archived state.

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  location text,
  employment_type text not null
    check (employment_type in ('full_time', 'part_time', 'contract', 'internship', 'temporary')),
  work_mode text not null check (work_mode in ('remote', 'hybrid', 'onsite')),
  description text not null default '',
  required_skills text[] not null default '{}',
  preferred_skills text[] not null default '{}',
  experience_level text,
  education text,
  work_authorization text,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jobs enable row level security;

-- Owner-only in every direction — no public-read policy yet. Candidates
-- browsing published jobs isn't in this phase; adding that later is one
-- more policy, not a schema change.
drop policy if exists "Recruiters can read own jobs" on public.jobs;
create policy "Recruiters can read own jobs"
  on public.jobs for select
  using (auth.uid() = recruiter_id);

drop policy if exists "Recruiters can create own jobs" on public.jobs;
create policy "Recruiters can create own jobs"
  on public.jobs for insert
  with check (auth.uid() = recruiter_id);

drop policy if exists "Recruiters can update own jobs" on public.jobs;
create policy "Recruiters can update own jobs"
  on public.jobs for update
  using (auth.uid() = recruiter_id)
  with check (auth.uid() = recruiter_id);

drop policy if exists "Recruiters can delete own jobs" on public.jobs;
create policy "Recruiters can delete own jobs"
  on public.jobs for delete
  using (auth.uid() = recruiter_id);

create index if not exists jobs_recruiter_idx on public.jobs (recruiter_id, created_at desc);

drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at
  before update on public.jobs
  for each row execute procedure public.set_updated_at();
