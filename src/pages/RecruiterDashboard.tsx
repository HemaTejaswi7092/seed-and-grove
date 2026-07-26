import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, ListChecks, Sparkles, ArrowUpRight, Users } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { listJobs } from "../recruiter/recruiterStore";
import { listRecentPublishedAchievements } from "../state/groveAchievementsStore";
import { listCandidateProfilesPublic } from "../state/candidateProfileStore";
import DiscoverFeedCard from "../components/recruiter/DiscoverFeedCard";
import { timeAgo } from "../lib/dates";
import type { Job } from "../recruiter/types";
import type { CandidateProfilePublic, PublishedAchievement } from "../types/grove";

// Deliberately no social feed, no candidate posts here — this is a
// separate page from the candidate Dashboard, not a filtered view of it.
// Stat cards are real (Active/Total Jobs, Recent Job Activity, Recent
// Candidate Activity) except the explicit "coming soon" placeholders for
// AI matching (Phase B).
export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentAchievements, setRecentAchievements] = useState<
    PublishedAchievement[] | null
  >(null);
  const [candidatesById, setCandidatesById] = useState<
    Map<string, CandidateProfilePublic>
  >(new Map());

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listJobs(user.id)
      .then((rows) => {
        if (!cancelled) setJobs(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't load your jobs.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listRecentPublishedAchievements(3)
      .then(async (rows) => {
        if (cancelled) return;
        setRecentAchievements(rows);
        const candidateIds = Array.from(new Set(rows.map((row) => row.candidate_id)));
        const profiles = await listCandidateProfilesPublic(candidateIds);
        if (!cancelled) setCandidatesById(new Map(profiles.map((p) => [p.user_id, p])));
      })
      .catch(() => {
        if (!cancelled) setRecentAchievements([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  const activeJobsCount = jobs?.filter((job) => job.status === "published").length ?? 0;
  const totalJobsCount = jobs?.length ?? 0;
  const recentJobs = [...(jobs ?? [])]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Recruiter Dashboard
          </h1>
          <p className="mt-2 text-lg text-ink-soft">
            Post jobs and discover evidence-backed candidates.
          </p>
        </div>
        <Link
          to="/recruiter/jobs/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
        >
          Post a Job
        </Link>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 overflow-hidden rounded-3xl border border-accent-soft-border bg-accent-soft p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-white">
              <Sparkles className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">AI Candidate Matching</h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-soft">
                Semantic retrieval over published Grove achievements surfaces
                evidence-backed candidates for each of your published jobs, with
                cited reasoning — never a black-box score.
              </p>
            </div>
          </div>
          <Link
            to="/recruiter/jobs"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
          >
            Find Matches
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-canvas-elevated p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Briefcase className="h-4 w-4" strokeWidth={2} />
          </span>
          <p className="mt-3 text-2xl font-semibold text-ink">
            {jobs === null ? "—" : activeJobsCount}
          </p>
          <p className="text-xs text-ink-faint">Active Jobs</p>
        </div>

        <div className="rounded-2xl border border-border bg-canvas-elevated p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <ListChecks className="h-4 w-4" strokeWidth={2} />
          </span>
          <p className="mt-3 text-2xl font-semibold text-ink">
            {jobs === null ? "—" : totalJobsCount}
          </p>
          <p className="text-xs text-ink-faint">Total Jobs</p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
          Recommended Candidates
        </h2>
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-12 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Users className="h-4 w-4" strokeWidth={2} />
          </span>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Matching is run per job. Open a published job and select{" "}
            <span className="font-medium text-ink">Find Matches</span> to see
            evidence-backed candidates for it.
          </p>
          <Link
            to="/recruiter/jobs"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
          >
            Go to Jobs
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Recent Candidate Activity
          </h2>
          <Link
            to="/recruiter/discover"
            className="text-xs font-medium text-accent-dark transition-colors hover:text-accent"
          >
            View all in Discover
          </Link>
        </div>

        {recentAchievements === null ? (
          <div className="mt-4 flex items-center justify-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-12">
            <p className="text-sm text-ink-faint">Loading…</p>
          </div>
        ) : recentAchievements.length === 0 ? (
          <div className="mt-4 flex items-center justify-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-12 text-center">
            <p className="text-sm leading-relaxed text-ink-soft">
              No published candidate activity yet.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {recentAchievements.map((achievement, index) => (
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

      <div className="mt-10">
        <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
          Recent Job Activity
        </h2>

        {jobs === null ? (
          <div className="mt-4 flex items-center justify-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-12">
            <p className="text-sm text-ink-faint">Loading…</p>
          </div>
        ) : recentJobs.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-12 text-center">
            <p className="text-sm leading-relaxed text-ink-soft">
              No jobs yet. Post your first one to get started.
            </p>
            <Link
              to="/recruiter/jobs/new"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
            >
              Post a Job
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {recentJobs.map((job) => (
              <Link
                key={job.id}
                to={`/recruiter/jobs/${job.id}/edit`}
                className="flex items-center justify-between rounded-2xl border border-border bg-canvas-elevated p-4 transition-shadow hover:shadow-[0_12px_32px_-16px_rgba(26,28,25,0.25)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {job.title}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    <span className="capitalize">{job.status}</span> · updated{" "}
                    {timeAgo(job.updated_at)}
                  </p>
                </div>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-ink-faint"
                  strokeWidth={2}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
