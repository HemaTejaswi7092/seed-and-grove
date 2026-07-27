import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import { getPublishedJob, getRecruiterProfilePublic } from "../recruiter/recruiterStore";
import type { EmploymentType, Job, RecruiterProfilePublic, WorkMode } from "../recruiter/types";

const WORK_MODE_LABEL: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
};

const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  temporary: "Temporary",
};

// Read-only — no application form, no tracking, no internal hiring
// workflow. "Apply Externally" is a plain outbound link to the job's own
// application_url; this page never collects or stores anything about an
// application. See opportunities_matching.sql's header comment.
export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null | undefined>(undefined);
  const [company, setCompany] = useState<RecruiterProfilePublic | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;

    getPublishedJob(jobId)
      .then((row) => {
        if (cancelled) return;
        setJob(row);
        if (!row) return;
        return getRecruiterProfilePublic(row.recruiter_id).then((c) => {
          if (!cancelled) setCompany(c);
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setJob(null);
          setError(err instanceof Error ? err.message : "Couldn't load this job.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link
        to="/opportunities"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to Opportunities
      </Link>

      {job === undefined && (
        <div className="mt-8 flex items-center justify-center rounded-3xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16">
          <p className="text-sm text-ink-faint">Loading…</p>
        </div>
      )}

      {job === null && (
        <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16 text-center">
          <h2 className="text-lg font-semibold text-ink">
            {error || "This job isn't available anymore."}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            It may have been closed or removed by the recruiter.
          </p>
        </div>
      )}

      {job && (
        <div className="mt-8 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{job.title}</h1>
          <p className="mt-1 text-sm font-medium text-ink-soft">
            {company?.company_name?.trim() || "A company"}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-faint">
            {job.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" strokeWidth={2} />
                {job.location}
              </span>
            )}
            <span>{WORK_MODE_LABEL[job.work_mode]}</span>
            <span>{EMPLOYMENT_TYPE_LABEL[job.employment_type]}</span>
            {job.experience_level && <span>{job.experience_level}</span>}
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <h2 className="text-sm font-semibold text-ink">About the role</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
              {job.description}
            </p>
          </div>

          {(job.required_skills.length > 0 || job.preferred_skills.length > 0) && (
            <div className="mt-6 border-t border-border pt-6">
              {job.required_skills.length > 0 && (
                <>
                  <h2 className="text-sm font-semibold text-ink">Required skills</h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {job.required_skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-dark"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </>
              )}
              {job.preferred_skills.length > 0 && (
                <>
                  <h2 className="mt-4 text-sm font-semibold text-ink">Preferred skills</h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {job.preferred_skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-ink-soft"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {(job.education || job.work_authorization) && (
            <div className="mt-6 space-y-1 border-t border-border pt-6 text-sm text-ink-soft">
              {job.education && <p>Education: {job.education}</p>}
              {job.work_authorization && <p>Work authorization: {job.work_authorization}</p>}
            </div>
          )}

          <a
            href={job.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
          >
            Apply Externally
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </a>
        </div>
      )}
    </main>
  );
}
