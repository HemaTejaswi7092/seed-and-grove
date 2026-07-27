import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import SkillDrawer from "./SkillDrawer";
import SkillEvidenceBars from "./SkillEvidenceBars";
import { categorizeSkill, SKILL_CATEGORY_ORDER, tierSkills } from "../../lib/groveSkills";
import type { SkillWithTier } from "../../lib/groveSkills";
import type { SkillSummary } from "../../types/grove";

interface VerifiedSkillsProps {
  skills: SkillSummary[];
  // Lifted to GroveView so selecting a skill can highlight matching
  // evidence elsewhere on the page (Projects, and any open project's
  // achievements) — not just drive this section's own drawer.
  selectedSkill: string | null;
  onSelectSkill: (skill: string | null) => void;
}

// Grove's signature section: every skill here is derived from published,
// evidence-backed achievements — never a self-rated proficiency slider
// (see lib/groveSkills.ts). Core skills (the strongest evidence, relative
// to this candidate's own other skills) get a prominent hero row; the
// rest are grouped into scannable categories below, so a recruiter can
// take in a candidate's whole skill surface in seconds, then click into
// any one skill for its full project-by-project evidence trail.
export default function VerifiedSkills({
  skills,
  selectedSkill,
  onSelectSkill,
}: VerifiedSkillsProps) {
  const tiered = tierSkills(skills);
  const activeSkill = tiered.find((item) => item.skill === selectedSkill) ?? null;
  const core = tiered.filter((item) => item.tier === 3);
  const supporting = tiered.filter((item) => item.tier !== 3);

  const supportingByCategory = new Map<string, SkillWithTier[]>();
  for (const skill of supporting) {
    const category = categorizeSkill(skill.skill);
    const list = supportingByCategory.get(category);
    if (list) list.push(skill);
    else supportingByCategory.set(category, [skill]);
  }
  const categoryRows = SKILL_CATEGORY_ORDER.filter((category) =>
    supportingByCategory.has(category),
  );

  function handleSelect(skill: string) {
    onSelectSkill(selectedSkill === skill ? null : skill);
  }

  let pillIndex = 0;

  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
        Verified Skills
      </h2>

      {skills.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Sparkles className="h-6 w-6" strokeWidth={2} />
          </span>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-faint">
            Your verified skills will appear as you build and publish
            evidence.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          {core.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              {core.map((skill) => (
                <SkillPill
                  key={skill.skill}
                  skill={skill}
                  variant="core"
                  index={pillIndex++}
                  isActive={selectedSkill === skill.skill}
                  onSelect={() => handleSelect(skill.skill)}
                />
              ))}
            </div>
          )}

          {categoryRows.map((category) => (
            <div key={category}>
              <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
                {category}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {supportingByCategory.get(category)!.map((skill) => (
                  <SkillPill
                    key={skill.skill}
                    skill={skill}
                    variant="supporting"
                    index={pillIndex++}
                    isActive={selectedSkill === skill.skill}
                    onSelect={() => handleSelect(skill.skill)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSkill && (
        <SkillDrawer skill={activeSkill} onClose={() => onSelectSkill(null)} />
      )}
    </section>
  );
}

function SkillPill({
  skill,
  variant,
  index,
  isActive,
  onSelect,
}: {
  skill: SkillWithTier;
  variant: "core" | "supporting";
  index: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const isCore = variant === "core";
  const summary =
    skill.supportingAchievements[0]?.shortDescription ||
    skill.supportingAchievements[0]?.title ||
    "";

  return (
    <div className="group relative">
      <motion.button
        type="button"
        onClick={onSelect}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: Math.min(index * 0.03, 0.3) }}
        whileHover={{ scale: isCore ? 1.05 : 1.06 }}
        whileTap={{ scale: 0.96 }}
        className={[
          "relative inline-flex items-center font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          isCore ? "gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold" : "gap-1.5 rounded-full px-3 py-1.5 text-xs",
          isActive
            ? "border border-accent bg-accent text-white shadow-[0_0_24px_-4px_rgba(63,109,82,0.55)]"
            : isCore
              ? "border border-accent-soft-border bg-gradient-to-br from-accent-soft via-canvas-elevated to-accent-soft text-ink shadow-sm hover:shadow-[0_0_20px_-4px_rgba(63,109,82,0.4)]"
              : "border border-border bg-canvas-elevated text-ink-soft hover:border-accent-soft-border hover:bg-accent-soft/50 hover:text-ink",
        ].join(" ")}
      >
        {isCore && (
          <Sparkles
            className={isActive ? "h-3.5 w-3.5 text-white" : "h-3.5 w-3.5 text-accent"}
            strokeWidth={2}
          />
        )}
        {skill.skill}
        <span className={isActive ? "text-white" : isCore ? "text-accent" : "text-ink-faint"}>
          <SkillEvidenceBars tier={skill.tier} size={isCore ? "md" : "sm"} />
        </span>
      </motion.button>

      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 translate-y-1 rounded-xl bg-ink px-3.5 py-3 text-white opacity-0 shadow-xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
      >
        <p className="text-xs font-semibold">
          {skill.projectCount} {skill.projectCount === 1 ? "Project" : "Projects"}
        </p>
        {summary && (
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/70">{summary}</p>
        )}
        <div className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-ink" />
      </div>
    </div>
  );
}
