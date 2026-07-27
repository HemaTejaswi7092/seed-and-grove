import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, UserPlus, UserCheck } from "lucide-react";
import { getInitials } from "../../lib/initials";
import { timeAgo } from "../../lib/dates";
import { FEED_POST_META } from "../../lib/feedPostMeta";
import type { FeedPost } from "../../types/feed";

interface FeedPostCardProps {
  post: FeedPost;
  // "View Project"/"View Grove" only make sense today for the viewer's own
  // posts — there's no public route yet to view another user's Seed or
  // Grove (Seeds/Grove profile data are still client-side only). Rather
  // than link somewhere broken, those actions are simply omitted for
  // anyone else's post.
  isOwnPost: boolean;
  // Which gated layout the current viewer is authenticated under
  // (AuthenticatedLayout vs. RecruiterLayout) — needed because the
  // *viewer's* account type, not just the post author's, determines which
  // route can actually render without being redirected away by the
  // other layout's gate (see App.tsx: candidates and recruiters each have
  // their own route to view a candidate profile, and their own route to
  // view a recruiter Grove).
  viewerAccountType: "candidate" | "recruiter";
  index?: number;
  // Both omitted for own posts (can't follow yourself) and for the demo
  // account (its posts have no real auth.users row to follow).
  isFollowing?: boolean;
  onToggleFollow?: () => void;
  // True only when post.evidence_id still resolves to a real, currently
  // published Achievement (see Dashboard.tsx's listExistingAchievementIds
  // check) — an older post whose Achievement was since unpublished or
  // deleted renders its achievement_title as plain text instead of a
  // dead anchor link.
  isAchievementLinkValid?: boolean;
}

// One small shared renderer for project_title/achievement_title: either a
// clickable line (Link, with clear hover/focus affordance) or plain text
// when there's nowhere safe to send it — same visual language either
// way, just the interactive styling layered on when a real href exists.
function TitleLine({
  text,
  href,
  emphasis,
}: {
  text: string;
  href: string | null;
  emphasis: "primary" | "secondary";
}) {
  const sizeClasses =
    emphasis === "primary" ? "text-sm font-semibold text-ink" : "text-xs font-medium text-ink-faint";

  if (!href) {
    return <p className={sizeClasses}>{text}</p>;
  }
  return (
    <Link
      to={href}
      onClick={(event) => event.stopPropagation()}
      className={`${sizeClasses} block underline-offset-2 transition-colors hover:text-accent-dark hover:underline focus-visible:text-accent-dark focus-visible:underline focus-visible:outline-none`}
    >
      {text}
    </Link>
  );
}

export default function FeedPostCard({
  post,
  isOwnPost,
  viewerAccountType,
  index = 0,
  isFollowing,
  onToggleFollow,
  isAchievementLinkValid = false,
}: FeedPostCardProps) {
  const navigate = useNavigate();
  const meta = FEED_POST_META[post.post_type];
  const Icon = meta.icon;
  const isRecruiterPost = post.author_account_type === "recruiter";
  // Four combinations of (viewer type, author type), each with its own
  // route so the target renders under the viewer's own gated layout
  // instead of being redirected away by the other one (see App.tsx).
  const profileHref =
    viewerAccountType === "recruiter"
      ? isRecruiterPost
        ? `/recruiter/recruiters/${post.user_id}`
        : `/recruiter/candidates/${post.user_id}`
      : isRecruiterPost
        ? `/recruiters/${post.user_id}`
        : `/candidates/${post.user_id}/preview`;

  // The whole card is one click target rather than a separate "View
  // Profile" button; interactive children (Follow, the own-post View
  // Project/View Grove links) stop propagation in their own handlers
  // below so they keep working independently.
  function goToProfile() {
    navigate(profileHref);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.05 }}
      onClick={goToProfile}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          goToProfile();
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`View ${post.author_name}'s profile`}
      className="cursor-pointer rounded-2xl border border-border bg-canvas-elevated p-6 transition-colors hover:border-ink-faint/50"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
          {getInitials(post.author_name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="font-semibold text-ink">{post.author_name}</span>
            <span className="text-ink-faint">{meta.label}</span>
          </div>
          <p className="mt-0.5 text-xs text-ink-faint">{timeAgo(post.created_at)}</p>
        </div>
        {onToggleFollow && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFollow();
            }}
            className={[
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              isFollowing
                ? "border-accent-soft-border bg-accent-soft text-accent-dark"
                : "border-border text-ink-soft hover:border-ink-faint hover:text-ink",
            ].join(" ")}
          >
            {isFollowing ? (
              <>
                <UserCheck className="h-3.5 w-3.5" strokeWidth={2} />
                Following
              </>
            ) : (
              <>
                <UserPlus className="h-3.5 w-3.5" strokeWidth={2} />
                Follow
              </>
            )}
          </button>
        )}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink">{post.caption}</p>

      {(post.project_title ||
        post.achievement_title ||
        post.evidence_summary ||
        post.skills.length > 0) && (
        <div className="mt-4 rounded-xl border border-border bg-canvas p-4">
          {post.project_title && (
            <TitleLine
              text={post.project_title}
              // Only public trace of a project cross-user is the
              // candidate's own profile page — no separate public
              // project/Seed page exists (Seeds are client-local, never
              // in Postgres; see feed_posts.sql). Demoted to a secondary
              // line whenever an Achievement title is also shown below,
              // since the Achievement is the more specific destination.
              href={post.seed_id ? profileHref : null}
              emphasis={post.achievement_title ? "secondary" : "primary"}
            />
          )}
          {post.achievement_title && (
            <div className={post.project_title ? "mt-0.5" : undefined}>
              <TitleLine
                text={post.achievement_title}
                // Reuses the same anchor FeaturedSeeds.tsx's project cards
                // expose on the candidate's own Grove — achievements have
                // no standalone anchor of their own,
                // so this deep-links to the achievement's parent project
                // card instead, only when both the parent Seed/project and
                // a still-published Achievement are confirmed to exist;
                // otherwise this renders as plain text rather than a dead
                // anchor.
                href={
                  isAchievementLinkValid && post.seed_id
                    ? `${profileHref}#project-${post.seed_id}`
                    : null
                }
                emphasis="primary"
              />
            </div>
          )}
          {post.evidence_summary && (
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {post.evidence_summary}
            </p>
          )}
          {post.skills.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {post.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent-dark"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {isOwnPost && (
        <div
          className="mt-4 flex items-center gap-4 border-t border-border pt-4"
          onClick={(event) => event.stopPropagation()}
        >
          {post.seed_id && (
            <Link
              to={`/seeds/${post.seed_id}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent-dark transition-colors hover:text-accent"
            >
              View Project
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          )}
          <Link
            to={isRecruiterPost ? "/recruiter/grove" : "/grove"}
            className="inline-flex items-center gap-1 text-xs font-medium text-accent-dark transition-colors hover:text-accent"
          >
            View Grove
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>
      )}
    </motion.div>
  );
}
