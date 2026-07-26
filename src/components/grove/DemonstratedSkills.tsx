import { Sparkles } from "lucide-react";
import type { SkillSummary } from "../../types/grove";

interface DemonstratedSkillsProps {
  skills: SkillSummary[];
}

export default function DemonstratedSkills({ skills }: DemonstratedSkillsProps) {
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
        Demonstrated Skills
      </h2>

      {skills.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Sparkles className="h-6 w-6" strokeWidth={2} />
          </span>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-faint">
            Your demonstrated skills will appear as you build and publish
            evidence.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {skills.map((skill) => (
            <div
              key={skill.skill}
              className="rounded-2xl border border-border bg-canvas-elevated p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">
                  {skill.skill}
                </p>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-dark">
                  {skill.achievementCount}{" "}
                  {skill.achievementCount === 1 ? "achievement" : "achievements"}
                </span>
              </div>
              <p className="mt-2.5 text-xs font-medium tracking-wide text-ink-faint uppercase">
                Supported by
              </p>
              <ul className="mt-1.5 space-y-1">
                {skill.supportingAchievements.slice(0, 3).map((item, index) => (
                  <li
                    key={`${skill.skill}-${index}`}
                    className="text-sm leading-snug text-ink-soft"
                  >
                    {item.title}{" "}
                    <span className="text-ink-faint">— {item.seedTitle}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
