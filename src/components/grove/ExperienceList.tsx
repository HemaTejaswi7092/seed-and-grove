import type { ExperienceEntry } from "../../types/grove";

interface ExperienceListProps {
  entries: ExperienceEntry[];
}

// Pure read-only rendering of an Experience list — shared by candidate
// Grove (ProfessionalDetails.tsx) and Recruiter Grove
// (RecruiterGroveView.tsx) so both career timelines look and behave
// identically. No card wrapper of its own: callers each own their
// section chrome (heading, "Edit" link, empty state) since those differ.
export default function ExperienceList({ entries }: ExperienceListProps) {
  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div key={entry.id}>
          <p className="text-sm font-semibold text-ink">
            {entry.title}
            {entry.company && <span className="text-ink-soft"> · {entry.company}</span>}
          </p>
          <p className="mt-0.5 text-xs text-ink-faint">
            {[
              entry.location,
              `${entry.startDate || "—"} – ${entry.currentlyWorking ? "Present" : entry.endDate || "—"}`,
            ]
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
