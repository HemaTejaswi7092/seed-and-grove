import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { isDemoAccount } from "../config/demoAccount";
import { listSeeds } from "../state/seedsStore";
import { daysSince } from "../lib/dates";
import { DEMO_SEED, demoProjectStats } from "../data/mockData";
import type { ProjectStat } from "../types/mockData";
import type { Seed } from "../types/seed";

interface ActiveProjectResult {
  activeSeed: Seed | null;
  seeds: Seed[];
  stats: ProjectStat[];
  hasProject: boolean;
  loading: boolean;
  error: string | null;
}

// Only the seeded demo account (see config/demoAccount.ts) sees the VISIQ
// demo Seed. Every other authenticated user sees the Seeds they've
// actually planted, fetched fresh from Postgres (see
// state/seedsStore.ts) — never localStorage, never another device's
// leftover browser state, so the same account sees the same Seeds
// regardless of which device signed in. Never VISIQ, never another
// user's Seed, as a fallback.
export function useActiveProject(): ActiveProjectResult {
  const { user } = useAuth();
  const isDemo = !!user && isDemoAccount(user.email);

  const [seeds, setSeeds] = useState<Seed[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || isDemo) return;
    let cancelled = false;
    listSeeds(user.id)
      .then((rows) => {
        if (!cancelled) setSeeds(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't load your Seeds.");
          setSeeds([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, isDemo]);

  if (isDemo) {
    return {
      activeSeed: DEMO_SEED,
      seeds: [DEMO_SEED],
      stats: demoProjectStats,
      hasProject: true,
      loading: false,
      error: null,
    };
  }

  if (seeds === null) {
    return {
      activeSeed: null,
      seeds: [],
      stats: [],
      hasProject: false,
      loading: !error,
      error,
    };
  }

  if (seeds.length === 0) {
    return {
      activeSeed: null,
      seeds: [],
      stats: [],
      hasProject: false,
      loading: false,
      error,
    };
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

  return { activeSeed, seeds, stats, hasProject: true, loading: false, error };
}
