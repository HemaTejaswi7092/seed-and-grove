-- Seed & Grove: recruiter accounts (Phase A).
-- Run this once in the Supabase SQL editor, after setup.sql.
--
-- Recruiters use the SAME Supabase auth system as candidates — this is
-- not a second auth stack. account_type is just a column on the existing
-- profiles table; recruiter-specific fields live in their own table
-- (recruiter_profiles), kept separate from candidate profile fields.

-- 1. account_type on the existing profiles table --------------------------
alter table public.profiles
  add column if not exists account_type text not null default 'candidate'
  check (account_type in ('candidate', 'recruiter'));

-- 2. Recruiter-specific fields, in their own table -------------------------
-- Company info from recruiter signup Step 2 (required) and Step 3
-- (optional — logo/hiring locations/roles can be nil/empty).
create table if not exists public.recruiter_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  work_email text not null,
  company_name text not null,
  job_title text not null,
  company_website text,
  company_location text,
  company_logo_url text,
  hiring_locations text[] not null default '{}',
  hiring_roles text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recruiter_profiles enable row level security;

-- Same own-row-only pattern as profiles' RLS in setup.sql — no recruiter
-- can read another recruiter's company info.
drop policy if exists "Recruiters can read own recruiter profile" on public.recruiter_profiles;
create policy "Recruiters can read own recruiter profile"
  on public.recruiter_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Recruiters can insert own recruiter profile" on public.recruiter_profiles;
create policy "Recruiters can insert own recruiter profile"
  on public.recruiter_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Recruiters can update own recruiter profile" on public.recruiter_profiles;
create policy "Recruiters can update own recruiter profile"
  on public.recruiter_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists set_recruiter_profiles_updated_at on public.recruiter_profiles;
create trigger set_recruiter_profiles_updated_at
  before update on public.recruiter_profiles
  for each row execute procedure public.set_updated_at();

-- 3. Teach the existing signup trigger about account_type -------------------
-- Re-declares the same function from setup.sql with one addition: reads
-- account_type out of auth.users' metadata (set by
-- AuthContext.signUpWithEmail's 4th argument) so a recruiter signing up is
-- correctly marked as one from the moment their auth.users row is created
-- — this fires immediately on signUp(), before email confirmation, so it
-- works whether or not confirmation is required. Defaults to 'candidate'
-- when absent, matching the column's own default and every existing
-- candidate signup path (unchanged, still just full_name).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, account_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'account_type', 'candidate')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
