import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import type { SkillLevel } from "../../types/mockData";

interface SkillGrowthProps {
  skillLevels: SkillLevel[];
}

export default function SkillGrowth({ skillLevels }: SkillGrowthProps) {
  return (
    <div className="rounded-2xl border border-border bg-canvas-elevated p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <TrendingUp className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">Skills in Motion</p>
          <p className="text-xs text-ink-faint">
            Mastery inferred from your evidence
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {skillLevels.map((skill, index) => (
          <div key={skill.skill}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-ink">{skill.skill}</span>
              <span className="text-ink-faint">{skill.mastery}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${skill.mastery}%` }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.7,
                  ease: "easeOut",
                  delay: index * 0.1,
                }}
                className="h-full rounded-full bg-accent"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
