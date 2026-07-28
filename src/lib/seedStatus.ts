import type { LifecycleStatus } from "../types/seed";

// types/seed.ts deliberately keeps `status` (a free-text stage label like
// "Currently Building") and `lifecycleStatus` (in_progress/completed/
// archived) as independent fields — a Seed can be Stage=Building/
// Lifecycle=completed. That's fine as stored data, but rendering both as
// separate badges at once reads as contradictory ("Completed" next to
// "Currently Building"). For display, `lifecycleStatus` is the single
// source of truth: the free-text status label is only shown while a
// project is still in progress; once it's completed or archived, that
// terminal state is the only status badge shown.
export function shouldShowStatusLabel(lifecycleStatus: LifecycleStatus): boolean {
  return lifecycleStatus === "in_progress";
}
