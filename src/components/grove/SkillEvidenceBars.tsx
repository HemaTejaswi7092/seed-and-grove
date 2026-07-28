interface SkillEvidenceBarsProps {
  // How many of `maxBars` are filled — always computed relative to the
  // candidate's own strongest skill (see lib/groveSkills.ts's
  // withEvidenceStrength), never a fixed/static value. Two skills with
  // different project counts must render visibly different bar counts.
  barCount: number;
  maxBars?: number;
  // Pills render this small and muted; SkillDrawer's header renders it
  // larger and in full accent color to match its more prominent context.
  size?: "sm" | "md";
}

// A signal-strength-style evidence indicator — reads as "relative depth
// of experience" at a glance instead of a bare project-count number.
// Exact counts are still available in the SkillDrawer detail view; this
// is just the glanceable signal.
export default function SkillEvidenceBars({
  barCount,
  maxBars = 5,
  size = "sm",
}: SkillEvidenceBarsProps) {
  const heights =
    size === "sm"
      ? ["h-1", "h-1.5", "h-2", "h-2.5", "h-3"]
      : ["h-1.5", "h-2.5", "h-3.5", "h-4.5", "h-5.5"];
  const width = size === "sm" ? "w-[3px]" : "w-1";

  return (
    <span
      aria-hidden="true"
      className="inline-flex items-end gap-[2px]"
      title={`${barCount} of ${maxBars}`}
    >
      {Array.from({ length: maxBars }, (_, i) => i + 1).map((bar) => (
        <span
          key={bar}
          className={`${width} ${heights[Math.min(bar, heights.length) - 1]} rounded-full transition-colors ${
            bar <= barCount ? "bg-current" : "bg-current/20"
          }`}
        />
      ))}
    </span>
  );
}
