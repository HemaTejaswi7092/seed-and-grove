import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, ListChecks, ArrowUpRight, FileText, Megaphone } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { listJobs } from "../recruiter/recruiterStore";
import { timeAgo } from "../lib/dates";
import type { Job } from "../recruiter/types";

// Recruiter Seed — the recruiter's private workspace for creating hiring
// content before publishing it, not a candidate-matching-first landing
// page. Candidate matching now lives entirely per-job (Jobs → Find
// Matches, unchanged) rather than being previewed here — see the plan's
// Phase 4/9 for why. Stat cards and Recent Job Activity are real (via
// listJobs); Quick Actions are the two real creation entry points this
// pass ships (Create Job, Draft Company Post) — AI generation lives
// inside each destination, not as a separate step.
export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (!user) return null;

  const activeJobsCount = jobs?.filter((job) => job.status === "published").length ?? 0;
  const totalJobsCount = jobs?.length ?? 0;
  const recentJobs = [...(jobs ?? [])]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Seed</h1>
        <p className="mt-2 text-lg text-ink-soft">
          Your workspace for hiring content — jobs and company updates,
          drafted here before they publish to your Grove and the Feed.
        </p>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/recruiter/jobs/new"
          className="flex items-start gap-4 rounded-2xl border border-border bg-canvas-elevated p-5 transition-colors hover:border-ink-faint/50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <FileText className="h-4.5 w-4.5" strokeWidth={2} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Create Job</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              Describe the role — generate a full draft with AI, then edit
              and publish.
            </p>
          </div>
        </Link>

        <Link
          to="/recruiter/posts/new"
          className="flex items-start gap-4 rounded-2xl border border-border bg-canvas-elevated p-5 transition-colors hover:border-ink-faint/50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Megaphone className="h-4.5 w-4.5" strokeWidth={2} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Draft Company Post</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              Share an award, hiring update, or team milestone to your
              Grove and the shared Feed.
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          Recent Job Activity
        </h2>

        {jobs === null ? (
          <div className="mt-4 flex items-center justify-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-12">
            <p className="text-sm text-ink-faint">Loading…</p>
          </div>
        ) : recentJobs.length === 0 ? (
          // No CTA here — Create Job is already the first Quick Action
          // above; repeating it would be exactly the duplicate primary
          // action this page's ownership model avoids.
          <div className="mt-4 rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-8 text-center">
            <p className="text-sm text-ink-soft">No recent job activity yet.</p>
            <p className="mt-1 text-xs text-ink-faint">
              Your published and draft jobs will appear here.
            </p>
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
