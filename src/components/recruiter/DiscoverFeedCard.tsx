import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { getInitials } from "../../lib/initials";
import { timeAgo } from "../../lib/dates";
import { achievementActivityLabel } from "../../recruiter/achievementActivityLabels";
import type { CandidateProfilePublic, PublishedAchievement } from "../../types/grove";

interface DiscoverFeedCardProps {
  achievement: PublishedAchievement;
  candidate: CandidateProfilePublic | null;
  index?: number;
}

// Candidate professional activity only — no comments, no internal
// messaging, no hiring-stage actions. "View Project" and "View Candidate
// Profile" both land on the same read-only candidate-profile route; the
// former also deep-links to this achievement's parent project card there
// via #project-<id> (see FeaturedSeeds.tsx, which sets that id on each
// project card). Achievements themselves no longer have their own
// standalone anchor on that page — every achievement now only renders
// inside its project's detail view, opened from that project card.
export default function DiscoverFeedCard({
  achievement,
  candidate,
  index = 0,
}: DiscoverFeedCardProps) {
  const displayName = candidate?.full_name?.trim() || "A candidate";
  const profileHref = `/recruiter/candidates/${achievement.candidate_id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.04 }}
      className="rounded-2xl border border-border bg-canvas-elevated p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
          {getInitials(displayName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="font-semibold text-ink">{displayName}</span>
            <span className="text-ink-faint">
              {achievementActivityLabel(achievement.achievement_type)}
            </span>
          </div>
          {candidate?.headline && (
            <p className="mt-0.5 truncate text-xs text-ink-faint">{candidate.headline}</p>
          )}
        </div>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-canvas p-4">
        <p className="text-sm font-semibold text-ink">{achievement.title}</p>
        {achievement.short_description && (
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            {achievement.short_description}
          </p>
        )}
        {(achievement.skills_demonstrated.length > 0 ||
          achievement.technologies_used.length > 0) && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {achievement.skills_demonstrated.map((skill) => (
              <span
                key={`skill-${skill}`}
                className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent-dark"
              >
                {skill}
              </span>
            ))}
            {achievement.technologies_used.map((tech) => (
              <span
                key={`tech-${tech}`}
                className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-ink-soft"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <p className="text-xs text-ink-faint">{timeAgo(achievement.created_at)}</p>
        <div className="flex items-center gap-4">
          <Link
            to={`${profileHref}#project-${achievement.project_id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-accent-dark transition-colors hover:text-accent"
          >
            View Project
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
          <Link
            to={profileHref}
            className="inline-flex items-center gap-1 text-xs font-medium text-accent-dark transition-colors hover:text-accent"
          >
            View Candidate Profile
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
