import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import {
  getHomeFeed,
  getFollowingIds,
  followUser,
  unfollowUser,
} from "../state/feedStore";
import { rankFeed } from "../lib/rankFeed";
import FeedPostCard from "../components/dashboard/FeedPostCard";
import type { FeedPost } from "../types/feed";

// The recruiter-side counterpart to pages/Dashboard.tsx's feed — same
// data (getHomeFeed/rankFeed already return/rank every public post
// regardless of author type) and the same FeedPostCard, just without the
// candidate-only Grove-summary/suggestions sidebars. This is the ONE
// shared professional feed: candidate Achievements/milestones alongside
// other recruiters' Company Posts, ranked by follow graph then recency —
// never a job board, never filtered to "your" candidates.
export default function RecruiterFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([getHomeFeed(), getFollowingIds(user.id)])
      .then(([rows, following]) => {
        if (cancelled) return;
        setPosts(rows);
        setFollowingIds(new Set(following));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't load the feed.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  async function handleToggleFollow(authorId: string) {
    if (!user) return;
    const wasFollowing = followingIds.has(authorId);

    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (wasFollowing) next.delete(authorId);
      else next.add(authorId);
      return next;
    });

    try {
      if (wasFollowing) {
        await unfollowUser(user.id, authorId);
      } else {
        await followUser(user.id, authorId);
      }
    } catch (err) {
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (wasFollowing) next.add(authorId);
        else next.delete(authorId);
        return next;
      });
      setError(err instanceof Error ? err.message : "Couldn't update follow status.");
    }
  }

  const visiblePosts = posts ? rankFeed(posts, followingIds) : [];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Feed</h1>
      <p className="mt-2 text-lg text-ink-soft">
        Candidate milestones and achievements, alongside company posts from
        recruiters across Seed &amp; Grove.
      </p>

      <div className="mt-6">
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {posts === null ? (
          <div className="flex items-center justify-center rounded-3xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16">
            <p className="text-sm text-ink-faint">Loading the feed…</p>
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="flex items-center justify-center rounded-3xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16 text-center">
            <p className="text-sm leading-relaxed text-ink-soft">
              Nothing here yet — once candidates and recruiters start
              publishing, their activity will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visiblePosts.map((post, index) => {
              const isOwnPost = post.user_id === user.id;
              return (
                <FeedPostCard
                  key={post.id}
                  post={post}
                  isOwnPost={isOwnPost}
                  viewerAccountType="recruiter"
                  index={index}
                  isFollowing={isOwnPost ? undefined : followingIds.has(post.user_id)}
                  onToggleFollow={
                    isOwnPost ? undefined : () => handleToggleFollow(post.user_id)
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
