import type { FeedPost } from "../types/feed";

// Ranks the feed as: posts from people the viewer follows (most recent
// first), then everyone else — including the viewer's own posts, which
// deliberately are NOT boosted here. Own posts just fall into the
// "everyone else" tier and sort purely by recency alongside strangers',
// same as LinkedIn's home feed favors your network without literally
// hiding the rest of the platform. Still one continuous list — no section
// headers, no separate "Following" vs "Discover" split. Shared by
// pages/Dashboard.tsx (candidate) and pages/RecruiterFeed.tsx (recruiter)
// — one feed, one ranking rule, regardless of viewer or author type.
export function rankFeed(posts: FeedPost[], followingIds: Set<string>): FeedPost[] {
  return [...posts].sort((a, b) => {
    const aFollowed = followingIds.has(a.user_id) ? 1 : 0;
    const bFollowed = followingIds.has(b.user_id) ? 1 : 0;
    if (aFollowed !== bFollowed) return bFollowed - aFollowed;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
