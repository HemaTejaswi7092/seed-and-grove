import { ShieldCheck } from "lucide-react";
import { demoEvidenceFeed } from "../../data/mockData";

export default function DashboardEvidence() {
  const items = demoEvidenceFeed.slice(0, 3);

  return (
    <div>
      <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
        Recent Evidence
      </h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-border bg-canvas-elevated p-4"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-dark">
                {item.skill}
              </span>
              <ShieldCheck className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
            </div>
            <p className="mt-2 text-sm leading-snug text-ink">
              {item.summary}
            </p>
            <p className="mt-1.5 text-xs text-ink-faint">{item.timestamp}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
