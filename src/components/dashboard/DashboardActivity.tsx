import { demoActivityGroups } from "../../data/mockData";

export default function DashboardActivity() {
  const recent = demoActivityGroups[0];

  return (
    <div>
      <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
        Activity
      </h2>
      <div className="mt-4 rounded-2xl border border-border bg-canvas-elevated p-4">
        <ul className="space-y-4">
          {recent.entries.map((entry) => (
            <li key={entry.title} className="flex gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas text-ink-soft ring-1 ring-border">
                <entry.icon className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-sm leading-snug text-ink">{entry.title}</p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {entry.timestamp}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
