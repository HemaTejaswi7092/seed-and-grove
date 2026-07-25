import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import type { ActivityGroup } from "../../types/mockData";

interface ActivityTimelineProps {
  activityGroups: ActivityGroup[];
}

export default function ActivityTimeline({
  activityGroups,
}: ActivityTimelineProps) {
  if (activityGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Activity className="h-5 w-5" strokeWidth={2} />
        </span>
        <p className="text-sm leading-relaxed text-ink-soft">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-8 py-10">
      {activityGroups.map((group) => (
        <div key={group.day}>
          <h3 className="mb-4 text-xs font-semibold tracking-wide text-ink-faint uppercase">
            {group.day}
          </h3>
          <ul className="space-y-1">
            {group.entries.map((entry, index) => (
              <motion.li
                key={entry.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: 0.35,
                  ease: "easeOut",
                  delay: index * 0.05,
                }}
                className="flex gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-canvas-elevated"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas-elevated text-ink-soft ring-1 ring-border">
                  <entry.icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm leading-snug text-ink">
                    {entry.title}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {entry.timestamp}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
