-- Seed & Grove: public activity feed (Phase 1).
-- Run this once in the Supabase SQL editor, after setup.sql.
--
-- This table is deliberately a SNAPSHOT, not a live view into a Seed or
-- its evidence. Seeds and evidence live entirely in the browser's
-- localStorage today (see state/seedStore.ts) — there is no Postgres
-- table for either, so seed_id/evidence_id below are plain informational
-- text, never real foreign keys. Everything actually shown on a feed card
-- (project_title, evidence_summary, skills, caption) is copied in once,
-- at the moment the user explicitly publishes it — never re-derived from
-- private data later. That's what guarantees a feed query can never leak
-- anything beyond what the user chose to share: there is nothing else in
-- this row to leak.
--
-- Important limitation, called out here rather than hidden: because
-- evidence has no Postgres table, "the referenced evidence belongs to the
-- publishing user" cannot be enforced by a foreign key + RLS the way
-- user_id is. It is enforced only at the application layer — the
-- publish UI only ever offers evidence read from the caller's own,
-- already-user-scoped seedStore. Migrating Seeds/evidence into Postgres
-- (a future phase) is what would let the database enforce this itself.

create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Informational only, not a foreign key — see header comment.
  seed_id text,
  evidence_id text,
  post_type text not null check (
    post_type in (
      'project_started',
      'milestone_completed',
      'evidence_shared',
      'skill_demonstrated',
      'project_completed',
      'achievement_added',
      'grove_update'
    )
  ),
  caption text not null,
  -- Denormalized snapshot captured at publish time — see header comment.
  -- author_name is part of that same snapshot: profiles' RLS only lets a
  -- user read their own row (see setup.sql), so a cross-user feed can't
  -- join to it for other authors' names. Capturing it here avoids ever
  -- having to loosen that policy.
  author_name text not null,
  project_title text,
  evidence_summary text,
  skills text[] not null default '{}',
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.feed_posts enable row level security;

-- Unlike copilot_memory (strictly private) or Seeds (client-side only),
-- this table is meant to be read across users — that's the point of a
-- feed. Anyone authenticated can read a public post; only the author can
-- read their own non-public ones.
drop policy if exists "Authenticated users can read public posts" on public.feed_posts;
create policy "Authenticated users can read public posts"
  on public.feed_posts for select
  to authenticated
  using (visibility = 'public' or auth.uid() = user_id);

drop policy if exists "Users can create their own posts" on public.feed_posts;
create policy "Users can create their own posts"
  on public.feed_posts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own posts" on public.feed_posts;
create policy "Users can update their own posts"
  on public.feed_posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own posts" on public.feed_posts;
create policy "Users can delete their own posts"
  on public.feed_posts for delete
  using (auth.uid() = user_id);

-- Chronological public feed — partial index since that's the only sort
-- order the main feed query ever needs.
create index if not exists feed_posts_public_feed_idx
  on public.feed_posts (created_at desc)
  where visibility = 'public';

-- A single user's own posts (own-Grove feed view, edit/delete lookups).
create index if not exists feed_posts_user_idx
  on public.feed_posts (user_id, created_at desc);

-- Reuses the set_updated_at() trigger function already created by
-- setup.sql — run that file first if you haven't.
drop trigger if exists set_feed_posts_updated_at on public.feed_posts;
create trigger set_feed_posts_updated_at
  before update on public.feed_posts
  for each row execute procedure public.set_updated_at();
