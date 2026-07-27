import { motion } from "framer-motion";
import { Award, Layers, Link2, ShieldCheck, X } from "lucide-react";
import SkillEvidenceBars from "./SkillEvidenceBars";
import type { SkillWithTier } from "../../lib/groveSkills";

interface SkillDrawerProps {
  skill: SkillWithTier;
  onClose: () => void;
}

// Opened by clicking a pill in Verified Skills (see VerifiedSkills.tsx) —
// full evidence trail for one skill: which projects it came from, every
// supporting achievement grouped under its project, the technologies
// involved, and proof links where the candidate provided one. Confidence
// is always "verified by N projects" — project breadth, not a raw
// achievement tally or a self-rated proficiency number — the whole point
// of Grove is that nothing here is asserted, only demonstrated. The
// achievement-level detail is still all here, just grouped under each
// project rather than counted at the top.
export default function SkillDrawer({ skill, onClose }: SkillDrawerProps) {
  const groups: { seedId: string; seedTitle: string; achievements: typeof skill.supportingAchievements }[] = [];
  for (const achievement of skill.supportingAchievements) {
    const group = groups.find((item) => item.seedId === achievement.seedId);
    if (group) {
      group.achievements.push(achievement);
    } else {
      groups.push({
        seedId: achievement.seedId,
        seedTitle: achievement.seedTitle,
        achievements: [achievement],
      });
    }
  }

  return (
    // Deliberately NOT a blocking modal — no full-page backdrop or
    // click-catcher. The entire point of "select a skill and see its
    // evidence highlighted" is that the rest of the page (Projects, other
    // skill pills) stays clickable while this is open: a recruiter can
    // open this, then click straight through to the now-highlighted
    // project card's "View Project" to see the matching achievement
    // highlighted there too. Closed only via the X button or by
    // selecting the same skill again (see VerifiedSkills.tsx).
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      className="fixed inset-y-0 right-0 z-40 flex h-full w-full max-w-md flex-col bg-canvas-elevated shadow-[-24px_0_64px_-24px_rgba(26,28,25,0.4)]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-8 py-6">
        <h2 className="text-xl font-semibold tracking-tight text-ink">{skill.skill}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="flex items-center gap-3 rounded-2xl border border-accent-soft-border bg-gradient-to-br from-accent-soft to-canvas-elevated p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
            <ShieldCheck className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="flex-1">
            <p className="text-[11px] font-semibold tracking-wide text-accent-dark uppercase">
              Verified by
            </p>
            <p className="text-sm font-semibold text-ink">
              {skill.projectCount} {skill.projectCount === 1 ? "Project" : "Projects"}
            </p>
          </div>
          <span className="text-accent">
            <SkillEvidenceBars tier={skill.tier} size="md" />
          </span>
        </div>

        {skill.technologies.length > 0 && (
          <div className="mt-6">
            <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
              Technologies
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skill.technologies.map((tech) => (
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

        <div className="mt-6">
          <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
            Related projects
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {groups.map((group) => (
              <span
                key={group.seedId}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent-dark"
              >
                <Layers className="h-3 w-3" strokeWidth={2} />
                {group.seedTitle}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
            Supporting achievements
          </p>
          <div className="mt-3 space-y-6">
            {groups.map((group) => (
              <div key={group.seedId}>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <Layers className="h-3.5 w-3.5 text-ink-faint" strokeWidth={2} />
                  {group.seedTitle}
                </p>
                <div className="mt-2.5 space-y-2.5">
                  {group.achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="rounded-xl border border-border bg-canvas p-3.5"
                    >
                      <p className="flex items-start gap-1.5 text-sm font-medium text-ink">
                        <Award
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent"
                          strokeWidth={2}
                        />
                        {achievement.title}
                      </p>
                      {achievement.shortDescription && (
                        <p className="mt-1 pl-5 text-xs leading-relaxed text-ink-soft">
                          {achievement.shortDescription}
                        </p>
                      )}
                      {achievement.proofUrl && (
                        <a
                          href={achievement.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 pl-5 text-xs font-medium text-accent-dark hover:text-accent"
                        >
                          <Link2 className="h-3 w-3" strokeWidth={2} />
                          {achievement.proofLabel || "View proof"}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
