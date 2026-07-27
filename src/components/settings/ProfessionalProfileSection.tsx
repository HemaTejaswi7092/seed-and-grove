import type { FormEvent } from "react";
import type { GroveProfileFields } from "../../types/grove";
import AvatarUploadField from "./AvatarUploadField";
import EducationEditor from "./EducationEditor";
import ExperienceEditor from "./ExperienceEditor";
import CertificationEditor from "./CertificationEditor";
import CommaListInput from "./CommaListInput";

const inputClasses =
  "w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

interface ProfessionalProfileSectionProps {
  userId: string;
  fullName: string;
  onFullNameChange: (value: string) => void;
  draft: GroveProfileFields;
  onChange: (patch: Partial<GroveProfileFields>) => void;
  isDirty: boolean;
  status: "idle" | "saving" | "error";
  error: string | null;
  onSave: () => void;
}

export default function ProfessionalProfileSection({
  userId,
  fullName,
  onFullNameChange,
  draft,
  onChange,
  isDirty,
  status,
  error,
  onSave,
}: ProfessionalProfileSectionProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSave();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-accent-dark uppercase">
          Professional Profile
        </p>
        {isDirty && (
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-accent-dark">
            Unsaved changes
          </span>
        )}
      </div>

      <label className="block">
        <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
          Profile photo
        </span>
        <div className="mt-2">
          <AvatarUploadField
            userId={userId}
            displayName={fullName}
            value={draft.avatarUrl}
            onChange={(url) => onChange({ avatarUrl: url })}
          />
        </div>
      </label>

      <label className="block">
        <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
          Full name
        </span>
        <input
          className={`mt-1.5 ${inputClasses}`}
          value={fullName}
          onChange={(e) => onFullNameChange(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
          Professional headline
        </span>
        <input
          className={`mt-1.5 ${inputClasses}`}
          placeholder="e.g. Software Engineer · AI Builder"
          value={draft.headline}
          onChange={(e) => onChange({ headline: e.target.value })}
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
          Professional summary
        </span>
        <textarea
          className={`mt-1.5 resize-none ${inputClasses}`}
          rows={5}
          placeholder="Who you are, what you specialize in, the technologies or domains you work in, and the kind of opportunities you're looking for."
          value={draft.professionalSummary}
          onChange={(e) => onChange({ professionalSummary: e.target.value })}
        />
        <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
          Shown as the main introduction in your Grove&apos;s About section.
        </p>
      </label>

      <label className="block">
        <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
          Current location
        </span>
        <input
          className={`mt-1.5 ${inputClasses}`}
          placeholder="City, State"
          value={draft.location}
          onChange={(e) => onChange({ location: e.target.value })}
        />
      </label>

      <div className="border-t border-border pt-6">
        <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">Education</p>
        <div className="mt-3">
          <EducationEditor
            entries={draft.education}
            onChange={(education) => onChange({ education })}
          />
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
          Work experience
        </p>
        <div className="mt-3">
          <ExperienceEditor
            entries={draft.experience}
            onChange={(experience) => onChange({ experience })}
          />
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
          Certifications
        </p>
        <div className="mt-3">
          <CertificationEditor
            entries={draft.certifications}
            onChange={(certifications) => onChange({ certifications })}
          />
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <label className="block">
          <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
            Professional Skills
          </span>
          <CommaListInput
            className={`mt-1.5 ${inputClasses}`}
            placeholder="e.g. Python, Stakeholder Communication, Agile"
            value={draft.professionalSkills}
            onChange={(professionalSkills) => onChange({ professionalSkills })}
          />
        </label>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
          Comma-separated. Manually added for recruiters to skim quickly — this never drives
          your semantic match score, which is based on your published Achievements.
        </p>
      </div>

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
