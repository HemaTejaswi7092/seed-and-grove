-- Seed & Grove: adds 'job_posted' to feed_posts.post_type — a distinct,
-- system-generated activity (a recruiter publishing a Job) from the
-- existing recruiter Company Post types (company_award, hiring_announcement,
-- team_achievement, industry_update, company_news — see
-- recruiter_posts_and_grove.sql), which stay manually composed. Run this
-- once in the Supabase SQL editor, after recruiter_posts_and_grove.sql.

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
    'company_news',
    'job_posted'
  )
);
