import type { FormEvent } from "react";
import type { GroveProfileFields } from "../../types/grove";
import CommaListInput from "./CommaListInput";

const inputClasses =
  "w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

const JOB_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
];

interface CareerPreferencesSectionProps {
  draft: GroveProfileFields;
  onChange: (patch: Partial<GroveProfileFields>) => void;
  isDirty: boolean;
  status: "idle" | "saving" | "error";
  error: string | null;
  onSave: () => void;
}

// These preferences may inform semantic job matching later, but they
// never replace it — match-jobs-for-candidate builds its query solely
// from published Achievements plus the existing interest/direction
// fields (see that Edge Function's header comment). Nothing here is
// wired into it.
export default function CareerPreferencesSection({
  draft,
  onChange,
  isDirty,
  status,
  error,
  onSave,
}: CareerPreferencesSectionProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSave();
  }

  function toggleJobType(value: string) {
    const next = draft.preferredJobTypes.includes(value)
      ? draft.preferredJobTypes.filter((v) => v !== value)
      : [...draft.preferredJobTypes, value];
    onChange({ preferredJobTypes: next });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-accent-dark uppercase">
          Career Preferences
        </p>
        {isDirty && (
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-accent-dark">
            Unsaved changes
          </span>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={draft.opportunities.openToOpportunities}
          onChange={(e) =>
            onChange({
              opportunities: { ...draft.opportunities, openToOpportunities: e.target.checked },
            })
          }
          className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
        />
        Open to work
      </label>

      <label className="block">
        <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
          Target roles
        </span>
        <input
          className={`mt-1.5 ${inputClasses}`}
          placeholder="e.g. Backend Engineer, ML Engineer"
          value={draft.opportunities.rolesOfInterest}
          onChange={(e) =>
            onChange({ opportunities: { ...draft.opportunities, rolesOfInterest: e.target.value } })
          }
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
          Areas of interest
        </span>
        <input
          className={`mt-1.5 ${inputClasses}`}
          placeholder="e.g. Computer vision, developer tooling"
          value={draft.areasOfInterest}
          onChange={(e) => onChange({ areasOfInterest: e.target.value })}
        />
        <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
          Shown as a small supporting line under your professional summary in Grove.
        </p>
      </label>

      <label className="block">
        <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
          Availability status
        </span>
        <input
          className={`mt-1.5 ${inputClasses}`}
          placeholder="e.g. Open to full-time opportunities"
          value={draft.availability}
          onChange={(e) => onChange({ availability: e.target.value })}
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
          Collaboration interests
        </span>
        <input
          className={`mt-1.5 ${inputClasses}`}
          placeholder="e.g. Early-stage teams building real-time ML products"
          value={draft.opportunities.collaborationInterests}
          onChange={(e) =>
            onChange({
              opportunities: { ...draft.opportunities, collaborationInterests: e.target.value },
            })
          }
        />
      </label>

      <div>
        <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
          Preferred job types
        </span>
        <div className="mt-2 flex flex-wrap gap-4">
          {JOB_TYPE_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={draft.preferredJobTypes.includes(option.value)}
                onChange={() => toggleJobType(option.value)}
                className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
            Preferred work arrangement
          </span>
          <select
            className={`mt-1.5 ${inputClasses}`}
            value={draft.opportunities.workMode}
            onChange={(e) =>
              onChange({ opportunities: { ...draft.opportunities, workMode: e.target.value } })
            }
          >
            <option value="">No preference</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
            Availability date
          </span>
          <input
            type="date"
            className={`mt-1.5 ${inputClasses}`}
            value={draft.availabilityDate}
            onChange={(e) => onChange({ availabilityDate: e.target.value })}
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
          Preferred locations{" "}
          <span className="normal-case text-ink-faint">(comma-separated)</span>
        </span>
        <CommaListInput
          className={`mt-1.5 ${inputClasses}`}
          placeholder="e.g. Orlando FL, Remote"
          value={draft.preferredLocations}
          onChange={(preferredLocations) => onChange({ preferredLocations })}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
            Work authorization
          </span>
          <input
            className={`mt-1.5 ${inputClasses}`}
            placeholder="e.g. U.S. Citizen"
            value={draft.workAuthorization}
            onChange={(e) => onChange({ workAuthorization: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
            Years of experience / career level
          </span>
          <input
            className={`mt-1.5 ${inputClasses}`}
            placeholder="e.g. 3-5 years, Mid-level"
            value={draft.yearsOfExperience}
            onChange={(e) => onChange({ yearsOfExperience: e.target.value })}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={draft.requiresSponsorship}
          onChange={(e) => onChange({ requiresSponsorship: e.target.checked })}
          className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
        />
        Requires sponsorship
      </label>

      {status === "error" && error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex justify-end border-t border-border pt-6">
        <button
          type="submit"
          disabled={status === "saving" || !isDirty}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
