import { Briefcase } from "lucide-react";
import { opportunities } from "../../data/mockData";

export default function DashboardOpportunities() {
  return (
    <div className="mt-10">
      <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
        Recommended Opportunities
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {opportunities.map((opportunity) => (
          <div
            key={opportunity.id}
            className="rounded-2xl border border-border bg-canvas-elevated p-5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Briefcase className="h-4 w-4" strokeWidth={2} />
            </span>
            <p className="mt-3 text-sm font-semibold text-ink">
              {opportunity.role}
            </p>
            <p className="text-xs text-ink-faint">
              {opportunity.company} · {opportunity.location}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {opportunity.matchReason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
