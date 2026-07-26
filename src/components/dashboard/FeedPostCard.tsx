import { Link } from "react-router-dom";
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
  index?: number;
  // Both omitted for own posts (can't follow yourself) and for the demo
  // account (its posts have no real auth.users row to follow).
  isFollowing?: boolean;
  onToggleFollow?: () => void;
}

export default function FeedPostCard({
  post,
  isOwnPost,
  index = 0,
  isFollowing,
  onToggleFollow,
}: FeedPostCardProps) {
  const meta = FEED_POST_META[post.post_type];
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.05 }}
      className="rounded-2xl border border-border bg-canvas-elevated p-6"
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
            onClick={onToggleFollow}
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

      {(post.project_title || post.evidence_summary || post.skills.length > 0) && (
        <div className="mt-4 rounded-xl border border-border bg-canvas p-4">
          {post.project_title && (
            <p className="text-sm font-semibold text-ink">{post.project_title}</p>
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
        <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
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
            to="/grove"
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
