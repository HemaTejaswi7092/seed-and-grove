-- Patch for the feed_posts table created by feed_posts.sql before this
-- column existed. Safe to run once; feed_posts.sql itself has been
-- updated to include this column for anyone installing fresh from
-- scratch, so this file only matters for already-created tables.
--
-- See feed_posts.sql's comment on author_name for why it's a snapshot
-- column rather than a join to profiles.
alter table public.feed_posts
  add column if not exists author_name text not null default '';

-- Drop the default now that it's served its purpose of satisfying
-- existing rows — every future insert must supply a real name, not
-- silently fall back to an empty string.
alter table public.feed_posts
  alter column author_name drop default;
