import { Award } from "lucide-react";
import type { CertificationEntry } from "../../types/grove";

interface CertificationListProps {
  entries: CertificationEntry[];
}

// Pure read-only rendering of a Certification list — shared by candidate
// Grove (ProfessionalDetails.tsx) and Recruiter Grove
// (RecruiterGroveView.tsx). See ExperienceList.tsx's header comment.
export default function CertificationList({ entries }: CertificationListProps) {
  return (
    <div className="space-y-3">
      {entries.map((entry) => (
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
  );
}
