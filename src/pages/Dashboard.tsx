import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { isDemoAccount } from "../config/demoAccount";
import { getDisplayName } from "../lib/displayName";
import { getInitials } from "../lib/initials";
import { getCandidateProfile } from "../state/candidateProfileStore";
import { getPublishedSeeds, listSeeds } from "../state/seedStore";
import {
  listPublishedAchievements,
  listExistingAchievementIds,
} from "../state/groveAchievementsStore";
import { deriveSkillsFromAchievements } from "../lib/groveSkills";
import type { PublishedAchievementWithSeed } from "../lib/groveSkills";
import {
  getHomeFeed,
  getFollowingIds,
  followUser,
  unfollowUser,
} from "../state/feedStore";
import { rankFeed } from "../lib/rankFeed";
import {
  demoFeedPosts,
  demoGroveProfileFields,
  demoFeaturedSeeds,
  demoSkillSummaries,
} from "../data/mockData";
import GroveSummaryCard from "../components/dashboard/GroveSummaryCard";
import FeedSuggestionsPanel from "../components/dashboard/FeedSuggestionsPanel";
import FeedEmptyState from "../components/dashboard/FeedEmptyState";
import FeedPostCard from "../components/dashboard/FeedPostCard";
import GlobalSearchBar from "../components/dashboard/GlobalSearchBar";
import type { FeedPost } from "../types/feed";

// The Dashboard is the public activity feed — a 3-column layout (Grove
// summary / feed / suggestions) that collapses to a single column on
// mobile via the `order-*` utilities below, rather than a separate drawer
// component. Nothing here writes a feed post; posts are only ever created
// from the Seed Workspace's "Share to feed" flow (see pages/Seed.tsx),
// which is what keeps private Seed data from ever reaching this page.
// Following/unfollowing is the one write this page does perform.
export default function Dashboard() {
  const { user, profile } = useAuth();
  const isDemo = isDemoAccount(user?.email);
  const displayName = getDisplayName(user, profile) || "there";
  const initials = getInitials(displayName);

  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [validAchievementIds, setValidAchievementIds] = useState<Set<string>>(new Set());
  const [feedError, setFeedError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [ownAchievements, setOwnAchievements] = useState<
    PublishedAchievementWithSeed[]
  >([]);
  const [headline, setHeadline] = useState("");

  useEffect(() => {
    if (isDemo || !user) return;
    let cancelled = false;
    Promise.all([getHomeFeed(), getFollowingIds(user.id)])
      .then(([rows, following]) => {
        if (cancelled) return;
        setPosts(rows);
        setFollowingIds(new Set(following));
      })
      .catch((err) => {
        if (!cancelled) {
          setFeedError(
            err instanceof Error ? err.message : "Couldn't load your feed.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isDemo, user]);

  // A feed post's evidence_id is a snapshot of what was published at
  // share time — if the candidate later unpublished/deleted that
  // Achievement, it's no longer a safe link target. FeedPostCard only
  // links an Achievement title when its id shows up in this set (see
  // groveAchievementsStore.ts's listExistingAchievementIds); anything
  // else renders as plain text rather than a dead anchor.
  useEffect(() => {
    if (!posts) return;
    let cancelled = false;
    const ids = Array.from(
      new Set(posts.map((post) => post.evidence_id).filter((id): id is string => !!id)),
    );
    listExistingAchievementIds(ids)
      .then((valid) => {
        if (!cancelled) setValidAchievementIds(valid);
      })
      .catch(() => {
        if (!cancelled) setValidAchievementIds(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [posts]);

  useEffect(() => {
    if (isDemo || !user) return;
    let cancelled = false;
    listPublishedAchievements(user.id)
      .then((rows) => {
        if (cancelled) return;
        const seedById = new Map(listSeeds(user.id).map((seed) => [seed.id, seed]));
        setOwnAchievements(
          rows
            .map((achievement) => {
              const seed = seedById.get(achievement.project_id);
              return seed ? { achievement, seed: { id: seed.id, title: seed.title } } : null;
            })
            .filter((item): item is PublishedAchievementWithSeed => item !== null),
        );
      })
      .catch(() => {
        if (!cancelled) setOwnAchievements([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isDemo, user]);

  useEffect(() => {
    if (isDemo || !user) return;
    let cancelled = false;
    getCandidateProfile(user.id)
      .then((row) => {
        if (!cancelled) setHeadline(row?.headline ?? "");
      })
      .catch(() => {
        if (!cancelled) setHeadline("");
      });
    return () => {
      cancelled = true;
    };
  }, [isDemo, user]);

  if (!user) return null;

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  async function handleToggleFollow(authorId: string) {
    if (!user || isDemo) return;
    const wasFollowing = followingIds.has(authorId);

    // Optimistic — reverted below if the write fails.
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
      showToast(
        err instanceof Error ? err.message : "Couldn't update follow status.",
      );
    }
  }

  const displayHeadline = isDemo ? demoGroveProfileFields.headline : headline;

  let publishedSeedsCount: number;
  let publicEvidenceCount: number;
  let skillsCount: number;

  if (isDemo) {
    publishedSeedsCount = demoFeaturedSeeds.length;
    publicEvidenceCount = demoSkillSummaries.reduce(
      (sum, skill) => sum + skill.achievementCount,
      0,
    );
    skillsCount = demoSkillSummaries.length;
  } else {
    // ownAchievements loads asynchronously (see the effect above) — counts
    // simply start at 0 and fill in once it resolves, same brief-loading
    // tradeoff as the feed list below.
    publishedSeedsCount = getPublishedSeeds(user.id).length;
    publicEvidenceCount = ownAchievements.length;
    skillsCount = deriveSkillsFromAchievements(ownAchievements).length;
  }

  const unrankedPosts: FeedPost[] = isDemo
    ? demoFeedPosts.map((post) => ({ ...post, author_name: displayName }))
    : (posts ?? []);
  // Demo posts have no real auth.users row (user_id: "demo") to rank
  // against a follow graph — shown in their curated order as-is.
  const visiblePosts = isDemo
    ? unrankedPosts
    : rankFeed(unrankedPosts, followingIds);

  return (
    <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-6 py-10 lg:grid-cols-[280px_1fr_300px]">
      <aside className="order-2 lg:order-1">
        <div className="lg:sticky lg:top-24">
          <GroveSummaryCard
            displayName={displayName}
            initials={initials}
            headline={displayHeadline}
            publishedSeedsCount={publishedSeedsCount}
            publicEvidenceCount={publicEvidenceCount}
            skillsCount={skillsCount}
          />
        </div>
      </aside>

      <div className="order-1 lg:order-2">
        <div className="mb-6">
          <GlobalSearchBar viewerAccountType="candidate" />
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Community Feed
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Verified milestones, evidence, and Grove updates from builders
            across Seed & Grove.
          </p>
        </div>

        {/* One unified, chronological-within-tier list — never split into
            a separate "My Activity" section. Posts from people the viewer
            follows surface first (see rankFeed above); everyone else,
            including the viewer's own posts, follows by recency. */}
        {isDemo || posts !== null || feedError ? (
          <>
            {feedError && (
              <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {feedError}
              </p>
            )}
            {visiblePosts.length === 0 && !feedError ? (
              <FeedEmptyState />
            ) : (
              <div className="space-y-4">
                {visiblePosts.map((post, index) => {
                  const isOwnPost = isDemo || post.user_id === user.id;
                  return (
                    <FeedPostCard
                      key={post.id}
                      post={post}
                      isOwnPost={isOwnPost}
                      viewerAccountType="candidate"
                      index={index}
                      isAchievementLinkValid={
                        !!post.evidence_id && validAchievementIds.has(post.evidence_id)
                      }
                      isFollowing={
                        isDemo || isOwnPost
                          ? undefined
                          : followingIds.has(post.user_id)
                      }
                      onToggleFollow={
                        isDemo || isOwnPost
                          ? undefined
                          : () => handleToggleFollow(post.user_id)
                      }
                    />
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center rounded-3xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16">
            <p className="text-sm text-ink-faint">Loading your feed…</p>
          </div>
        )}
      </div>

      <aside className="order-3">
        <div className="lg:sticky lg:top-24">
          <FeedSuggestionsPanel
            isDemo={isDemo}
            featuredProject={isDemo ? demoFeaturedSeeds[0] : undefined}
            trendingSkills={isDemo ? demoSkillSummaries : undefined}
          />
        </div>
      </aside>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
