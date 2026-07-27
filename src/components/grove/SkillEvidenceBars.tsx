import type { SkillEvidenceTier } from "../../lib/groveSkills";

interface SkillEvidenceBarsProps {
  tier: SkillEvidenceTier;
  // Pills render this small and muted; SkillDrawer's header renders it
  // larger and in full accent color to match its more prominent context.
  size?: "sm" | "md";
}

// A signal-strength-style evidence indicator — replaces a bare
// achievement-count number with something that reads as "strength" at a
// glance, consistent everywhere a skill's tier is shown (skill pills,
// SkillDrawer). The exact counts are never hidden, just not the primary
// glanceable signal — they're still in the hover tooltip and the
// drawer's "Verified by" line.
export default function SkillEvidenceBars({ tier, size = "sm" }: SkillEvidenceBarsProps) {
  const heights = size === "sm" ? ["h-1.5", "h-2.5", "h-3.5"] : ["h-2.5", "h-4", "h-5.5"];
  const width = size === "sm" ? "w-1" : "w-1.5";

  return (
    <span
      aria-hidden="true"
      className="inline-flex items-end gap-0.5"
      title={`Evidence tier ${tier} of 3`}
    >
      {[1, 2, 3].map((bar) => (
        <span
          key={bar}
          className={`${width} ${heights[bar - 1]} rounded-full transition-colors ${
            bar <= tier ? "bg-current" : "bg-current/20"
          }`}
        />
      ))}
    </span>
  );
}
