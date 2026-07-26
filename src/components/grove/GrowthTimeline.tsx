import { Rocket, Trophy, ShieldCheck, TrendingUp, History } from "lucide-react";
import type {
  GrowthTimelineEntry,
  GrowthTimelineEntryType,
} from "../../types/grove";

interface GrowthTimelineProps {
  entries: GrowthTimelineEntry[];
}

const iconByType: Record<GrowthTimelineEntryType, typeof Rocket> = {
  seed_published: Rocket,
  seed_completed: Trophy,
  achievement_published: ShieldCheck,
  skill_demonstrated: TrendingUp,
};

export default function GrowthTimeline({ entries }: GrowthTimelineProps) {
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
        Growth Timeline
      </h2>

      {entries.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <History className="h-6 w-6" strokeWidth={2} />
          </span>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-faint">
            Your published milestones will appear here as your Grove grows.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-1">
          {entries.map((entry) => {
            const Icon = iconByType[entry.type];
            return (
              <li
                key={entry.id}
                className="flex gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-canvas-elevated"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas-elevated text-accent ring-1 ring-border">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm leading-snug text-ink">{entry.title}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">{entry.date}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
