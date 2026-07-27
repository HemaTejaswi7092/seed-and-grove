-- Seed & Grove: adds Hiring Levels (Internship/New Grad/Mid Level/...) to
-- Recruiter Grove's Hiring Interests section, distinct from hiring_roles
-- (what) and hiring_domains (which fields) — this is seniority. Run this
-- once in the Supabase SQL editor, after recruiter_grove_profile.sql.

alter table public.recruiter_profiles
  add column if not exists hiring_levels text[] not null default '{}';

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
  hiring_levels,
  videos
from public.recruiter_profiles;

grant select on public.recruiter_profiles_public to authenticated;
