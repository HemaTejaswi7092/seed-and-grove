-- Seed & Grove: expand recruiter_profiles so Recruiter Grove can show a
-- full professional profile, not just company/jobs. Run this once in the
-- Supabase SQL editor, after recruiter_posts_and_grove.sql.
--
-- experience/education/certifications reuse the exact same jsonb-array-
-- of-small-objects shape candidate_profiles already uses (see
-- candidate_settings.sql) — same TypeScript types (ExperienceEntry/
-- EducationEntry/CertificationEntry from types/grove.ts) are reused
-- verbatim on the frontend, stored camelCase-as-is, no key translation.

alter table public.recruiter_profiles
  add column if not exists professional_bio text not null default '',
  add column if not exists hiring_philosophy text not null default '',
  add column if not exists experience jsonb not null default '[]'::jsonb,
  add column if not exists education jsonb not null default '[]'::jsonb,
  add column if not exists certifications jsonb not null default '[]'::jsonb,
  add column if not exists industry text not null default '',
  add column if not exists team_or_department text not null default '',
  add column if not exists company_description text not null default '',
  add column if not exists hiring_domains text[] not null default '{}',
  add column if not exists hiring_skills text[] not null default '{}',
  add column if not exists videos jsonb not null default '[]'::jsonb;

-- Recruiter Grove has no privacy toggle (deliberate prototype
-- simplification carried over from recruiter_posts_and_grove.sql — always
-- public once set) — every new field above is safe to expose the same
-- way job_title/hiring_roles/hiring_locations already are. work_email
-- stays excluded.
drop view if exists public.recruiter_profiles_public;
create view public.recruiter_profiles_public as
select
  user_id,
  company_name,
  company_website,
  company_logo_url,
  company_location,
  job_title,
  hiring_roles,
  hiring_locations,
  professional_bio,
  hiring_philosophy,
  experience,
  education,
  certifications,
  industry,
  team_or_department,
  company_description,
  hiring_domains,
  hiring_skills,
  videos
from public.recruiter_profiles;

grant select on public.recruiter_profiles_public to authenticated;
