import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sprout, FolderGit2, Globe } from "lucide-react";
import { useActiveProject } from "../auth/useActiveProject";
import { getInitials } from "../lib/initials";
import { shouldShowStatusLabel } from "../lib/seedStatus";
import type { SeedSourceType } from "../types/seed";

const sourceLabel: Record<SeedSourceType, string> = {
  manual: "Manual",
  github: "GitHub",
  imported: "Imported",
  generated: "Generated",
};

export default function Seeds() {
  const { seeds, activeSeed, loading, error } = useActiveProject();
  const hasSeeds = seeds.length > 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Your Seeds
          </h1>
          <p className="mt-2 text-lg text-ink-soft">
            Every project you&apos;re growing, in one place.
          </p>
        </div>
        {hasSeeds && (
          <Link
            to="/seed/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
          >
            🌱 Plant a New Seed
          </Link>
        )}
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <div className="mt-8 flex items-center justify-center rounded-3xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16">
          <p className="text-sm text-ink-faint">Loading your Seeds…</p>
        </div>
      ) : hasSeeds ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {seeds.map((seed, index) => (
            <motion.div
              key={seed.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
                delay: index * 0.08,
              }}
            >
              <Link
                to={`/seeds/${seed.id}`}
                className="block rounded-2xl border border-border bg-canvas-elevated p-5 transition-shadow hover:shadow-[0_12px_32px_-16px_rgba(26,28,25,0.25)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-xs font-semibold text-white">
                    {getInitials(seed.title)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {seed.isPublished && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-dark">
                        <Globe className="h-2.5 w-2.5" strokeWidth={2.5} />
                        Published
                      </span>
                    )}
                    {seed.lifecycleStatus === "completed" && (
                      <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-white">
                        Completed
                      </span>
                    )}
                    {seed.lifecycleStatus === "archived" && (
                      <span className="rounded-full bg-border px-2 py-0.5 text-[11px] font-medium text-ink-faint">
                        Archived
                      </span>
                    )}
                    {seed.id === activeSeed?.id &&
                      shouldShowStatusLabel(seed.lifecycleStatus) && (
                        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-dark">
                          {seed.status}
                        </span>
                      )}
                  </div>
                </div>
                <p className="mt-3 text-sm font-semibold text-ink">
                  {seed.title}
                </p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {seed.description}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${seed.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-ink-soft">
                    {seed.progress}%
                  </span>
                </div>
                <p className="mt-3 text-[11px] font-medium text-ink-faint">
                  Source: {sourceLabel[seed.sourceType]}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16 text-center"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Sprout className="h-7 w-7" strokeWidth={2} />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-ink">
            You haven&apos;t planted a Seed yet
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            Start a new project when you&apos;re ready, or import one from
            GitHub once that&apos;s available.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/seed/new"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
            >
              🌱 Plant a New Seed
            </Link>
            <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-ink-faint">
              <FolderGit2 className="h-4 w-4" strokeWidth={2} />
              Import from GitHub
              <span className="rounded-full bg-border px-1.5 py-0.5 text-[10px] font-medium text-ink-faint">
                Soon
              </span>
            </span>
          </div>
        </motion.div>
      )}
    </main>
  );
}
