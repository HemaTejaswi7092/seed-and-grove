-- Seed & Grove: Candidate Settings — Professional Profile, Career
-- Preferences, Public Links & Contact, Professional Skills.
-- Run this once in the Supabase SQL editor, after candidate_profiles.sql.
--
-- Extends candidate_profiles (still the single source of truth — no new
-- table) with the fields Settings needs, and replaces candidate_profiles_
-- public with a version that passes them all through. Everything added
-- here is either public-by-default (career preferences, skills, avatar,
-- structured education/experience/certifications — all things a
-- candidate has already chosen to put on their profile) or gated the
-- same way contact_email already is (resume_url, but keyed off its own
-- resume_visible toggle now instead of piggybacking on contact_visible).
--
-- education/experience/certifications are jsonb arrays of small objects
-- (id/institution/degree/... etc. — shapes owned by the frontend, see
-- src/types/grove.ts) rather than a normalized child table: each is
-- edited and saved as one unit from a single Settings section, the same
-- way this whole row already is, and nothing here needs to be queried or
-- joined independently of its owning candidate.
--
-- professional_skills is a candidate-curated, manually-edited list for
-- recruiter readability ONLY — see this file's grant/comment below and
-- the Settings page's own header comment. It is never read by
-- match-jobs-for-candidate or match-candidates; those two continue to
-- build their semantic text solely from grove_achievements + the existing
-- interest/direction fields. Adding a column here does not wire it into
-- either matching Edge Function — that would be a separate, deliberate
-- change this migration does not make.

-- Dropped up front — education/experience's type change below can't run
-- while the view still depends on those columns; recreated further down
-- with the new, fuller column set.
drop view if exists public.candidate_profiles_public;

alter table public.candidate_profiles
  add column if not exists avatar_url text,
  add column if not exists certifications jsonb not null default '[]'::jsonb,
  add column if not exists professional_skills text[] not null default '{}',
  add column if not exists preferred_job_types text[] not null default '{}',
  add column if not exists preferred_locations text[] not null default '{}',
  add column if not exists availability_date date,
  add column if not exists requires_sponsorship boolean not null default false,
  add column if not exists years_of_experience text not null default '',
  add column if not exists website_url text,
  add column if not exists resume_visible boolean not null default false;

-- education/experience were single free-text fields before this
-- migration (see candidate_profiles.sql) — now structured jsonb arrays
-- of entries (shapes owned by the frontend, see src/types/grove.ts).
-- There's no reasonable way to turn a free-text paragraph into
-- structured {institution, degree, ...} entries, so this resets both to
-- an empty array rather than wrapping the old string in a fake entry;
-- candidates re-enter this once in Settings' new structured editors.
-- Only ever run once, and only against pre-launch data.
alter table public.candidate_profiles
  alter column education drop default,
  alter column education type jsonb using '[]'::jsonb,
  alter column education set default '[]'::jsonb,
  alter column experience drop default,
  alter column experience type jsonb using '[]'::jsonb,
  alter column experience set default '[]'::jsonb;

drop view if exists public.candidate_profiles_public;
create view public.candidate_profiles_public as
select
  user_id,
  full_name,
  avatar_url,
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
  certifications,
  professional_skills,
  preferred_job_types,
  preferred_locations,
  availability_date,
  work_authorization,
  requires_sponsorship,
  years_of_experience,
  resume_visible,
  case when resume_visible then resume_url else null end as resume_url,
  linkedin_url,
  github_url,
  portfolio_url,
  website_url,
  created_at,
  updated_at
from public.candidate_profiles;

grant select on public.candidate_profiles_public to authenticated;

-- --- Storage: avatars + resumes ------------------------------------------
-- Both buckets are public-read: the object path itself
-- ({user_id}/{filename}) is the only thing that could locate a file, and
-- that path is never exposed to anyone who isn't already authorized to
-- see it — recruiters only ever learn a URL by reading it off
-- candidate_profiles_public, which is exactly where resume_url is nulled
-- out server-side whenever resume_visible is false. That DB-level
-- redaction, not bucket privacy, is the actual enforcement point (same
-- design as contact_email above) — this mirrors the resume_url column
-- itself, which has always been a plain externally-hosted URL (e.g. a
-- Google Drive link) with the exact same trust model.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true, 5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes', 'resumes', true, 10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Anyone can read (both buckets are public); only the owning candidate
-- can write/replace/delete their own file, enforced by the first path
-- segment matching their own auth.uid() — the upload code (see
-- src/services/storage/profileFiles.ts) always uploads to
-- `${user.id}/...`, never anywhere else.
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Candidates can upload their own avatar" on storage.objects;
create policy "Candidates can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Candidates can update their own avatar" on storage.objects;
create policy "Candidates can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Candidates can delete their own avatar" on storage.objects;
create policy "Candidates can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Resume files are publicly accessible" on storage.objects;
create policy "Resume files are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'resumes');

drop policy if exists "Candidates can upload their own resume" on storage.objects;
create policy "Candidates can upload their own resume"
  on storage.objects for insert
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Candidates can update their own resume" on storage.objects;
create policy "Candidates can update their own resume"
  on storage.objects for update
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Candidates can delete their own resume" on storage.objects;
create policy "Candidates can delete their own resume"
  on storage.objects for delete
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
