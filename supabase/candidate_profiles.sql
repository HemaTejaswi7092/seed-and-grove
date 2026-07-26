-- Seed & Grove: candidate_profiles — Postgres home for Grove's public
-- profile fields (Recruiter Experience Phase A).
-- Run this once in the Supabase SQL editor, after setup.sql.
--
-- Replaces src/lib/groveProfile.ts's "TEMPORARY PERSISTENCE" localStorage
-- blob. Same reason Seeds/Achievements moved server-side: this data needs
-- to be readable by someone other than the owning browser (recruiters,
-- and any future public Grove view) — localStorage architecturally can't
-- do that.
--
-- Two-layer design, same pattern as grove_achievements:
--   1. `candidate_profiles` — the candidate's own editable copy. RLS is
--      strictly own-row (select/insert/update), matching `profiles` and
--      `recruiter_profiles`. This is what Grove.tsx's edit form reads and
--      writes.
--   2. `candidate_profiles_public` — a VIEW granted to `authenticated`.
--      Created without `security_invoker`, so it runs with the view
--      owner's privileges (the migration-running role, which bypasses
--      RLS) rather than the querying user's — the standard Postgres/
--      Supabase mechanism for exposing a public slice of an
--      owner-restricted table. `contact_email`/`resume_url` are nulled
--      out here whenever the candidate hasn't opted into
--      `contact_visible` — enforced in the query itself, not left to the
--      frontend to omit. This view is what the recruiter Discover feed
--      and recruiter candidate-profile route read; they never touch the
--      base table.
--
-- `full_name` is denormalized here (copied in at save time by the
-- client, from the same `profiles` row `lib/displayName.ts` already
-- resolves) for the same reason `feed_posts.author_name` is denormalized
-- — `profiles` RLS is own-row-only, so a recruiter reading this table
-- couldn't join to it for a name otherwise.
--
-- Scope note: every grant below is to `authenticated`, not `anon` — this
-- keeps Grove/candidate data readable by any signed-in user (candidate or
-- recruiter) but NOT by the public internet. A fully public, logged-out
-- Grove view is not part of this phase; enabling it later is one more
-- `grant ... to anon` + policy, no schema change.

create table if not exists public.candidate_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  headline text not null default '',
  bio text not null default '',
  location text not null default '',
  availability text not null default '',
  about_enjoys text not null default '',
  about_interests text not null default '',
  about_direction text not null default '',
  about_technologies text not null default '',
  open_to_opportunities boolean not null default false,
  roles_of_interest text not null default '',
  work_mode text not null default '',
  collaboration_interests text not null default '',
  -- Governs whether contact_email/resume_url are exposed through the
  -- public view below — the same opt-in toggle the candidate already
  -- controls from the Grove "Opportunities" edit section.
  contact_visible boolean not null default false,
  contact_email text not null default '',
  education text not null default '',
  experience text not null default '',
  work_authorization text not null default '',
  resume_url text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.candidate_profiles enable row level security;

drop policy if exists "Candidates can read own profile" on public.candidate_profiles;
create policy "Candidates can read own profile"
  on public.candidate_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Candidates can insert own profile" on public.candidate_profiles;
create policy "Candidates can insert own profile"
  on public.candidate_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Candidates can update own profile" on public.candidate_profiles;
create policy "Candidates can update own profile"
  on public.candidate_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No delete policy — a candidate clearing their Grove is "save it empty,"
-- not deleting the row; keeps the row's existence a stable anchor for
-- future features (e.g. Phase B's candidate_profiles join) rather than
-- something that can disappear mid-session.

drop trigger if exists set_candidate_profiles_updated_at on public.candidate_profiles;
create trigger set_candidate_profiles_updated_at
  before update on public.candidate_profiles
  for each row execute procedure public.set_updated_at();

-- Public read surface — see header comment for why this is a view
-- (default, non-security-invoker) rather than a second RLS policy on the
-- base table.
drop view if exists public.candidate_profiles_public;
create view public.candidate_profiles_public as
select
  user_id,
  full_name,
  headline,
  bio,
  location,
  availability,
  about_enjoys,
  about_interests,
  about_direction,
  about_technologies,
  open_to_opportunities,
  roles_of_interest,
  work_mode,
  collaboration_interests,
  contact_visible,
  case when contact_visible then contact_email else null end as contact_email,
  education,
  experience,
  work_authorization,
  case when contact_visible then resume_url else null end as resume_url,
  linkedin_url,
  github_url,
  portfolio_url,
  created_at,
  updated_at
from public.candidate_profiles;

grant select on public.candidate_profiles_public to authenticated;
