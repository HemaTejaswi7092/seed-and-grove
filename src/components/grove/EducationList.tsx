import type { EducationEntry } from "../../types/grove";

interface EducationListProps {
  entries: EducationEntry[];
}

// Pure read-only rendering of an Education list — shared by candidate
// Grove (ProfessionalDetails.tsx) and Recruiter Grove
// (RecruiterGroveView.tsx). See ExperienceList.tsx's header comment.
export default function EducationList({ entries }: EducationListProps) {
  return (
    <div className="space-y-4">
      {entries.map((entry) => (
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
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{entry.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
