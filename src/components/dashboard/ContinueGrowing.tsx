import { Link } from "react-router-dom";
import { getInitials } from "../../lib/initials";
import type { ProjectStat } from "../../types/mockData";
import type { Seed } from "../../types/seed";

interface ContinueGrowingProps {
  activeSeed: Seed;
  stats: ProjectStat[];
}

export default function ContinueGrowing({
  activeSeed,
  stats,
}: ContinueGrowingProps) {
  return (
    <div className="mt-8">
      <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
        Continue Growing
      </h2>
      <Link
        to={`/seeds/${activeSeed.id}`}
        className="mt-4 block rounded-2xl border border-border bg-canvas-elevated p-6 transition-shadow hover:shadow-[0_12px_32px_-16px_rgba(26,28,25,0.25)]"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-white">
              {getInitials(activeSeed.title)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-ink">
                  {activeSeed.title}
                </p>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-dark">
                  {activeSeed.status}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-ink-faint">
                {activeSeed.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:w-40">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${activeSeed.progress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-ink-soft">
              {activeSeed.progress}%
            </span>
          </div>
        </div>
      </Link>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-canvas-elevated p-4"
          >
            <p className="text-xl font-semibold text-ink">{stat.value}</p>
            <p className="mt-0.5 text-xs text-ink-faint">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
