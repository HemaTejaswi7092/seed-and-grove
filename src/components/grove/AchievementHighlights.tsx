import { ShieldCheck, Link2 } from "lucide-react";
import type { AchievementHighlight } from "../../types/grove";

interface AchievementHighlightsProps {
  achievements: AchievementHighlight[];
}

// Grove's structured, candidate-approved record — the same shape a future
// recruiter-discovery feature will query (see supabase/grove_achievements.sql).
// Rendered as cards, never a raw field-by-field table.
export default function AchievementHighlights({ achievements }: AchievementHighlightsProps) {
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
        Evidence &amp; Achievements
      </h2>

      {achievements.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <ShieldCheck className="h-6 w-6" strokeWidth={2} />
          </span>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-faint">
            Published achievements from your Seeds will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {achievements.map((item) => (
            <div
              key={item.id}
              id={`achievement-${item.id}`}
              className="scroll-mt-24 rounded-2xl border border-border bg-canvas-elevated p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-ink-faint">{item.seedTitle}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-faint">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
                  Published
                </span>
              </div>

              <p className="mt-2 text-base font-semibold text-ink">{item.title}</p>
              {item.shortDescription && (
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {item.shortDescription}
                </p>
              )}

              {item.skillsDemonstrated.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] font-medium tracking-wide text-ink-faint uppercase">
                    Skills demonstrated
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {item.skillsDemonstrated.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent-dark"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {item.technologiesUsed.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] font-medium tracking-wide text-ink-faint uppercase">
                    Technologies used
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {item.technologiesUsed.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-ink-soft"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {item.candidateContribution && (
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  <span className="font-medium text-ink">Contribution: </span>
                  {item.candidateContribution}
                </p>
              )}

              {item.outcomeOrImpact && (
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  <span className="font-medium text-ink">Outcome: </span>
                  {item.outcomeOrImpact}
                </p>
              )}

              {item.relevantRoles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.relevantRoles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-dashed border-ink-faint/40 px-2.5 py-1 text-[11px] font-medium text-ink-faint"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              )}

              {item.proofUrl && (
                <a
                  href={item.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent-dark hover:text-accent"
                >
                  <Link2 className="h-3 w-3" strokeWidth={2} />
                  {item.proofLabel || "View proof"}
                </a>
              )}

              <p className="mt-3 text-xs text-ink-faint">{item.date}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
