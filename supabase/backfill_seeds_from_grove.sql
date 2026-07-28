-- Seed & Grove: one-time DATA migration — backfills the new private
-- `seeds` table (see seeds.sql) from `grove_seeds` for every published
-- Seed that predates that table, so it stops disappearing from the Seed
-- Workspace ("You haven't planted a Seed yet") while still showing up on
-- Grove.
--
-- Root cause this fixes: before seeds.sql existed, publishing wrote only
-- to grove_seeds (the public mirror); the Seed itself lived in
-- localStorage, scoped to one browser. Any Seed published before this
-- migration therefore has a grove_seeds row but no seeds row, so
-- state/seedsStore.ts's listSeeds()/getSeed() — the Workspace's only data
-- source now — never finds it, even though Grove (which reads
-- grove_seeds directly) still can.
--
-- Run this once in the Supabase SQL editor, after seeds.sql. Safe to
-- re-run: the WHERE NOT EXISTS guard means a row already present in
-- `seeds` (id is the shared primary key both tables already keep in sync
-- on, see seeds.sql's header comment) is never touched or duplicated.
--
-- Scope: only inserts a missing `seeds` row. grove_achievements.project_id
-- and feed_posts.seed_id are plain text fields, not foreign keys into
-- seeds (see grove_seeds.sql's note on the same design) — they already
-- resolve correctly regardless of whether this backfill has run, so
-- nothing else needs touching.
--
-- Known, unavoidable data loss for backfilled rows only: `progress` (a
-- private field grove_seeds never mirrored — see Grove.tsx's comment on
-- FeedSeedCard.progress) can't be recovered, so it's approximated as 100
-- for completed Seeds and 0 otherwise; `completed_at` is approximated as
-- the row's last update time for completed Seeds. Every other field
-- (title, description, technologies, status, lifecycle_status, repo/demo
-- links, publish state, created/updated timestamps) is carried over
-- exactly.

insert into public.seeds (
  id,
  candidate_id,
  title,
  description,
  source_type,
  status,
  technologies,
  progress,
  is_published,
  published_at,
  lifecycle_status,
  completed_at,
  repo_url,
  demo_url,
  created_at,
  updated_at
)
select
  gs.id,
  gs.candidate_id,
  gs.title,
  gs.description,
  'manual',
  gs.status,
  gs.technologies,
  case when gs.lifecycle_status = 'completed' then 100 else 0 end,
  true,
  gs.published_at,
  gs.lifecycle_status,
  case when gs.lifecycle_status = 'completed' then gs.updated_at else null end,
  coalesce(gs.repo_url, ''),
  coalesce(gs.demo_url, ''),
  gs.created_at,
  gs.updated_at
from public.grove_seeds gs
where not exists (
  select 1 from public.seeds s where s.id = gs.id
);
