import { Plus, Trash2 } from "lucide-react";
import type { VideoEntry } from "../../recruiter/types";

interface VideoEditorProps {
  entries: VideoEntry[];
  onChange: (entries: VideoEntry[]) => void;
}

const inputClasses =
  "w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

function newEntry(): VideoEntry {
  return { id: crypto.randomUUID(), title: "", url: "" };
}

// Mirrors ExperienceEditor/EducationEditor/CertificationEditor's
// repeatable-entry pattern exactly (see components/settings/) — a link,
// not an upload, since there's no video storage anywhere in this app.
export default function VideoEditor({ entries, onChange }: VideoEditorProps) {
  function update(id: string, patch: Partial<VideoEntry>) {
    onChange(entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function remove(id: string) {
    onChange(entries.filter((entry) => entry.id !== id));
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <div key={entry.id} className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
              Video {index + 1}
            </p>
            <button
              type="button"
              onClick={() => remove(entry.id)}
              aria-label="Remove video"
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              className={inputClasses}
              placeholder="Title"
              value={entry.title}
              onChange={(e) => update(entry.id, { title: e.target.value })}
            />
            <input
              className={inputClasses}
              type="url"
              placeholder="https://..."
              value={entry.url}
              onChange={(e) => update(entry.id, { url: e.target.value })}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...entries, newEntry()])}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        Add video
      </button>
    </div>
  );
}
