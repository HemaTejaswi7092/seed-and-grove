import { Sparkles } from "lucide-react";
import ProgressRing from "./ProgressRing";
import { getInitials } from "../../lib/initials";
import type { WorkspaceTab } from "./tabs";
import type { Seed } from "../../types/seed";
import type { ProjectStat } from "../../types/mockData";

const tabs: { tab: WorkspaceTab; label: string }[] = [
  { tab: "workspace", label: "Workspace" },
  { tab: "activity", label: "Activity" },
  { tab: "evidence", label: "Evidence" },
];

interface ProjectHeaderProps {
  seed: Seed;
  stats: ProjectStat[];
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
}

export default function ProjectHeader({
  seed,
  stats,
  activeTab,
  onTabChange,
}: ProjectHeaderProps) {
  return (
    <div className="border-b border-border bg-canvas-elevated px-8 pt-8">
      <div className="flex flex-col gap-6 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-white">
            {getInitials(seed.title)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-ink">
                {seed.title}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent-dark">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                {seed.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">{seed.description}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-accent-dark">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
              AI Copilot ready — using your Seed context
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-lg font-semibold text-ink">
                  {stat.value}
                </p>
                <p className="text-xs text-ink-faint">{stat.label}</p>
              </div>
            ))}
          </div>
          <ProgressRing progress={seed.progress} />
        </div>
      </div>

      <div className="flex gap-6">
        {tabs.map((item) => {
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => onTabChange(item.tab)}
              className={[
                "relative pb-3 text-sm font-medium transition-colors",
                isActive ? "text-ink" : "text-ink-faint hover:text-ink-soft",
              ].join(" ")}
            >
              {item.label}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
