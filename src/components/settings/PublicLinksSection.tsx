import { useState, type FormEvent } from "react";
import type { GroveProfileFields } from "../../types/grove";
import { isValidUrl } from "../../lib/validateUrl";
import ResumeUploadField from "./ResumeUploadField";

const inputClasses =
  "w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

interface PublicLinksSectionProps {
  userId: string;
  draft: GroveProfileFields;
  onChange: (patch: Partial<GroveProfileFields>) => void;
  isDirty: boolean;
  status: "idle" | "saving" | "error";
  error: string | null;
  onSave: () => void;
}

type UrlField = "linkedinUrl" | "githubUrl" | "portfolioUrl" | "websiteUrl";

const URL_FIELDS: { key: UrlField; label: string; placeholder: string }[] = [
  { key: "linkedinUrl", label: "LinkedIn URL", placeholder: "https://linkedin.com/in/..." },
  { key: "githubUrl", label: "GitHub URL", placeholder: "https://github.com/..." },
  { key: "portfolioUrl", label: "Portfolio URL", placeholder: "https://..." },
  { key: "websiteUrl", label: "Personal website", placeholder: "https://..." },
];

// Contact information is hidden by default — contactVisible/resumeVisible
// each independently gate whether contactEmail/resumeUrl are ever
// returned by candidate_profiles_public at all (nulled out in the view's
// own SQL, not just hidden client-side — see
// supabase/candidate_settings.sql). Recruiters can only ever see the
// public email when contact visibility is on.
export default function PublicLinksSection({
  userId,
  draft,
  onChange,
  isDirty,
  status,
  error,
  onSave,
}: PublicLinksSectionProps) {
  const [urlErrors, setUrlErrors] = useState<Partial<Record<UrlField, string>>>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Partial<Record<UrlField, string>> = {};
    for (const field of URL_FIELDS) {
      if (!isValidUrl(draft[field.key])) {
        nextErrors[field.key] = "Enter a valid URL (starting with http:// or https://).";
      }
    }
    setUrlErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-accent-dark uppercase">
          Public Links and Contact
        </p>
        {isDirty && (
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-accent-dark">
            Unsaved changes
          </span>
        )}
      </div>

      <div className="rounded-xl border border-border p-4">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={draft.opportunities.contactVisible}
            onChange={(e) =>
              onChange({
                opportunities: { ...draft.opportunities, contactVisible: e.target.checked },
              })
            }
            className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
          />
          Show my public email to recruiters
        </label>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
          Off by default. Recruiters only ever see this email when it&apos;s on.
        </p>
        {draft.opportunities.contactVisible && (
          <input
            type="email"
            className={`mt-3 ${inputClasses}`}
            placeholder="you@example.com"
            value={draft.opportunities.contactEmail}
            onChange={(e) =>
              onChange({ opportunities: { ...draft.opportunities, contactEmail: e.target.value } })
            }
          />
        )}
      </div>

      <div className="rounded-xl border border-border p-4">
        <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">Resume</p>
        <div className="mt-3">
          <ResumeUploadField
            userId={userId}
            value={draft.resumeUrl}
            onChange={(url) => onChange({ resumeUrl: url })}
          />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={draft.resumeVisible}
            onChange={(e) => onChange({ resumeVisible: e.target.checked })}
            className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
          />
          Show my resume to recruiters
        </label>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
          Off by default, independent of the email toggle above.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {URL_FIELDS.map((field) => (
          <label key={field.key} className="block">
            <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
              {field.label}
            </span>
            <input
              type="url"
              className={`mt-1.5 ${inputClasses}`}
              placeholder={field.placeholder}
              value={draft[field.key]}
              onChange={(e) => onChange({ [field.key]: e.target.value })}
            />
            {urlErrors[field.key] && (
              <p className="mt-1 text-xs text-red-600">{urlErrors[field.key]}</p>
            )}
          </label>
        ))}
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
