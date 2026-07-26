import { Link } from "react-router-dom";
import { Sprout, Bot, Activity, Sparkles, Settings, Flame } from "lucide-react";
import type { WorkspaceTab } from "./tabs";
import type { Seed } from "../../types/seed";

const navItems: { tab: WorkspaceTab; label: string; icon: typeof Bot }[] = [
  { tab: "workspace", label: "Workspace", icon: Bot },
  { tab: "activity", label: "Activity", icon: Activity },
  { tab: "evidence", label: "Achievements", icon: Sparkles },
];

interface WorkspaceSidebarProps {
  seeds: Seed[];
  activeSeedId: string;
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  daysBuilding: number;
  isDemo: boolean;
}

export default function WorkspaceSidebar({
  seeds,
  activeSeedId,
  activeTab,
  onTabChange,
  daysBuilding,
  isDemo,
}: WorkspaceSidebarProps) {
  const activeSeed = seeds.find((seed) => seed.id === activeSeedId);

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-ink-950 text-white/90">
      <Link to="/" className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-emerald-400">
          <Sprout className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <span className="text-sm font-semibold tracking-tight text-white">
          Seed &amp; Grove
        </span>
      </Link>

      <div className="mt-2 px-3">
        <p className="px-2 pb-2 text-[11px] font-semibold tracking-wide text-white/40 uppercase">
          Your Seeds
        </p>
        <div className="flex flex-col gap-0.5">
          {seeds.map((seed) => {
            const isActive = seed.id === activeSeedId;
            return (
              <Link
                key={seed.id}
                to={`/seeds/${seed.id}`}
                className={[
                  "flex flex-col gap-1.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                  isActive ? "bg-white/10" : "hover:bg-white/5",
                ].join(" ")}
              >
                <span className="flex items-center justify-between gap-2">
                  <span
                    className={[
                      "truncate text-sm font-medium",
                      isActive ? "text-white" : "text-white/70",
                    ].join(" ")}
                  >
                    {seed.title}
                  </span>
                  {seed.lifecycleStatus === "completed" ? (
                    <span className="shrink-0 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                      Completed
                    </span>
                  ) : seed.lifecycleStatus === "archived" ? (
                    <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/40">
                      Archived
                    </span>
                  ) : (
                    <span className="shrink-0 text-[11px] text-white/40">
                      {seed.progress}%
                    </span>
                  )}
                </span>
                <span className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <span
                    className="block h-full rounded-full bg-emerald-500"
                    style={{ width: `${seed.progress}%` }}
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-6 px-3">
        <p className="px-2 pb-2 text-[11px] font-semibold tracking-wide text-white/40 uppercase">
          {activeSeed?.title}
        </p>
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => onTabChange(item.tab)}
                className={[
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "text-white/60 hover:bg-white/5 hover:text-white/90",
                ].join(" ")}
              >
                <item.icon className="h-4 w-4" strokeWidth={2} />
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white/90"
          >
            <Settings className="h-4 w-4" strokeWidth={2} />
            Settings
          </button>
        </nav>
      </div>

      <div className="mt-auto px-5 py-5">
        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <Flame className="h-4 w-4 text-orange-400" strokeWidth={2.25} />
          <div>
            <p className="text-xs font-semibold text-white">
              {isDemo
                ? "14-day build streak"
                : `Day ${daysBuilding} building`}
            </p>
            <p className="text-[11px] text-white/40">Keep the momentum</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
