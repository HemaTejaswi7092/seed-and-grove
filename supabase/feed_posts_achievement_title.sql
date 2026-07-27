-- Seed & Grove: adds the one field feed_posts was actually missing for
-- reliable Achievement-title linking from the Community Feed.
--
-- Everything else the feed needs was already there under an existing
-- name: user_id already is the author reference, seed_id already is the
-- project reference, post_type already exists. evidence_id already holds
-- the shared Achievement's own id (Seed.tsx's handleOpenShareForEvidence
-- sets it to the local Achievement record's id, which — for a published
-- Achievement, the only kind ever offered for "Share to Feed", see
-- EvidenceGrid.tsx's isPublished gate — is by construction the exact
-- same id as its grove_achievements row; see grove_achievements.sql's
-- header comment on why that id is client-supplied rather than
-- generated). What was missing: the Achievement's own TITLE was never
-- captured as its own column — only project_title (the Seed's title) and
-- evidence_summary (the Achievement's short description) were. Without
-- it, the feed card had no distinct "Achievement title" to render or
-- link at all.
alter table public.feed_posts
  add column if not exists achievement_title text;
