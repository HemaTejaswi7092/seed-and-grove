-- Seed & Grove: semantic embeddings for grove_achievements (Phase B —
-- AI candidate matching).
-- Run this once in the Supabase SQL editor, after grove_achievements.sql.
--
-- Embedding model: gte-small, run inside Supabase Edge Functions'
-- built-in Supabase.ai runtime (supabase/functions/embed-achievement) —
-- no external API, no key to manage. 384 dimensions, normalized output,
-- so cosine similarity == inner product (see match_achievements below,
-- which uses pgvector's <#> inner-product operator for that reason: it's
-- the fast path for already-normalized vectors, per Supabase's own
-- semantic-search reference implementation).
--
-- One embedding per Achievement (never sub-chunked — achievements are
-- already short, atomic units), built from title + short_description +
-- skills_demonstrated + technologies_used + project_domain +
-- candidate_contribution + outcome_or_impact + relevant_roles (see
-- src/lib/achievementEmbeddingText.ts, which is the single place that
-- builds this text so the embed-time text and any future re-embed always
-- agree).
--
-- Generated at publish/update time by state/achievements.ts — never
-- batch-computed here. A null embedding just means "not retrievable yet"
-- (e.g. the embed call transiently failed) — match_achievements excludes
-- it, it never surfaces as a false match.

create extension if not exists vector with schema extensions;

alter table public.grove_achievements
  add column if not exists embedding extensions.vector(384),
  add column if not exists embedding_model text,
  add column if not exists embedding_updated_at timestamptz;

-- Inner-product ops class to match the <#> operator used below.
create index if not exists grove_achievements_embedding_idx
  on public.grove_achievements
  using hnsw (embedding extensions.vector_ip_ops);

-- Retrieval only — no candidate grouping/ranking here, that's application
-- logic in supabase/functions/match-candidates (grouping by candidate_id,
-- picking each candidate's best 1-3 achievements, ranking candidates, is
-- exactly the kind of thing that's clearer and easier to change in
-- TypeScript than in a SQL function body). This function's only job is
-- "given a query embedding, return achievements ordered by similarity."
--
-- security invoker (the default — not declared security definer): the
-- calling role already has SELECT on every grove_achievements row via
-- its existing "Authenticated users can read published achievements"
-- policy, so no privilege escalation is needed or wanted here.
create or replace function public.match_achievements(
  query_embedding extensions.vector(384),
  match_count int default 60,
  min_similarity float default 0.15
)
returns table (
  id uuid,
  candidate_id uuid,
  project_id text,
  title text,
  short_description text,
  achievement_type text,
  skills_demonstrated text[],
  technologies_used text[],
  project_domain text,
  candidate_contribution text,
  outcome_or_impact text,
  proof_url text,
  proof_label text,
  relevant_roles text[],
  created_at timestamptz,
  similarity float
)
language sql
stable
as $$
  select
    a.id,
    a.candidate_id,
    a.project_id,
    a.title,
    a.short_description,
    a.achievement_type,
    a.skills_demonstrated,
    a.technologies_used,
    a.project_domain,
    a.candidate_contribution,
    a.outcome_or_impact,
    a.proof_url,
    a.proof_label,
    a.relevant_roles,
    a.created_at,
    (-1) * (a.embedding <#> query_embedding) as similarity
  from public.grove_achievements a
  where a.embedding is not null
    and (a.embedding <#> query_embedding) < (-1) * min_similarity
  order by a.embedding <#> query_embedding
  limit match_count;
$$;

grant execute on function public.match_achievements(extensions.vector, int, float) to authenticated;
