-- Seed & Grove: reset test/demo data for a fresh prototype-testing round.
--
-- ============================================================================
-- DO NOT RUN THIS AUTOMATICALLY. Review it, then paste it into the Supabase
-- SQL Editor and run it manually when you're ready.
-- ============================================================================
--
-- Scope, based on live schema inspection performed 2026-07-27 (see chat for
-- the full inspection queries/output — this is not guessed from local
-- migration files, since two of them may not even be applied yet):
--
--   - Schema, tables, columns, views, functions, RLS policies, and Storage
--     buckets are NOT touched — only row data in the 8 tables below.
--   - Supabase Auth users (auth.users) are NOT touched. Every table here
--     has its own foreign key straight to auth.users(id) ON DELETE CASCADE
--     (confirmed via pg_constraint — there are NO foreign keys between the
--     public tables themselves), so testers keep their login accounts;
--     they'll just find everything they created reset to empty.
--   - Storage objects (avatars/, resumes/) are NOT touched.
--   - There is no system/demo seed data anywhere in these 8 tables to
--     preserve — handle_new_user() only ever inserts a blank public.profiles
--     row at signup, which this script also leaves alone (see below).
--
-- Deliberately preserved, not cleared:
--   - public.profiles — the bare account_type/full_name identity row every
--     login depends on for routing (CandidateGate/RecruiterGate). It's
--     auto-created once, at signup, by the handle_new_user() trigger, and
--     nothing recreates it later — deleting it while keeping the auth.users
--     row would leave that login in a broken, unrecoverable state rather
--     than a clean one. It holds negligible "test content" anyway.
--   - candidate_profiles_public / recruiter_profiles_public — plain views
--     over candidate_profiles / recruiter_profiles; they auto-return zero
--     rows for a user once that user's base-table row is cleared below, so
--     there's nothing to separately clean here.
--
-- IMPORTANT CAVEAT this script cannot fix: unpublished/private Seeds and
-- Achievements live entirely in each tester's own browser localStorage, not
-- in Postgres (see grove_seeds.sql / grove_achievements.sql headers — these
-- tables only ever hold PUBLISHED snapshots). This script cannot reach
-- localStorage. For a truly clean visual state, testers should also use a
-- fresh/incognito browser profile, or you'll need to walk them through
-- clearing site data manually.
--
-- No embeddings/semantic-search table exists to clean separately — gte-small
-- embeddings are just columns on grove_achievements/jobs and go away
-- automatically when those rows are deleted. Same for "skills derived from
-- achievements" (computed client-side from grove_achievements at render
-- time, nothing cached in Postgres) and "job matches" (computed live by the
-- match_achievements/match_jobs functions, nothing stored). None of
-- "notifications," "saved candidates," or persisted "AI conversations" exist
-- as features/tables in this schema at all — nothing to clear for those.

begin;

-- 1. copilot_memory — long-term Seed Copilot memory facts (not full chat
--    transcripts; those are never persisted anywhere). No dependents.
delete from public.copilot_memory;

-- 2. feed_posts — every candidate Achievement/milestone post and every
--    recruiter Company Post (note: as of this inspection, the migration
--    that lets recruiters actually publish Company Posts,
--    recruiter_posts_and_grove.sql, has NOT been applied to this database
--    yet, so in practice this table currently holds candidate posts only —
--    the DELETE below clears whatever is here regardless).
delete from public.feed_posts;

-- 3. grove_achievements — published Achievements (references grove_seeds.id
--    informally via project_id, no enforced FK — deleted first for clarity).
delete from public.grove_achievements;

-- 4. grove_seeds — published Seed/project snapshots.
delete from public.grove_seeds;

-- 5. jobs — every recruiter's posted role (draft/published/closed alike).
delete from public.jobs;

-- 6. user_follows — candidate<->recruiter follow graph.
delete from public.user_follows;

-- 7. candidate_profiles — full candidate Grove content: headline, bio,
--    education/experience/certifications (jsonb), links, preferences, etc.
--    Safe to clear independently of public.profiles/auth.users — candidates
--    just see empty-state forms next time they visit Profile/Grove.
delete from public.candidate_profiles;

-- 8. recruiter_profiles — full recruiter Grove content: company info,
--    professional_bio/hiring_philosophy, experience/education/
--    certifications (jsonb), hiring_roles/domains/skills/levels/locations,
--    videos (jsonb). Safe to clear: RecruiterGate already has a built-in
--    "no recruiter_profiles row yet" recovery path (redirects to
--    /recruiter/signup to resume company-info setup) — this is the exact
--    state a recruiter is in right after creating just their login, so
--    testers land in a normal, supported flow, not an error.
delete from public.recruiter_profiles;

commit;

-- Optional verification — run after commit to confirm everything's empty:
--
-- select 'copilot_memory' as table_name, count(*) from public.copilot_memory
-- union all select 'feed_posts', count(*) from public.feed_posts
-- union all select 'grove_achievements', count(*) from public.grove_achievements
-- union all select 'grove_seeds', count(*) from public.grove_seeds
-- union all select 'jobs', count(*) from public.jobs
-- union all select 'user_follows', count(*) from public.user_follows
-- union all select 'candidate_profiles', count(*) from public.candidate_profiles
-- union all select 'recruiter_profiles', count(*) from public.recruiter_profiles;
