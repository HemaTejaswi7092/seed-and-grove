import { useState, type FormEvent } from "react";
import {
  Sparkles,
  Globe,
  Lock,
  Share2,
  Trophy,
  RotateCcw,
  MoreHorizontal,
  Archive,
  ArchiveRestore,
  Link2,
  X,
} from "lucide-react";
import ProgressRing from "./ProgressRing";
import { getInitials } from "../../lib/initials";
import { useMenuDismissRef } from "../../lib/useMenuDismiss";
import type { WorkspaceTab } from "./tabs";
import type { Seed } from "../../types/seed";
import type { ProjectStat } from "../../types/mockData";

const tabs: { tab: WorkspaceTab; label: string }[] = [
  { tab: "workspace", label: "Workspace" },
  { tab: "activity", label: "Activity" },
  { tab: "evidence", label: "Achievements" },
];

interface ProjectHeaderProps {
  seed: Seed;
  stats: ProjectStat[];
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  // The demo Seed ships pre-published/pre-completed and isn't backed by
  // real storage, so it has nothing to toggle — omitting these props
  // hides every control entirely rather than rendering ones that can't
  // do anything.
  onTogglePublish?: () => void;
  onShareToFeed?: () => void;
  // Opens the completion checklist — Seed.tsx owns the actual
  // completeSeed() call once the candidate confirms there.
  onCompleteProject?: () => void;
  onReopenProject?: () => void;
  onArchiveProject?: () => void;
  onUnarchiveProject?: () => void;
  // Repo/demo URLs shown on the Grove Projects card — independent of
  // publish state, so a candidate can fill these in before ever
  // publishing. Omitted (like the other handlers) for the demo Seed,
  // which isn't backed by real storage.
  onSaveLinks?: (links: { repoUrl: string; demoUrl: string }) => Promise<void>;
}

export default function ProjectHeader({
  seed,
  stats,
  activeTab,
  onTabChange,
  onTogglePublish,
  onShareToFeed,
  onCompleteProject,
  onReopenProject,
  onArchiveProject,
  onUnarchiveProject,
  onSaveLinks,
}: ProjectHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [linksModalOpen, setLinksModalOpen] = useState(false);
  const menuRef = useMenuDismissRef<HTMLDivElement>(menuOpen, () => setMenuOpen(false));
  const isArchived = seed.lifecycleStatus === "archived";
  const isCompleted = seed.lifecycleStatus === "completed";

  return (
    <div className="border-b border-border bg-canvas-elevated px-8 pt-8">
      <div className="flex flex-col flex-wrap gap-6 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-white">
            {getInitials(seed.title)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
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
              {isCompleted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-0.5 text-xs font-medium text-white">
                  <Trophy className="h-3 w-3" strokeWidth={2.25} />
                  Completed
                </span>
              )}
              {isArchived && (
                <span className="inline-flex items-center gap-1 rounded-full bg-border px-2.5 py-0.5 text-xs font-medium text-ink-faint">
                  Archived
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-soft">{seed.description}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-accent-dark">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
              AI Copilot ready — using your Seed context
            </p>
            {onSaveLinks && (
              <button
                type="button"
                onClick={() => setLinksModalOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint transition-colors hover:text-ink"
              >
                <Link2 className="h-3.5 w-3.5" strokeWidth={2} />
                {seed.repoUrl || seed.demoUrl ? "Edit project links" : "Add repo/demo links"}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-3">
          {onCompleteProject && seed.lifecycleStatus === "in_progress" && (
            <button
              type="button"
              onClick={onCompleteProject}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            >
              <Trophy className="h-3.5 w-3.5" strokeWidth={2} />
              Mark Project as Complete
            </button>
          )}
          {onReopenProject && isCompleted && (
            <button
              type="button"
              onClick={onReopenProject}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
              Reopen Project
            </button>
          )}
          {onTogglePublish && (
            <button
              type="button"
              onClick={onTogglePublish}
              className={[
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                seed.isPublished
                  ? "border-accent-soft-border bg-accent-soft text-accent-dark"
                  : "border-border text-ink-soft hover:border-ink-faint",
              ].join(" ")}
            >
              {seed.isPublished ? (
                <>
                  <Globe className="h-3.5 w-3.5" strokeWidth={2} />
                  Published to Grove
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" strokeWidth={2} />
                  Private
                </>
              )}
            </button>
          )}
          {onShareToFeed && seed.isPublished && (
            <button
              type="button"
              onClick={onShareToFeed}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            >
              <Share2 className="h-3.5 w-3.5" strokeWidth={2} />
              Share to feed
            </button>
          )}
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

          {(onArchiveProject || onUnarchiveProject) && (
            <div className="relative" ref={menuOpen ? menuRef : undefined}>
              <button
                type="button"
                aria-label="More project options"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-canvas hover:text-ink"
              >
                <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-canvas-elevated shadow-lg">
                  {!isArchived && onArchiveProject && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onArchiveProject();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
                    >
                      <Archive className="h-3.5 w-3.5" strokeWidth={2} />
                      Archive project
                    </button>
                  )}
                  {isArchived && onUnarchiveProject && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onUnarchiveProject();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" strokeWidth={2} />
                      Unarchive project
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
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

      {linksModalOpen && onSaveLinks && (
        <ProjectLinksModal
          repoUrl={seed.repoUrl}
          demoUrl={seed.demoUrl}
          onClose={() => setLinksModalOpen(false)}
          onSave={async (links) => {
            await onSaveLinks(links);
            setLinksModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ProjectLinksModal({
  repoUrl,
  demoUrl,
  onClose,
  onSave,
}: {
  repoUrl: string;
  demoUrl: string;
  onClose: () => void;
  onSave: (links: { repoUrl: string; demoUrl: string }) => Promise<void>;
}) {
  const [repo, setRepo] = useState(repoUrl);
  const [demo, setDemo] = useState(demoUrl);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onSave({ repoUrl: repo.trim(), demoUrl: demo.trim() });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 px-4 py-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-canvas-elevated p-6 shadow-[0_24px_64px_-24px_rgba(26,28,25,0.4)]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Project links</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
          Shown on this project's card in your Grove, whenever you fill them in.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
              Repository
            </span>
            <input
              className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
              placeholder="https://github.com/you/project"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
              Live demo
            </span>
            <input
              className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
              placeholder="https://your-demo.example.com"
              value={demo}
              onChange={(e) => setDemo(e.target.value)}
            />
          </label>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full border border-border px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-accent px-4 py-2 text-xs font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save links"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
