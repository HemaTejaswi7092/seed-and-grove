-- Seed & Grove: recruiter Company Posts + lightweight Recruiter Grove.
-- Run this once in the Supabase SQL editor, after feed_posts.sql and
-- opportunities_matching.sql.
--
-- Two small additions, both reusing existing tables rather than
-- introducing new ones — see feed_posts.sql's header comment for why a
-- feed post is a denormalized snapshot, not a live join.

-- 1. feed_posts: recruiters can now author posts too (RLS already allows
--    it — "Users can create their own posts" only checks auth.uid() =
--    user_id, no account_type check). author_account_type is a snapshot
--    like author_name, captured at publish time, so FeedPostCard can
--    branch its author link (candidate Grove vs. recruiter Grove) without
--    an extra join to profiles (whose RLS is still own-row-only).
alter table public.feed_posts
  add column if not exists author_account_type text not null default 'candidate'
    check (author_account_type in ('candidate', 'recruiter'));

alter table public.feed_posts drop constraint if exists feed_posts_post_type_check;
alter table public.feed_posts add constraint feed_posts_post_type_check check (
  post_type in (
    'project_started',
    'milestone_completed',
    'evidence_shared',
    'skill_demonstrated',
    'project_completed',
    'achievement_added',
    'grove_update',
    'company_award',
    'hiring_announcement',
    'team_achievement',
    'industry_update',
    'company_news'
  )
);

-- 2. recruiter_profiles_public: widen the existing view (defined in
--    opportunities_matching.sql) to also expose job_title, hiring_roles,
--    and hiring_locations — enough for a lightweight public Recruiter
--    Grove Hero/About without collecting any new data (all three are
--    already gathered by the signup wizard). work_email stays excluded.
drop view if exists public.recruiter_profiles_public;
create view public.recruiter_profiles_public as
select
  user_id,
  company_name,
  company_logo_url,
  company_location,
  job_title,
  hiring_roles,
  hiring_locations
from public.recruiter_profiles;

grant select on public.recruiter_profiles_public to authenticated;
