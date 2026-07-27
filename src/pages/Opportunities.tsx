import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Briefcase } from "lucide-react";
import { listAllJobListings, matchJobsForCandidate } from "../state/opportunitiesStore";
import JobMatchCard from "../components/opportunities/JobMatchCard";
import type { JobListing } from "../recruiter/types";

const MAX_RECOMMENDED = 10;

// Semantic candidate -> jobs matching (the other direction of the same
// engine recruiters use — see match-jobs-for-candidate's header comment).
// Always fetches every published job (unscored base data) AND the
// caller's own scored matches, then overlays the scores onto the
// matching jobs. Every published job gets a real percentage as long as
// the candidate has published Achievements — match-jobs-for-candidate
// generates a job's embedding on demand if it's missing one, and applies
// no similarity floor, so even a weak match still shows its score. With
// zero published Achievements, nothing is scored and every job renders
// unscored instead.
export default function Opportunities() {
  const [listings, setListings] = useState<JobListing[] | null>(null);
  const [hasPublishedAchievements, setHasPublishedAchievements] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([listAllJobListings(), matchJobsForCandidate()])
      .then(([allJobs, matchResult]) => {
        if (cancelled) return;
        const matchesByJobId = new Map(matchResult.matches.map((m) => [m.jobId, m]));
        const merged = allJobs.map((job) => {
          const match = matchesByJobId.get(job.jobId);
          if (!match) return job;
          return {
            ...job,
            matchScore: match.matchScore,
            matchLabel: match.matchLabel,
            matchSentence: match.matchSentence,
            achievements: match.achievements,
          };
        });
        setListings(merged);
        setHasPublishedAchievements(matchResult.hasPublishedAchievements);
      })
      .catch((err) => {
        if (cancelled) return;
        // Scoring failed — fall back to an unscored listing rather than
        // blocking the page entirely.
        setError(err instanceof Error ? err.message : "Couldn't score jobs for you right now.");
        listAllJobListings()
          .then((allJobs) => {
            if (!cancelled) setListings(allJobs);
          })
          .catch(() => {
            if (!cancelled) setListings([]);
          });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // The main list: every published job, highest match percentage first —
  // no threshold hides a weak match here, that's what makes this the
  // authoritative "every job, every score" list (Recommended below is
  // just a highlighted subset of the same data). Unscored jobs (only
  // possible with zero published Achievements) keep a stable order at
  // the end rather than being shuffled by a meaningless null score.
  const allJobsRanked = [...(listings ?? [])].sort((a, b) => {
    if (a.matchScore === null && b.matchScore === null) return 0;
    if (a.matchScore === null) return 1;
    if (b.matchScore === null) return -1;
    return b.matchScore - a.matchScore;
  });

  const recommended = allJobsRanked
    .filter((job): job is JobListing & { matchScore: number } => job.matchScore !== null)
    .slice(0, MAX_RECOMMENDED);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Opportunities</h1>
      <p className="mt-2 text-lg text-ink-soft">
        Published roles, ranked by how closely they match your published work.
      </p>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {!hasPublishedAchievements && listings !== null && (
        <div className="mt-6 flex items-start gap-4 rounded-2xl border border-accent-soft-border bg-accent-soft p-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <p className="text-sm leading-relaxed text-ink-soft">
            Publish an Achievement in your Grove to get personalized match percentages — every
            open role is listed below, but they're not scored for you yet.{" "}
            <Link to="/grove" className="font-medium text-accent-dark hover:text-accent">
              Publish an Achievement
            </Link>
          </p>
        </div>
      )}

      {listings === null ? (
        <div className="mt-8 flex items-center justify-center rounded-3xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16">
          <p className="text-sm text-ink-faint">Finding roles for you…</p>
        </div>
      ) : (
        <>
          {hasPublishedAchievements && (
            <div className="mt-10">
              <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
                Recommended for You
              </h2>
              {recommended.length === 0 ? (
                <div className="mt-4 flex items-center justify-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-12 text-center">
                  <p className="text-sm leading-relaxed text-ink-soft">
                    No strong matches yet — check back as more roles are published, or browse
                    everything below.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {recommended.map((job, index) => (
                    <JobMatchCard key={job.jobId} job={job} index={index} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-10">
            <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
              All Jobs
            </h2>
            {allJobsRanked.length === 0 ? (
              <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                  <Briefcase className="h-7 w-7" strokeWidth={2} />
                </span>
                <h2 className="mt-5 text-lg font-semibold text-ink">No open roles right now</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
                  Check back soon — published roles will show up here.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {allJobsRanked.map((job, index) => (
                  <JobMatchCard key={job.jobId} job={job} index={index} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
