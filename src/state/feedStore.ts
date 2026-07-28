import { supabase } from "../lib/supabase";
import type { CreateFeedPostInput, FeedPost } from "../types/feed";

// Unlike state/seedStore.ts, this is genuinely backed by Supabase Postgres
// (see supabase/feed_posts.sql), not localStorage — a feed only makes
// sense if other users can read it, which localStorage can never do. Row
// Level Security (not this file) is what actually enforces that a post
// can only be created/edited/deleted by its own author; userId here is
// passed through from the authenticated caller (matching the rest of the
// codebase's convention — see seedStore.ts), never inferred silently.

export async function createFeedPost(
  userId: string,
  input: CreateFeedPostInput,
): Promise<FeedPost> {
  const { data, error } = await supabase
    .from("feed_posts")
    .insert({ user_id: userId, ...input })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as FeedPost;
}

// Deleting a Seed must not leave orphaned feed activity behind — removes
// every post that's either directly about the Seed itself (seed_id
// matches, e.g. a "started/completed this project" post) or about one of
// its now-deleted Achievements (evidence_id matches). See
// state/seedPublishing.ts's deleteSeedAndSync, the only caller. Scoped to
// userId too even though RLS already enforces ownership — belt-and-
// suspenders, and it lets Postgres use the existing user index.
export async function deleteFeedPostsForSeed(
  userId: string,
  seedId: string,
  achievementIds: string[],
): Promise<void> {
  const orFilter = [
    `seed_id.eq.${seedId}`,
    ...achievementIds.map((id) => `evidence_id.eq.${id}`),
  ].join(",");

  const { error } = await supabase
    .from("feed_posts")
    .delete()
    .eq("user_id", userId)
    .or(orFilter);

  if (error) throw new Error(error.message);
}

// The public, cross-user feed — RLS already restricts this to
// visibility = 'public' rows (plus the caller's own, but we don't need
// that distinction here), this filter just makes the query's intent
// explicit and lets Postgres use the partial index built for it.
export async function getPublicFeed(limit = 30): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("feed_posts")
    .select("*")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as FeedPost[];
}

// The authenticated Dashboard's home feed: everyone's public posts, plus
// the caller's own private ones mixed in chronologically (their own
// activity shouldn't disappear from their own feed just because they
// chose "only me"). No visibility filter here — RLS itself already
// resolves to exactly "public OR mine", so adding .eq("visibility", ...)
// would just narrow it back to strangers-only.
export async function getHomeFeed(limit = 30): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("feed_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as FeedPost[];
}

// A single user's own posts (any visibility) — for their own
// Grove/profile feed view, not the cross-user Dashboard feed.
export async function getUserFeedPosts(userId: string): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("feed_posts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as FeedPost[];
}

// --- Follows (see supabase/user_follows.sql) --------------------------------

export async function followUser(
  followerId: string,
  followeeId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_follows")
    .insert({ follower_id: followerId, followee_id: followeeId });

  if (error) throw new Error(error.message);
}

export async function unfollowUser(
  followerId: string,
  followeeId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("followee_id", followeeId);

  if (error) throw new Error(error.message);
}

// Who the caller follows — used by Dashboard.tsx to rank the feed (see
// its sort: followed authors first, then everyone else, both by
// recency). RLS already limits this to the caller's own relationships.
export async function getFollowingIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_follows")
    .select("followee_id")
    .eq("follower_id", userId);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.followee_id as string);
}
