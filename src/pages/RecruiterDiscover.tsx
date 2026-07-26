import { useEffect, useState } from "react";
import { Sparkles, Compass } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { listRecentPublishedAchievements } from "../state/groveAchievementsStore";
import { listCandidateProfilesPublic } from "../state/candidateProfileStore";
import DiscoverFeedCard from "../components/recruiter/DiscoverFeedCard";
import type { CandidateProfilePublic, PublishedAchievement } from "../types/grove";

type DiscoverTab = "for_you" | "recent";

// Candidate professional activity only — see DiscoverFeedCard's header
// comment. "For You" is an explicit coming-soon state rather than the
// same query as "Recent" relabeled: there's no matching signal to
// personalize with yet (that's Phase B), and presenting an
// unpersonalized feed as "For You" would be misleading.
export default function RecruiterDiscover() {
  const { user } = useAuth();
  const [tab, setTab] = useState<DiscoverTab>("recent");
  const [achievements, setAchievements] = useState<PublishedAchievement[] | null>(null);
  const [candidatesById, setCandidatesById] = useState<
    Map<string, CandidateProfilePublic>
  >(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    listRecentPublishedAchievements(50)
      .then(async (rows) => {
        if (cancelled) return;
        setAchievements(rows);
        const candidateIds = Array.from(new Set(rows.map((row) => row.candidate_id)));
        const profiles = await listCandidateProfilesPublic(candidateIds);
        if (cancelled) return;
        setCandidatesById(new Map(profiles.map((p) => [p.user_id, p])));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't load the feed.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Discover</h1>
      <p className="mt-2 text-lg text-ink-soft">
        Candidate professional activity — published achievements, milestones,
        and updates.
      </p>

      <div className="mt-6 flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("for_you")}
          className={[
            "relative pb-3 text-sm font-medium transition-colors",
            tab === "for_you" ? "text-ink" : "text-ink-faint hover:text-ink-soft",
          ].join(" ")}
        >
          For You
          {tab === "for_you" && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("recent")}
          className={[
            "relative pb-3 text-sm font-medium transition-colors",
            tab === "recent" ? "text-ink" : "text-ink-faint hover:text-ink-soft",
          ].join(" ")}
        >
          Recent
          {tab === "recent" && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />
          )}
        </button>
      </div>

      <div className="mt-6">
        {tab === "for_you" ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <Sparkles className="h-6 w-6" strokeWidth={2} />
            </span>
            <p className="mt-4 text-sm font-medium text-ink">Coming soon</p>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-faint">
              Once AI candidate matching is live, this tab will prioritize
              activity semantically relevant to your active jobs.
            </p>
          </div>
        ) : error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : achievements === null ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16">
            <p className="text-sm text-ink-faint">Loading…</p>
          </div>
        ) : achievements.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <Compass className="h-6 w-6" strokeWidth={2} />
            </span>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              No published candidate activity yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {achievements.map((achievement, index) => (
              <DiscoverFeedCard
                key={achievement.id}
                achievement={achievement}
                candidate={candidatesById.get(achievement.candidate_id) ?? null}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
