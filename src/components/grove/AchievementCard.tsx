import { ShieldCheck, Link2 } from "lucide-react";
import type { AchievementHighlight } from "../../types/grove";

interface AchievementCardProps {
  achievement: AchievementHighlight;
  // Set when this achievement demonstrates the skill currently selected
  // in VerifiedSkills (threaded through ProjectDetailModal) — highlights
  // the same way its parent project card does, so the evidence trail is
  // visible at every level, not just the project level.
  isHighlighted?: boolean;
}

// One published achievement's full detail — rendered only inside its
// parent project's ProjectDetailModal (see FeaturedSeeds.tsx), never on
// the top-level Grove page directly. No seedTitle line here (unlike the
// old standalone AchievementHighlights list this replaced): the
// achievement is already shown in its project's own context, so
// repeating the project name on every card would be redundant.
export default function AchievementCard({
  achievement: item,
  isHighlighted = false,
}: AchievementCardProps) {
  return (
    <div
      className={[
        "rounded-2xl border p-5 transition-shadow duration-300",
        isHighlighted
          ? "border-accent bg-canvas-elevated shadow-[0_8px_24px_-10px_rgba(63,109,82,0.45)]"
          : "border-border bg-canvas",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base font-semibold text-ink">{item.title}</p>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-faint">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
          Published
        </span>
      </div>

      {item.shortDescription && (
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.shortDescription}</p>
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
  );
}
