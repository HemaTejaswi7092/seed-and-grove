import { Plus, Trash2 } from "lucide-react";
import type { EducationEntry } from "../../types/grove";

interface EducationEditorProps {
  entries: EducationEntry[];
  onChange: (entries: EducationEntry[]) => void;
}

const inputClasses =
  "w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

function newEntry(): EducationEntry {
  return {
    id: crypto.randomUUID(),
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startYear: "",
    endYear: "",
    description: "",
  };
}

export default function EducationEditor({ entries, onChange }: EducationEditorProps) {
  function update(id: string, patch: Partial<EducationEntry>) {
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
              Education {index + 1}
            </p>
            <button
              type="button"
              onClick={() => remove(entry.id)}
              aria-label="Remove education entry"
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              className={inputClasses}
              placeholder="Institution"
              value={entry.institution}
              onChange={(e) => update(entry.id, { institution: e.target.value })}
            />
            <input
              className={inputClasses}
              placeholder="Degree (e.g. B.S.)"
              value={entry.degree}
              onChange={(e) => update(entry.id, { degree: e.target.value })}
            />
            <input
              className={inputClasses}
              placeholder="Field of study"
              value={entry.fieldOfStudy}
              onChange={(e) => update(entry.id, { fieldOfStudy: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className={inputClasses}
                placeholder="Start year"
                inputMode="numeric"
                value={entry.startYear}
                onChange={(e) => update(entry.id, { startYear: e.target.value })}
              />
              <input
                className={inputClasses}
                placeholder="End year (or expected)"
                inputMode="numeric"
                value={entry.endYear}
                onChange={(e) => update(entry.id, { endYear: e.target.value })}
              />
            </div>
          </div>
          <textarea
            className={`mt-3 resize-none ${inputClasses}`}
            rows={2}
            placeholder="Description (optional)"
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
        Add education
      </button>
    </div>
  );
}
