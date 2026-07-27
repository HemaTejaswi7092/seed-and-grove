import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, MapPin } from "lucide-react";
import { getInitials } from "../../lib/initials";
import type { EmploymentType, JobListing, WorkMode } from "../../recruiter/types";

interface JobMatchCardProps {
  job: JobListing;
  index?: number;
}

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

// Deliberately concise, matching the approved spec exactly: title,
// company, location, work mode, employment type, short description,
// match label + percentage, one sentence, top 1-3 supporting
// Achievements, View Job, Apply Externally. No long job-fit report.
// Renders identically whether job is scored (Recommended for You) or not
// (All Jobs) — matchScore/matchLabel/matchSentence/achievements are just
// null in the latter case, so the match block is omitted rather than
// showing a fake/zero score.
export default function JobMatchCard({ job, index = 0 }: JobMatchCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.05 }}
      className="rounded-2xl border border-border bg-canvas-elevated p-6"
    >
      <div className="flex items-start gap-3">
        {job.companyLogoUrl ? (
          <img
            src={job.companyLogoUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
            {getInitials(job.companyName)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{job.title}</p>
          <p className="mt-0.5 truncate text-xs text-ink-faint">{job.companyName}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
            {job.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" strokeWidth={2} />
                {job.location}
              </span>
            )}
            <span>{WORK_MODE_LABEL[job.workMode]}</span>
            <span>{EMPLOYMENT_TYPE_LABEL[job.employmentType]}</span>
          </div>
        </div>
        {job.matchScore !== null && job.matchLabel && (
          <span className="flex shrink-0 items-center justify-center rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-dark">
            {job.matchLabel} · {job.matchScore}%
          </span>
        )}
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink-soft">
        {job.shortDescription}
      </p>

      {job.matchSentence && (
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{job.matchSentence}</p>
      )}

      {job.achievements.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Supporting Achievements
          </p>
          <ul className="mt-2 space-y-1.5">
            {job.achievements.map((achievement) => (
              <li key={achievement.id} className="text-xs text-ink-soft">
                {achievement.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
        <Link
          to={`/opportunities/${job.jobId}`}
          className="inline-flex items-center gap-1 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
        >
          View Job
        </Link>
        <a
          href={job.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-accent px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-dark"
        >
          Apply Externally
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
        </a>
      </div>
    </motion.div>
  );
}
