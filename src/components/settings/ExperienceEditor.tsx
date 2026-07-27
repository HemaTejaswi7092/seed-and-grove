import { Plus, Trash2 } from "lucide-react";
import type { ExperienceEntry } from "../../types/grove";

interface ExperienceEditorProps {
  entries: ExperienceEntry[];
  onChange: (entries: ExperienceEntry[]) => void;
}

const inputClasses =
  "w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

function newEntry(): ExperienceEntry {
  return {
    id: crypto.randomUUID(),
    company: "",
    title: "",
    location: "",
    startDate: "",
    endDate: "",
    currentlyWorking: false,
    description: "",
  };
}

export default function ExperienceEditor({ entries, onChange }: ExperienceEditorProps) {
  function update(id: string, patch: Partial<ExperienceEntry>) {
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
              Experience {index + 1}
            </p>
            <button
              type="button"
              onClick={() => remove(entry.id)}
              aria-label="Remove experience entry"
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              className={inputClasses}
              placeholder="Job title"
              value={entry.title}
              onChange={(e) => update(entry.id, { title: e.target.value })}
            />
            <input
              className={inputClasses}
              placeholder="Company"
              value={entry.company}
              onChange={(e) => update(entry.id, { company: e.target.value })}
            />
            <input
              className={inputClasses}
              placeholder="Location"
              value={entry.location}
              onChange={(e) => update(entry.id, { location: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className={inputClasses}
                type="month"
                value={entry.startDate}
                onChange={(e) => update(entry.id, { startDate: e.target.value })}
              />
              <input
                className={inputClasses}
                type="month"
                disabled={entry.currentlyWorking}
                value={entry.endDate}
                onChange={(e) => update(entry.id, { endDate: e.target.value })}
              />
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={entry.currentlyWorking}
              onChange={(e) =>
                update(entry.id, {
                  currentlyWorking: e.target.checked,
                  endDate: e.target.checked ? "" : entry.endDate,
                })
              }
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
            />
            I currently work here
          </label>
          <textarea
            className={`mt-3 resize-none ${inputClasses}`}
            rows={3}
            placeholder="Key responsibilities or impact"
            value={entry.description}
            onChange={(e) => update(entry.id, { description: e.target.value })}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...entries, newEntry()])}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        Add experience
      </button>
    </div>
  );
}
