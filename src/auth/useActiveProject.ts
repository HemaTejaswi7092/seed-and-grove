import { useAuth } from "./useAuth";
import { isDemoAccount } from "../config/demoAccount";
import { listSeeds } from "../state/seedStore";
import { daysSince } from "../lib/dates";
import { DEMO_SEED, demoProjectStats } from "../data/mockData";
import type { ProjectStat } from "../types/mockData";
import type { Seed } from "../types/seed";

interface ActiveProjectResult {
  activeSeed: Seed | null;
  seeds: Seed[];
  stats: ProjectStat[];
  hasProject: boolean;
}

// Only the seeded demo account (see config/demoAccount.ts) sees the VISIQ
// demo Seed. Every other authenticated user sees the Seeds they've
// actually planted (see state/seedStore.ts), scoped to their own userId —
// or nothing at all if they haven't planted one yet. Never VISIQ, never
// another user's Seed, as a fallback.
export function useActiveProject(): ActiveProjectResult {
  const { user } = useAuth();

  if (user && isDemoAccount(user.email)) {
    return {
      activeSeed: DEMO_SEED,
      seeds: [DEMO_SEED],
      stats: demoProjectStats,
      hasProject: true,
    };
  }

  const seeds = user ? listSeeds(user.id) : [];
  if (seeds.length === 0) {
    return { activeSeed: null, seeds: [], stats: [], hasProject: false };
  }

  // "Continue Growing" features whichever Seed was touched most recently —
  // a summary convenience for the Dashboard, not a security-relevant
  // default (the Workspace page always resolves strictly via route id).
  const activeSeed = [...seeds].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )[0];

  const stats: ProjectStat[] = [
    {
      label: "Days building",
      value: String(daysSince(activeSeed.createdAt)),
    },
    { label: "Commits logged", value: "0" },
    { label: "Achievements", value: "0" },
    { label: "Skills demonstrated", value: "0" },
  ];

  return { activeSeed, seeds, stats, hasProject: true };
}
