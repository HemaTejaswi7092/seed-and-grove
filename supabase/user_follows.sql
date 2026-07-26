-- Seed & Grove: follow relationships (Phase 3, part 1).
-- Run this once in the Supabase SQL editor, after feed_posts.sql.
--
-- Used by the Dashboard feed to rank posts from people you follow ahead
-- of the rest of the community (see state/feedStore.ts's getFollowingIds
-- and pages/Dashboard.tsx's sort) — not to hide anyone else's posts, and
-- never to create a separate "following" section: the feed stays one
-- chronological list, just reordered so followed authors surface first.

create table if not exists public.user_follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  followee_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint user_follows_no_self_follow check (follower_id <> followee_id)
);

alter table public.user_follows enable row level security;

-- Read access is scoped to relationships you're part of (as follower or
-- followee) — not a fully public follower-graph. Enough to compute "who
-- do I follow" for feed ranking and a "you follow each other" state,
-- without exposing arbitrary users' full connection lists to anyone.
drop policy if exists "Users can read their own follow relationships" on public.user_follows;
create policy "Users can read their own follow relationships"
  on public.user_follows for select
  to authenticated
  using (auth.uid() = follower_id or auth.uid() = followee_id);

drop policy if exists "Users can follow others as themselves" on public.user_follows;
create policy "Users can follow others as themselves"
  on public.user_follows for insert
  with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow people they follow" on public.user_follows;
create policy "Users can unfollow people they follow"
  on public.user_follows for delete
  using (auth.uid() = follower_id);

-- "Who do I follow" (feed ranking) and "who follows this user" (a future
-- follower-count display), both directions covered.
create index if not exists user_follows_follower_idx on public.user_follows (follower_id);
create index if not exists user_follows_followee_idx on public.user_follows (followee_id);
