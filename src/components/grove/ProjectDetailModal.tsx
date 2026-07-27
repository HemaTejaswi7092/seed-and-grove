import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, Code2, ExternalLink, Trophy, X } from "lucide-react";
import { getInitials } from "../../lib/initials";
import AchievementCard from "./AchievementCard";
import type { AchievementHighlight, FeaturedSeedCard } from "../../types/grove";

interface ProjectDetailModalProps {
  project: FeaturedSeedCard;
  // Pre-filtered by the caller (FeaturedSeeds.tsx) to just this project's
  // achievements — this component never does its own seedId matching.
  achievements: AchievementHighlight[];
  isOwner: boolean;
  // Threaded through from GroveView via FeaturedSeeds — when set, any
  // achievement card here demonstrating this skill highlights, same as
  // its parent project card does on the main page.
  selectedSkill: string | null;
  onClose: () => void;
}

// The click-through destination for a Grove project card (see
// FeaturedSeeds.tsx) — full project overview plus every published
// achievement tied to it via project_id (never by matching titles; see
// types/grove.ts's AchievementHighlight.seedId). This is now the only
// place achievement cards render on Grove at all — there is no more
// top-level "Evidence & Achievements" list.
export default function ProjectDetailModal({
  project,
  achievements,
  isOwner,
  selectedSkill,
  onClose,
}: ProjectDetailModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 px-4 py-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl border border-border bg-canvas-elevated p-8 shadow-[0_24px_64px_-24px_rgba(26,28,25,0.4)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-xs font-semibold text-white">
              {getInitials(project.title)}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">{project.title}</h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className="inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-dark">
                  {project.status}
                </span>
                {project.lifecycleStatus === "completed" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-white">
                    <Trophy className="h-3 w-3" strokeWidth={2.25} />
                    Completed
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="mt-6 max-h-[65vh] space-y-6 overflow-y-auto pr-1">
          <div>
            {project.description && (
              <p className="text-sm leading-relaxed text-ink-soft">{project.description}</p>
            )}

            {project.technologies.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {project.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-ink-soft"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}

            {(project.repoUrl || project.demoUrl || isOwner) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {project.repoUrl && (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
                  >
                    <Code2 className="h-3.5 w-3.5" strokeWidth={2} />
                    Repo
                  </a>
                )}
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
                  >
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                    Demo
                  </a>
                )}
                {isOwner && (
                  <Link
                    to={`/seeds/${project.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
                  >
                    Open in Workspace
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
              Evidence &amp; Achievements
            </h3>

            {achievements.length === 0 ? (
              <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas px-6 py-10 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                  <Award className="h-5 w-5" strokeWidth={2} />
                </span>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-faint">
                  No published achievements for this project yet.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {achievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    isHighlighted={
                      selectedSkill !== null &&
                      achievement.skillsDemonstrated.includes(selectedSkill)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
