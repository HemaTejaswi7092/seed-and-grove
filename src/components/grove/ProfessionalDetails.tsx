import { GraduationCap, FileText, Link2, Code2, Globe } from "lucide-react";
import type { GroveProfileFields } from "../../types/grove";

type DetailFields = Pick<
  GroveProfileFields,
  | "education"
  | "experience"
  | "workAuthorization"
  | "resumeUrl"
  | "linkedinUrl"
  | "githubUrl"
  | "portfolioUrl"
>;

interface ProfessionalDetailsProps {
  fields: DetailFields;
  isOwner: boolean;
  onEdit: () => void;
}

// Shown on both the candidate's own Grove (editable) and the recruiter's
// read-only candidate profile (see pages/RecruiterCandidateProfile.tsx) —
// pure presentation, identical either way, just isOwner=false there.
export default function ProfessionalDetails({
  fields,
  isOwner,
  onEdit,
}: ProfessionalDetailsProps) {
  const details = [
    { label: "Education", value: fields.education },
    { label: "Experience", value: fields.experience },
    { label: "Work authorization", value: fields.workAuthorization },
  ].filter((row) => row.value.trim());

  const links = [
    { label: "Resume", href: fields.resumeUrl, icon: FileText },
    { label: "LinkedIn", href: fields.linkedinUrl, icon: Link2 },
    { label: "GitHub", href: fields.githubUrl, icon: Code2 },
    { label: "Portfolio", href: fields.portfolioUrl, icon: Globe },
  ].filter((link) => link.href.trim());

  if (details.length === 0 && links.length === 0) {
    if (!isOwner) return null;
    return (
      <section>
        <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
          Professional Details
        </h2>
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <GraduationCap className="h-6 w-6" strokeWidth={2} />
          </span>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-faint">
            Add your education, experience, work authorization, and links so
            recruiters can learn more.
          </p>
          <button
            type="button"
            onClick={onEdit}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
          >
            Add details
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
        Professional Details
      </h2>

      {details.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 rounded-2xl border border-border bg-canvas-elevated p-6 sm:grid-cols-2">
          {details.map((row) => (
            <div key={row.label}>
              <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                {row.label}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">{row.value}</p>
            </div>
          ))}
        </div>
      )}

      {links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            >
              <link.icon className="h-3.5 w-3.5" strokeWidth={2} />
              {link.label}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
