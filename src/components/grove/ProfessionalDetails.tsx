import { GraduationCap, Award, Users } from "lucide-react";
import type { GroveProfileFields } from "../../types/grove";

type DetailFields = Pick<
  GroveProfileFields,
  | "education"
  | "experience"
  | "certifications"
  | "professionalSkills"
  | "workAuthorization"
  | "requiresSponsorship"
> & {
  rolesOfInterest: string;
  collaborationInterests: string;
};

interface ProfessionalDetailsProps {
  fields: DetailFields;
  isOwner: boolean;
  // Experience/education/certifications/professional skills are edited in
  // Settings; roles of interest/collaboration interests are edited in the
  // Edit Grove modal (Opportunities section) — two different edit
  // surfaces for historical reasons, so this section exposes two
  // separate, precisely-labeled edit affordances rather than one that
  // would only work for part of what's shown.
  onEditInSettings: () => void;
  onEditPreferences: () => void;
}

// Shown on both the candidate's own Grove (read-only here) and the
// recruiter's read-only candidate profile — pure presentation, identical
// either way, just isOwner=false there.
//
// professionalSkills is the candidate's own manually-curated list (see
// CandidateSettings.tsx) — shown here for recruiter readability only, and
// entirely separate from DemonstratedSkills (achievement-derived,
// rendered in the Projects & Skills section). Neither this component nor
// its data feeds the semantic matching engine.
export default function ProfessionalDetails({
  fields,
  isOwner,
  onEditInSettings,
  onEditPreferences,
}: ProfessionalDetailsProps) {
  const hasAnything =
    fields.experience.length > 0 ||
    fields.education.length > 0 ||
    fields.certifications.length > 0 ||
    fields.professionalSkills.length > 0 ||
    fields.workAuthorization.trim() ||
    fields.rolesOfInterest.trim() ||
    fields.collaborationInterests.trim();

  if (!hasAnything) {
    if (!isOwner) return null;
    return (
      <section>
        <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
          Background
        </h2>
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <GraduationCap className="h-6 w-6" strokeWidth={2} />
          </span>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-faint">
            Add your education, experience, and certifications so
            recruiters can learn more.
          </p>
          <button
            type="button"
            onClick={onEditInSettings}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
          >
            Add details in Settings
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
          Background
        </h2>
        {isOwner && (
          <button
            type="button"
            onClick={onEditInSettings}
            className="text-xs font-medium text-accent-dark transition-colors hover:text-accent"
          >
            Edit in Settings
          </button>
        )}
      </div>

      {fields.experience.length > 0 && (
        <div className="mt-4 rounded-2xl border border-border bg-canvas-elevated p-6">
          <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
            Experience
          </p>
          <div className="mt-3 space-y-4">
            {fields.experience.map((entry) => (
              <div key={entry.id}>
                <p className="text-sm font-semibold text-ink">
                  {entry.title}
                  {entry.company && <span className="text-ink-soft"> · {entry.company}</span>}
                </p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {[entry.location, `${entry.startDate || "—"} – ${entry.currentlyWorking ? "Present" : entry.endDate || "—"}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {entry.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {entry.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {fields.education.length > 0 && (
        <div className="mt-4 rounded-2xl border border-border bg-canvas-elevated p-6">
          <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
            Education
          </p>
          <div className="mt-3 space-y-4">
            {fields.education.map((entry) => (
              <div key={entry.id}>
                <p className="text-sm font-semibold text-ink">
                  {[entry.degree, entry.fieldOfStudy].filter(Boolean).join(", ")}
                </p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {[entry.institution, `${entry.startYear || "—"}–${entry.endYear || "—"}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {entry.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {entry.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {fields.certifications.length > 0 && (
        <div className="mt-4 rounded-2xl border border-border bg-canvas-elevated p-6">
          <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
            Certifications
          </p>
          <div className="mt-3 space-y-3">
            {fields.certifications.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2.5">
                <Award className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
                <div>
                  <p className="text-sm font-semibold text-ink">{entry.name}</p>
                  <p className="text-xs text-ink-faint">
                    {[entry.issuingOrganization, entry.issueDate].filter(Boolean).join(" · ")}
                  </p>
                  {entry.credentialUrl && (
                    <a
                      href={entry.credentialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-accent-dark transition-colors hover:text-accent"
                    >
                      View credential
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {fields.professionalSkills.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
            Professional Skills
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {fields.professionalSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-ink-soft"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {fields.workAuthorization.trim() && (
        <div className="mt-4">
          <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
            Work Authorization
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">
            {fields.workAuthorization}
            {fields.requiresSponsorship && (
              <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-dark">
                Requires sponsorship
              </span>
            )}
          </p>
        </div>
      )}

      {(fields.rolesOfInterest.trim() || fields.collaborationInterests.trim()) && (
        <div className="mt-4 rounded-2xl border border-border bg-canvas-elevated p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
              Preferences
            </p>
            {isOwner && (
              <button
                type="button"
                onClick={onEditPreferences}
                className="text-xs font-medium text-accent-dark transition-colors hover:text-accent"
              >
                Edit
              </button>
            )}
          </div>
          {fields.rolesOfInterest.trim() && (
            <div className="mt-3">
              <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Roles of interest
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">
                {fields.rolesOfInterest}
              </p>
            </div>
          )}
          {fields.collaborationInterests.trim() && (
            <div className="mt-3">
              <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3 w-3" strokeWidth={2} />
                  Collaboration interests
                </span>
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">
                {fields.collaborationInterests}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
