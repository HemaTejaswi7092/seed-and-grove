-- Seed & Grove: Copilot long-term memory (Phase 1 — no embeddings yet).
-- Run this once in the Supabase SQL editor, after setup.sql.
--
-- This is deliberately NOT a chat log. Conversation history stays where it
-- already lives (state/seedStore.ts, client-side) and is sent to the Edge
-- Function fresh on every request. This table holds only durable, reusable
-- facts about a builder's project — the kind of thing worth recalling in a
-- later session: goals, datasets, architecture/technical decisions,
-- milestones, measurable results, and stated preferences. The Edge
-- Function decides what's worth writing here; not every message qualifies.
--
-- Phase 2 will add: `alter table public.copilot_memory add column embedding
-- vector(<dim>)` once an embedding model is chosen, plus a similarity-search
-- RPC. Retrieval today is plain filtered/recency-based (user_id + seed_id +
-- source_type), not semantic — that's the intentional scope of this phase.

create table if not exists public.copilot_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Seeds live in the browser's localStorage today (see state/seedStore.ts),
  -- not in Postgres, and their ids are generated as "seed-<ts>-<rand>" —
  -- not UUIDs. text (not uuid) is required for a real Seed id to fit here.
  -- Null means a general, cross-Seed memory about the user (e.g. a stated
  -- learning-style preference) rather than one tied to a specific project.
  seed_id text,
  source_type text not null check (
    source_type in (
      'project_goal',
      'dataset',
      'architecture_decision',
      'technical_decision',
      'milestone',
      'measurable_result',
      'user_preference',
      'project_note'
    )
  ),
  -- Optional pointer back to the record this memory was derived from (an
  -- evidence id, an activity id) — informational only, no FK, since those
  -- also live client-side.
  source_id text,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.copilot_memory enable row level security;

-- Every policy is scoped to auth.uid() = user_id, matching profiles' RLS
-- pattern in setup.sql — a user can only ever read or write their own
-- memory rows. No policy allows reading another user's memories, and
-- nothing here is ever shared globally across accounts.
drop policy if exists "Users can read own copilot memory" on public.copilot_memory;
create policy "Users can read own copilot memory"
  on public.copilot_memory for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own copilot memory" on public.copilot_memory;
create policy "Users can insert own copilot memory"
  on public.copilot_memory for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own copilot memory" on public.copilot_memory;
create policy "Users can update own copilot memory"
  on public.copilot_memory for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own copilot memory" on public.copilot_memory;
create policy "Users can delete own copilot memory"
  on public.copilot_memory for delete
  using (auth.uid() = user_id);

-- Retrieval today is: this user's rows, optionally narrowed to one Seed,
-- optionally narrowed to a set of source_types relevant to the classified
-- intent, newest first, capped to a small count — see
-- supabase/functions/seed-copilot/memory.ts. This index covers exactly
-- that filter/sort shape.
create index if not exists copilot_memory_lookup_idx
  on public.copilot_memory (user_id, seed_id, source_type, created_at desc);

-- Reuses the set_updated_at() trigger function already created by
-- setup.sql — run that file first if you haven't.
drop trigger if exists set_copilot_memory_updated_at on public.copilot_memory;
create trigger set_copilot_memory_updated_at
  before update on public.copilot_memory
  for each row execute procedure public.set_updated_at();
