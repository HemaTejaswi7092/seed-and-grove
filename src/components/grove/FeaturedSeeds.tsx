import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sprout, ArrowUpRight, Code2, ExternalLink } from "lucide-react";
import { getInitials } from "../../lib/initials";
import type { FeaturedSeedCard } from "../../types/grove";

interface FeaturedSeedsProps {
  seeds: FeaturedSeedCard[];
  // The Seed Workspace (/seeds/:id) is a private, authenticated route —
  // only rendered as a link when this is the owner's own Grove. A
  // recruiter viewing someone else's profile never gets that link at
  // all, since it would 404 or hit an RLS wall for them.
  isOwner: boolean;
}

export default function FeaturedSeeds({ seeds, isOwner }: FeaturedSeedsProps) {
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
          {seeds.map((seed, index) => (
            <motion.div
              key={seed.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.06 }}
              className="rounded-2xl border border-border bg-canvas-elevated p-6"
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
                      <span className="inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-dark">
                        {seed.status}
                      </span>
                      {seed.lifecycleStatus === "completed" && (
                        <span className="inline-block rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-white">
                          Completed
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

              {seed.relatedAchievements.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-medium tracking-wide text-ink-faint uppercase">
                    Related achievements
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {seed.relatedAchievements.map((item) => (
                      <li key={item.id} className="text-sm leading-snug">
                        <a
                          href={`#achievement-${item.id}`}
                          className="text-accent-dark transition-colors hover:text-accent"
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(seed.repoUrl || seed.demoUrl) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {seed.repoUrl && (
                    <a
                      href={seed.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
                    >
                      <Code2 className="h-3.5 w-3.5" strokeWidth={2} />
                      Repo
                    </a>
                  )}
                  {seed.demoUrl && (
                    <a
                      href={seed.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
                    >
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                      Demo
                    </a>
                  )}
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
                {isOwner && (
                  <Link
                    to={`/seeds/${seed.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-accent-dark transition-colors hover:text-accent"
                  >
                    View Project
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
