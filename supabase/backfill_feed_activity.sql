-- Seed & Grove: one-time DATA backfill for the Community Feed redesign.
-- Run this once in the Supabase SQL editor, after feed_post_job_type.sql.
--
-- Root cause this fixes: publishing a Seed or an Achievement never
-- automatically created a feed_posts row — only the separate, manual
-- "Share to Feed" button did (see src/state/feedActivity.ts, now wired
-- into the actual publish/complete/achievement-publish moments going
-- forward). Every Seed/Achievement published *before* that fix has real,
-- public grove_seeds/grove_achievements rows but no feed_posts row at
-- all, so none of that existing activity shows up in the Community Feed
-- for any other user — exactly the reported bug ("Hema has multiple
-- published projects... none of Hema's published content appears").
--
-- Safe to re-run: each INSERT is guarded by WHERE NOT EXISTS, so a Seed/
-- Achievement that already has a matching feed_posts row (either from a
-- previous run of this script, or from someone's own explicit "Share to
-- Feed" click) is never touched or duplicated.

-- 1. Published Seeds with no project_started/project_completed post yet.
insert into public.feed_posts (
  user_id, seed_id, evidence_id, post_type, caption, author_name,
  author_account_type, project_title, achievement_title, evidence_summary,
  skills, visibility
)
select
  gs.candidate_id,
  gs.id,
  null,
  case when gs.lifecycle_status = 'completed' then 'project_completed' else 'project_started' end,
  concat(coalesce(p.full_name, 'A builder'), ' published "', gs.title, '" to Grove.'),
  coalesce(p.full_name, 'A builder'),
  'candidate',
  gs.title,
  null,
  null,
  '{}',
  'public'
from public.grove_seeds gs
left join public.profiles p on p.id = gs.candidate_id
where not exists (
  select 1 from public.feed_posts fp
  where fp.seed_id = gs.id
    and fp.post_type in ('project_started', 'project_completed')
);

-- 2. Published Achievements with no achievement_added/milestone_completed
--    post yet (matched by evidence_id, the Achievement's own id).
insert into public.feed_posts (
  user_id, seed_id, evidence_id, post_type, caption, author_name,
  author_account_type, project_title, achievement_title, evidence_summary,
  skills, visibility
)
select
  ga.candidate_id,
  ga.project_id,
  ga.id::text,
  case when ga.achievement_type = 'milestone' then 'milestone_completed' else 'achievement_added' end,
  case
    when ga.achievement_type = 'milestone'
      then concat(coalesce(p.full_name, 'A builder'), ' reached a milestone: "', ga.title, '".')
    else concat(coalesce(p.full_name, 'A builder'), ' added a new achievement: "', ga.title, '".')
  end,
  coalesce(p.full_name, 'A builder'),
  'candidate',
  coalesce(gs.title, ga.project_domain),
  ga.title,
  ga.short_description,
  ga.skills_demonstrated,
  'public'
from public.grove_achievements ga
left join public.profiles p on p.id = ga.candidate_id
left join public.grove_seeds gs on gs.id = ga.project_id
where not exists (
  select 1 from public.feed_posts fp where fp.evidence_id = ga.id::text
);
