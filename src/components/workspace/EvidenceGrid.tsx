import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, Globe, Lock } from "lucide-react";
import type { EvidenceItem } from "../../types/mockData";
import type { SeedEvidenceItem } from "../../types/seed";

interface EvidenceGridProps {
  evidence: EvidenceItem[];
  // Both omitted for the demo Seed — its evidence lives in curated mock
  // data, not the real store, so there's nothing for a toggle to persist.
  visibilityById?: Record<string, SeedEvidenceItem["visibility"]>;
  onToggleVisibility?: (evidenceId: string) => void;
}

export default function EvidenceGrid({
  evidence,
  visibilityById,
  onToggleVisibility,
}: EvidenceGridProps) {
  const skills = useMemo(
    () => Array.from(new Set(evidence.map((item) => item.skill))),
    [evidence],
  );
  const [activeSkill, setActiveSkill] = useState<string | null>(null);

  const visible = activeSkill
    ? evidence.filter((item) => item.skill === activeSkill)
    : evidence;

  if (evidence.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Sparkles className="h-5 w-5" strokeWidth={2} />
        </span>
        <p className="text-sm leading-relaxed text-ink-soft">
          No evidence yet.
        </p>
      </div>
    );
  }

  return (
    <div className="px-8 py-10">
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveSkill(null)}
          className={[
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            activeSkill === null
              ? "border-accent bg-accent text-white"
              : "border-border text-ink-soft hover:border-ink-faint",
          ].join(" ")}
        >
          All
        </button>
        {skills.map((skill) => (
          <button
            key={skill}
            type="button"
            onClick={() => setActiveSkill(skill)}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              activeSkill === skill
                ? "border-accent bg-accent text-white"
                : "border-border text-ink-soft hover:border-ink-faint",
            ].join(" ")}
          >
            {skill}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visible.map((item, index) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.04 }}
            className="rounded-2xl border border-border bg-canvas-elevated p-5"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-dark">
                {item.skill}
              </span>
              <ShieldCheck className="h-4 w-4 text-accent" strokeWidth={2} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              {item.summary}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-ink-faint">{item.timestamp}</p>
              {onToggleVisibility && (
                <button
                  type="button"
                  onClick={() => onToggleVisibility(item.id)}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    visibilityById?.[item.id] === "public"
                      ? "border-accent-soft-border bg-accent-soft text-accent-dark"
                      : "border-border text-ink-faint hover:border-ink-faint hover:text-ink-soft",
                  ].join(" ")}
                >
                  {visibilityById?.[item.id] === "public" ? (
                    <>
                      <Globe className="h-3 w-3" strokeWidth={2} />
                      Public
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" strokeWidth={2} />
                      Private
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
