import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, Pencil, Archive, Trash2, MapPin, Search } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { listJobs, archiveJob, deleteJob } from "../recruiter/recruiterStore";
import type { Job, JobStatus } from "../recruiter/types";

const STATUS_STYLES: Record<JobStatus, string> = {
  draft: "border border-border text-ink-faint",
  published: "bg-accent-soft text-accent-dark",
  closed: "bg-ink-faint/15 text-ink-faint",
};

const STATUS_LABEL: Record<JobStatus, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
};

const WORK_MODE_LABEL: Record<Job["work_mode"], string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
};

export default function RecruiterJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void loadJobs(user.id);
  }, [user]);

  async function loadJobs(recruiterId: string) {
    try {
      const rows = await listJobs(recruiterId);
      setJobs(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load your jobs.");
    }
  }

  if (!user) return null;

  async function handleArchive(jobId: string) {
    setBusyJobId(jobId);
    try {
      await archiveJob(jobId);
      await loadJobs(user!.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't archive that job.");
    } finally {
      setBusyJobId(null);
    }
  }

  async function handleDelete(jobId: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
    setBusyJobId(jobId);
    try {
      await deleteJob(jobId);
      await loadJobs(user!.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that job.");
    } finally {
      setBusyJobId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Jobs
          </h1>
          <p className="mt-2 text-lg text-ink-soft">
            Every role you're hiring for, in one place.
          </p>
        </div>
        {jobs && jobs.length > 0 && (
          <Link
            to="/recruiter/jobs/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
          >
            Create Job
          </Link>
        )}
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {jobs === null ? (
        <div className="mt-8 flex items-center justify-center rounded-3xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16">
          <p className="text-sm text-ink-faint">Loading…</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Briefcase className="h-7 w-7" strokeWidth={2} />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-ink">
            No jobs posted yet
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            Post a role to start discovering evidence-backed candidates for it.
          </p>
          <Link
            to="/recruiter/jobs/new"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
          >
            Create Job
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.05 }}
              className="flex flex-col rounded-2xl border border-border bg-canvas-elevated p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-ink">{job.title}</p>
                <span
                  className={[
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                    STATUS_STYLES[job.status],
                  ].join(" ")}
                >
                  {STATUS_LABEL[job.status]}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
                {job.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" strokeWidth={2} />
                    {job.location}
                  </span>
                )}
                <span>{WORK_MODE_LABEL[job.work_mode]}</span>
              </div>

              {job.required_skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.required_skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-ink-soft"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                {job.status === "published" && (
                  <Link
                    to={`/recruiter/jobs/${job.id}/matches`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent-dark transition-colors hover:bg-accent-soft-border"
                  >
                    <Search className="h-3.5 w-3.5" strokeWidth={2} />
                    Find Matches
                  </Link>
                )}
                <Link
                  to={`/recruiter/jobs/${job.id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                  Edit
                </Link>
                {job.status !== "closed" && (
                  <button
                    type="button"
                    onClick={() => handleArchive(job.id)}
                    disabled={busyJobId === job.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-50"
                  >
                    <Archive className="h-3.5 w-3.5" strokeWidth={2} />
                    Archive
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(job.id, job.title)}
                  disabled={busyJobId === job.id}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}
