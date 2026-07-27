import type { TimelineEvent } from "../types/seed";

export interface TimelineDayGroup {
  day: string;
  events: TimelineEvent[];
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayLabel(iso: string, now: Date): string {
  const date = new Date(iso);
  const diffDays = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000,
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

// Newest day first, newest event first within a day — the Timeline tab's
// whole grouping story (see components/workspace/Timeline.tsx). Events
// must already share a single Seed; this never filters by seedId itself.
export function groupTimelineEventsByDay(events: TimelineEvent[]): TimelineDayGroup[] {
  const now = new Date();
  const sorted = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const groups: TimelineDayGroup[] = [];
  for (const event of sorted) {
    const label = dayLabel(event.createdAt, now);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.day === label) {
      lastGroup.events.push(event);
    } else {
      groups.push({ day: label, events: [event] });
    }
  }
  return groups;
}
