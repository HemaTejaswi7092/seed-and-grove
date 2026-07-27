import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { groupTimelineEventsByDay } from "../../lib/timelineGrouping";
import { timeAgo } from "../../lib/dates";
import type { TimelineEvent, TimelineEventType } from "../../types/seed";

interface TimelineProps {
  events: TimelineEvent[];
}

// The generic label per event type — the detail (an achievement's title,
// for the achievement/milestone events) is appended separately, never
// baked into this map. See types/seed.ts's TimelineEvent for the full
// list this must stay in sync with.
const EVENT_META: Record<TimelineEventType, { emoji: string; label: string }> = {
  project_created: { emoji: "🌱", label: "Project created" },
  details_updated: { emoji: "✏️", label: "Project details updated" },
  ai_plan_generated: { emoji: "🤖", label: "AI generated initial project plan" },
  repo_linked: { emoji: "🔗", label: "GitHub repository linked" },
  demo_linked: { emoji: "🌐", label: "Demo link added" },
  milestone_completed: { emoji: "📝", label: "Milestone completed" },
  achievement_created: { emoji: "🏆", label: "Achievement created" },
  achievement_published: { emoji: "🌳", label: "Achievement published to Grove" },
  project_published: { emoji: "🚀", label: "Project published to Grove" },
  project_completed: { emoji: "✅", label: "Project completed" },
  project_reopened: { emoji: "🔄", label: "Project reopened" },
};

// The story of how this project evolved from an idea to (maybe) a
// completed, published body of evidence — every entry here was logged
// automatically at the moment a meaningful project event actually
// happened (see state/seedStore.ts, state/achievements.ts,
// CopilotChat.tsx). Never a chat log and never manually added: there is
// deliberately no "add timeline entry" affordance anywhere in this app.
export default function Timeline({ events }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <BookOpen className="h-5 w-5" strokeWidth={2} />
        </span>
        <p className="text-sm leading-relaxed text-ink-soft">
          This project's story starts here — meaningful milestones will
          appear as you build.
        </p>
      </div>
    );
  }

  const groups = groupTimelineEventsByDay(events);

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-8 py-10">
      {groups.map((group) => (
        <div key={group.day}>
          <h3 className="mb-4 text-xs font-semibold tracking-wide text-ink-faint uppercase">
            {group.day}
          </h3>
          <ul className="space-y-1">
            {group.events.map((event, index) => {
              const meta = EVENT_META[event.type];
              return (
                <motion.li
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    ease: "easeOut",
                    delay: Math.min(index * 0.05, 0.3),
                  }}
                  className="flex gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-canvas-elevated"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas-elevated text-base ring-1 ring-border">
                    {meta.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm leading-snug text-ink">
                      {meta.label}
                      {event.detail && (
                        <span className="text-ink-soft"> — {event.detail}</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {timeAgo(event.createdAt)}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
