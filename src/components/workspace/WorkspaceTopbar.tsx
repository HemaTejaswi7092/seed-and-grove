import { ChevronRight, Search, Bell } from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { getInitials } from "../../lib/initials";
import { getDisplayName } from "../../lib/displayName";

interface WorkspaceTopbarProps {
  seedTitle: string;
}

export default function WorkspaceTopbar({ seedTitle }: WorkspaceTopbarProps) {
  const { user, profile } = useAuth();

  const initials = getInitials(getDisplayName(user, profile));

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-canvas-elevated px-6">
      <div className="flex items-center gap-1.5 text-sm text-ink-soft">
        <span>Your Seeds</span>
        <ChevronRight className="h-3.5 w-3.5 text-ink-faint" />
        <span className="font-medium text-ink">{seedTitle}</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-ink-faint transition-colors hover:border-ink-faint"
        >
          <Search className="h-3.5 w-3.5" strokeWidth={2} />
          Search
          <span className="rounded border border-border px-1 font-mono text-[10px]">
            ⌘K
          </span>
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
        >
          <Bell className="h-4 w-4" strokeWidth={2} />
        </button>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
          {initials}
        </span>
      </div>
    </header>
  );
}
