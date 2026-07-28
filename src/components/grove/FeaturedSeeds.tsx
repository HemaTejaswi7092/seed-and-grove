import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sprout, ArrowUpRight, Sparkles } from "lucide-react";
import { getInitials } from "../../lib/initials";
import { shouldShowStatusLabel } from "../../lib/seedStatus";
import ProjectDetailModal from "./ProjectDetailModal";
import type { AchievementHighlight, FeaturedSeedCard } from "../../types/grove";

interface FeaturedSeedsProps {
  seeds: FeaturedSeedCard[];
  // Full published-achievement list for this Grove — FeaturedSeeds filters
  // it down to one project's worth (by seedId, never by matching titles)
  // only when that project's detail view is actually opened. This is the
  // only place achievement detail renders on Grove at all now; see
  // ProjectDetailModal.tsx.
  achievementHighlights: AchievementHighlight[];
  // The Seed Workspace (/seeds/:id) is a private, authenticated route —
  // only offered (inside the project detail view) when this is the
  // owner's own Grove. A recruiter viewing someone else's profile never
  // gets that link at all, since it would 404 or hit an RLS wall for
  // them. "View Project" itself (opening ProjectDetailModal) is available
  // to every viewer regardless.
  isOwner: boolean;
  // Set from VerifiedSkills (see GroveView.tsx, which owns this state) —
  // when non-null, every project card with at least one matching
  // achievement gets highlighted and every other card dims, so a
  // recruiter can see at a glance which work backs a given skill. Also
  // threaded into ProjectDetailModal so an already-open project's own
  // achievement cards highlight the same way.
  selectedSkill: string | null;
}

export default function FeaturedSeeds({
  seeds,
  achievementHighlights,
  isOwner,
  selectedSkill,
}: FeaturedSeedsProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const selectedProject = seeds.find((seed) => seed.id === selectedProjectId) ?? null;

  if (seeds.length === 0 && !isOwner) return null;

  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
        Projects
      </h2>

      {seeds.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Sprout className="h-6 w-6" strokeWidth={2} />
          </span>
          <p className="mt-4 text-sm font-medium text-ink">
            No Seeds have been published to your Grove yet.
          </p>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-faint">
            Choose a Seed and publish it when you are ready.
          </p>
          <Link
            to="/seeds"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
          >
            View My Seeds
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {seeds.map((seed, index) => {
            const isMatch =
              selectedSkill !== null &&
              achievementHighlights.some(
                (achievement) =>
                  achievement.seedId === seed.id &&
                  achievement.skillsDemonstrated.includes(selectedSkill),
              );
            const isDimmed = selectedSkill !== null && !isMatch;

            return (
              <motion.div
                key={seed.id}
                id={`project-${seed.id}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: isDimmed ? 0.4 : 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.06 }}
                className={[
                  "scroll-mt-24 relative rounded-2xl border bg-canvas-elevated p-6 transition-shadow duration-300",
                  isMatch
                    ? "border-accent shadow-[0_12px_32px_-12px_rgba(63,109,82,0.45)]"
                    : "border-border",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-xs font-semibold text-white">
                      {getInitials(seed.title)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {seed.title}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        {shouldShowStatusLabel(seed.lifecycleStatus) && (
                          <span className="inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-dark">
                            {seed.status}
                          </span>
                        )}
                        {seed.lifecycleStatus === "completed" && (
                          <span className="inline-block rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-white">
                            Completed
                          </span>
                        )}
                        {seed.lifecycleStatus === "archived" && (
                          <span className="inline-block rounded-full bg-border px-2 py-0.5 text-[11px] font-medium text-ink-faint">
                            Archived
                          </span>
                        )}
                        {isMatch && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-white">
                            <Sparkles className="h-3 w-3" strokeWidth={2} />
                            {selectedSkill}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {seed.description}
                </p>

                {seed.technologies.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {seed.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-ink-soft"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-4 text-xs text-ink-faint">
                    <span>
                      {seed.relatedAchievements.length}{" "}
                      {seed.relatedAchievements.length === 1 ? "achievement" : "achievements"}
                    </span>
                    {seed.progress !== null && <span>{seed.progress}% complete</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProjectId(seed.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-accent-dark transition-colors hover:text-accent"
                  >
                    View Project
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          achievements={achievementHighlights.filter(
            (achievement) => achievement.seedId === selectedProject.id,
          )}
          isOwner={isOwner}
          selectedSkill={selectedSkill}
          onClose={() => setSelectedProjectId(null)}
        />
      )}
    </section>
  );
}
