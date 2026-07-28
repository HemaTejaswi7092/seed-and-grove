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
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { getInitials } from "../../lib/initials";
import { useMenuDismissRef } from "../../lib/useMenuDismiss";
import { shouldShowStatusLabel } from "../../lib/seedStatus";
import type { WorkspaceTab } from "./tabs";
import type { Seed } from "../../types/seed";
import type { ProjectHeaderMetadataItem } from "../../types/mockData";

const tabs: { tab: WorkspaceTab; label: string }[] = [
  { tab: "workspace", label: "Workspace" },
  { tab: "timeline", label: "Timeline" },
  { tab: "evidence", label: "Achievements" },
];

interface ProjectHeaderProps {
  seed: Seed;
  // A single compact "📅 2 Days · 🏆 3 Achievements · ..." row — see
  // pages/Seed.tsx for how each item is computed. Deliberately small and
  // inline, not a stacked value/label block: lifecycle/publish state
  // already has its own dedicated, un-redundant home (the title-line
  // badges above and the Complete/Reopen/Publish buttons below), so this
  // row is just build/evidence counts, nothing duplicated.
  metadata: ProjectHeaderMetadataItem[];
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  // The demo Seed ships pre-published/pre-completed and isn't backed by
  // real storage, so it has nothing to toggle — omitting these props
  // hides every control entirely rather than rendering ones that can't
  // do anything.
  onTogglePublish?: () => void;
  onShareToFeed?: () => void;
  // Opens the required Project Completion workflow — does NOT complete
  // the project itself. Seed.tsx owns the actual completeSeed() call,
  // which only happens once the candidate has logged at least one
  // achievement from inside that workflow.
  onCompleteProject?: () => void;
  onReopenProject?: () => void;
  onArchiveProject?: () => void;
  onUnarchiveProject?: () => void;
  // Repo/demo URLs shown on the Grove Projects card — independent of
  // publish state, so a candidate can fill these in before ever
  // publishing. Omitted (like the other handlers) for the demo Seed,
  // which isn't backed by real storage.
  onSaveLinks?: (links: { repoUrl: string; demoUrl: string }) => Promise<void>;
  // Manual, AI-free achievement entry — always available, independent of
  // the completion workflow, so a candidate can record a milestone at
  // any point. The completion workflow (opened via onCompleteProject)
  // has its own built-in manual-add entry point too, for when AI
  // suggestions are unavailable or insufficient at completion time.
  onAddAchievement?: () => void;
  // Edits title/description/technologies — the Seed's core metadata,
  // independent of lifecycle/publish state. Re-syncs the Grove mirror
  // itself (see state/seedPublishing.ts's updateSeedDetailsAndSync) if
  // this Seed is already published, so an edit never needs a second,
  // separate "update Grove" step.
  onEditSeed?: (details: {
    title: string;
    description: string;
    technologies: string[];
  }) => Promise<void>;
  // Opens the delete confirmation — Seed.tsx owns the actual confirm
  // dialog/delete call, same split as onCompleteProject/
  // onOpenCompletionWorkflow above.
  onRequestDelete?: () => void;
}

export default function ProjectHeader({
  seed,
  metadata,
  activeTab,
  onTabChange,
  onTogglePublish,
  onShareToFeed,
  onCompleteProject,
  onReopenProject,
  onArchiveProject,
  onUnarchiveProject,
  onSaveLinks,
  onAddAchievement,
  onEditSeed,
  onRequestDelete,
}: ProjectHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [linksModalOpen, setLinksModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const menuRef = useMenuDismissRef<HTMLDivElement>(menuOpen, () => setMenuOpen(false));
  const isArchived = seed.lifecycleStatus === "archived";
  const isCompleted = seed.lifecycleStatus === "completed";

  return (
    <div className="border-b border-border bg-canvas-elevated px-6 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-xs font-semibold text-white">
            {getInitials(seed.title)}
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <h1 className="truncate text-lg font-semibold tracking-tight text-ink">
              {seed.title}
            </h1>
            {shouldShowStatusLabel(seed.lifecycleStatus) && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-dark">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                {seed.status}
              </span>
            )}
            {isCompleted && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-xs font-medium text-white">
                <Trophy className="h-3 w-3" strokeWidth={2.25} />
                Completed
              </span>
            )}
            {isArchived && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-border px-2 py-0.5 text-xs font-medium text-ink-faint">
                Archived
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {onCompleteProject && seed.lifecycleStatus === "in_progress" && (
            <button
              type="button"
              onClick={onCompleteProject}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            >
              <Trophy className="h-3.5 w-3.5" strokeWidth={2} />
              Complete Project
            </button>
          )}
          {onReopenProject && isCompleted && (
            <button
              type="button"
              onClick={onReopenProject}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
              Reopen
            </button>
          )}
          {onTogglePublish && (
            <button
              type="button"
              onClick={onTogglePublish}
              className={[
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                seed.isPublished
                  ? "border-accent-soft-border bg-accent-soft text-accent-dark"
                  : "border-border text-ink-soft hover:border-ink-faint",
              ].join(" ")}
            >
              {seed.isPublished ? (
                <>
                  <Globe className="h-3.5 w-3.5" strokeWidth={2} />
                  Published
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" strokeWidth={2} />
                  Private
                </>
              )}
            </button>
          )}
          {onAddAchievement && (
            <button
              type="button"
              onClick={onAddAchievement}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              New Achievement
            </button>
          )}
          {onShareToFeed && seed.isPublished && (
            <button
              type="button"
              onClick={onShareToFeed}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            >
              <Share2 className="h-3.5 w-3.5" strokeWidth={2} />
              Share
            </button>
          )}

          {(onArchiveProject || onUnarchiveProject || onEditSeed || onRequestDelete) && (
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
                  {onEditSeed && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setEditModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                      Edit Seed
                    </button>
                  )}
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
                  {onRequestDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onRequestDelete();
                      }}
                      className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      Delete Seed
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {seed.description && (
        <p className="mt-1 truncate text-sm text-ink-soft">{seed.description}</p>
      )}

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-dark">
          <Sparkles className="h-3 w-3" strokeWidth={2.25} />
          AI Copilot ready
        </span>
        {onSaveLinks && (
          <button
            type="button"
            onClick={() => setLinksModalOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-faint transition-colors hover:text-ink"
          >
            <Link2 className="h-3 w-3" strokeWidth={2} />
            {seed.repoUrl || seed.demoUrl ? "Edit links" : "Add links"}
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-medium text-ink-soft">
        {metadata.map((item, index) => (
          <span key={item.label} className="inline-flex items-center gap-1.5">
            {index > 0 && <span className="text-ink-faint">·</span>}
            <span aria-hidden="true">{item.emoji}</span>
            {item.value} {item.label}
          </span>
        ))}
      </div>

      <div className="mt-3 flex gap-5">
        {tabs.map((item) => {
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => onTabChange(item.tab)}
              className={[
                "relative pb-2 text-sm font-medium transition-colors",
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

      {editModalOpen && onEditSeed && (
        <EditSeedModal
          title={seed.title}
          description={seed.description}
          technologies={seed.technologies}
          onClose={() => setEditModalOpen(false)}
          onSave={async (details) => {
            await onEditSeed(details);
            setEditModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function EditSeedModal({
  title,
  description,
  technologies,
  onClose,
  onSave,
}: {
  title: string;
  description: string;
  technologies: string[];
  onClose: () => void;
  onSave: (details: {
    title: string;
    description: string;
    technologies: string[];
  }) => Promise<void>;
}) {
  const [name, setName] = useState(title);
  const [desc, setDesc] = useState(description);
  const [tech, setTech] = useState(technologies.join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        title: name.trim() || "Untitled Seed",
        description: desc.trim(),
        technologies: tech
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save these changes.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 px-4 py-10 backdrop-blur-sm"
      onClick={saving ? undefined : onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-canvas-elevated p-6 shadow-[0_24px_64px_-24px_rgba(26,28,25,0.4)]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Edit Seed</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink disabled:opacity-50"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
              Seed name
            </span>
            <input
              required
              className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
              Description
            </span>
            <textarea
              rows={3}
              className="mt-1.5 w-full resize-none rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
              Technologies (comma-separated)
            </span>
            <input
              className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
              placeholder="e.g. Python, React, PyTorch"
              value={tech}
              onChange={(e) => setTech(e.target.value)}
            />
          </label>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}
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
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
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
