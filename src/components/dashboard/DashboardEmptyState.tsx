import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sprout, FolderGit2, Briefcase } from "lucide-react";

export default function DashboardEmptyState() {
  return (
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
        Start a new project when you&apos;re ready, or explore the rest of
        Seed &amp; Grove.
      </p>

      <Link
        to="/seed/new"
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
      >
        🌱 Plant a New Seed
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-medium text-ink-faint">
          <FolderGit2 className="h-3.5 w-3.5" strokeWidth={2} />
          Import from GitHub
          <span className="rounded-full bg-border px-1.5 py-0.5 text-[10px] font-medium text-ink-faint">
            Soon
          </span>
        </span>
        <Link
          to="/grove"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
        >
          View Your Grove
        </Link>
        <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-medium text-ink-faint">
          <Briefcase className="h-3.5 w-3.5" strokeWidth={2} />
          Explore Opportunities
          <span className="rounded-full bg-border px-1.5 py-0.5 text-[10px] font-medium text-ink-faint">
            Soon
          </span>
        </span>
      </div>

      <p className="mt-5 text-xs text-ink-faint">
        Seeds can be created manually or imported later — nothing here is
        required to start exploring.
      </p>
    </motion.div>
  );
}
