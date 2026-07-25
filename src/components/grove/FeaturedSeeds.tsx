import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sprout, ArrowUpRight } from "lucide-react";
import { getInitials } from "../../lib/initials";
import type { FeaturedSeedCard } from "../../types/grove";

interface FeaturedSeedsProps {
  seeds: FeaturedSeedCard[];
}

export default function FeaturedSeeds({ seeds }: FeaturedSeedsProps) {
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
        Featured Seeds
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
                    <span className="mt-0.5 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-dark">
                      {seed.status}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {seed.description}
              </p>

              {seed.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {seed.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-ink-soft"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-4 text-xs text-ink-faint">
                  <span>{seed.evidenceCount} evidence points</span>
                  <span>{seed.progress}% complete</span>
                </div>
                <Link
                  to={`/seeds/${seed.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent-dark transition-colors hover:text-accent"
                >
                  View Project
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
