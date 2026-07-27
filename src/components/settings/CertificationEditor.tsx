import { Plus, Trash2 } from "lucide-react";
import type { CertificationEntry } from "../../types/grove";

interface CertificationEditorProps {
  entries: CertificationEntry[];
  onChange: (entries: CertificationEntry[]) => void;
}

const inputClasses =
  "w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

function newEntry(): CertificationEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    issuingOrganization: "",
    issueDate: "",
    expirationDate: "",
    credentialUrl: "",
  };
}

export default function CertificationEditor({ entries, onChange }: CertificationEditorProps) {
  function update(id: string, patch: Partial<CertificationEntry>) {
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
              Certification {index + 1}
            </p>
            <button
              type="button"
              onClick={() => remove(entry.id)}
              aria-label="Remove certification"
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              className={inputClasses}
              placeholder="Certification name"
              value={entry.name}
              onChange={(e) => update(entry.id, { name: e.target.value })}
            />
            <input
              className={inputClasses}
              placeholder="Issuing organization"
              value={entry.issuingOrganization}
              onChange={(e) => update(entry.id, { issuingOrganization: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className={inputClasses}
                type="month"
                placeholder="Issue date"
                value={entry.issueDate}
                onChange={(e) => update(entry.id, { issueDate: e.target.value })}
              />
              <input
                className={inputClasses}
                type="month"
                placeholder="Expiration (optional)"
                value={entry.expirationDate}
                onChange={(e) => update(entry.id, { expirationDate: e.target.value })}
              />
            </div>
            <input
              className={inputClasses}
              type="url"
              placeholder="Credential URL (optional)"
              value={entry.credentialUrl}
              onChange={(e) => update(entry.id, { credentialUrl: e.target.value })}
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
        Add certification
      </button>
    </div>
  );
}
