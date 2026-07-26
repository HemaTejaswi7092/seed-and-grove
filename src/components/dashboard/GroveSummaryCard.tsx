import { Link } from "react-router-dom";
import { ArrowUpRight, Sprout } from "lucide-react";

interface GroveSummaryCardProps {
  displayName: string;
  initials: string;
  headline: string;
  publishedSeedsCount: number;
  publicEvidenceCount: number;
  skillsCount: number;
}

// The left sidebar on the Dashboard feed — a condensed version of Grove's
// own ProfileIdentityCard, scoped to just enough to orient the viewer and
// link out to their full Grove. Always the current user's own data; the
// Dashboard never shows anyone else's Grove summary here.
export default function GroveSummaryCard({
  displayName,
  initials,
  headline,
  publishedSeedsCount,
  publicEvidenceCount,
  skillsCount,
}: GroveSummaryCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-canvas-elevated p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
          {headline && (
            <p className="truncate text-xs text-ink-faint">{headline}</p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
        <div>
          <p className="text-sm font-semibold text-ink">{publishedSeedsCount}</p>
          <p className="text-[11px] text-ink-faint">Seeds</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{publicEvidenceCount}</p>
          <p className="text-[11px] text-ink-faint">Evidence</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{skillsCount}</p>
          <p className="text-[11px] text-ink-faint">Skills</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Link
          to="/grove"
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
        >
          View my Grove
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
        <Link
          to="/seed/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
        >
          <Sprout className="h-3.5 w-3.5" strokeWidth={2} />
          Plant a new Seed
        </Link>
      </div>
    </div>
  );
}
