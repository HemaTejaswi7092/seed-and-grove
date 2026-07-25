import { Check } from "lucide-react";
import type { GroveStrength } from "../../types/grove";

interface GroveStrengthMeterProps {
  strength: GroveStrength;
}

export default function GroveStrengthMeter({
  strength,
}: GroveStrengthMeterProps) {
  const remaining = strength.items.filter((item) => !item.done);
  const percent = Math.round((strength.completed / strength.total) * 100);

  return (
    <div className="rounded-2xl border border-border bg-canvas-elevated p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Grove Strength</p>
        <p className="text-sm font-medium text-ink-soft">
          {strength.completed} of {strength.total} completed
        </p>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-faint">
        Your Grove becomes stronger as you publish demonstrated work.
      </p>

      {remaining.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {strength.items.map((item) => (
            <li
              key={item.key}
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                item.done
                  ? "border-accent-soft-border bg-accent-soft text-accent-dark"
                  : "border-border text-ink-faint",
              ].join(" ")}
            >
              {item.done && <Check className="h-3 w-3" strokeWidth={2.5} />}
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
