import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, MapPin, ArrowUpRight } from "lucide-react";
import { searchCandidates, searchJobs } from "../../state/searchStore";
import type { CandidateSearchResult, JobSearchResult } from "../../state/searchStore";
import { useMenuDismissRef } from "../../lib/useMenuDismiss";
import { getInitials } from "../../lib/initials";
import type { EmploymentType, WorkMode } from "../../recruiter/types";

const DEBOUNCE_MS = 300;

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

type SearchStatus = "idle" | "loading" | "error";

// Two safe, already-scoped surfaces only (see state/searchStore.ts's
// header comment) — never Seed data, private Achievements, or
// copilot_memory, none of which this component has any code path to.
// Debounced client-side: a keystroke only schedules a search, an actual
// query only fires once the input's been quiet for DEBOUNCE_MS.
export default function GlobalSearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [people, setPeople] = useState<CandidateSearchResult[]>([]);
  const [jobs, setJobs] = useState<JobSearchResult[]>([]);

  const containerRef = useMenuDismissRef<HTMLDivElement>(open, () => setOpen(false));

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    if (!debouncedQuery) {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setStatus("idle");
        setPeople([]);
        setJobs([]);
      });
      return () => {
        cancelled = true;
      };
    }

    Promise.resolve().then(() => {
      if (!cancelled) {
        setStatus("loading");
        setError(null);
      }
    });

    Promise.all([searchCandidates(debouncedQuery), searchJobs(debouncedQuery)])
      .then(([peopleResults, jobResults]) => {
        if (cancelled) return;
        setPeople(peopleResults);
        setJobs(jobResults);
        setStatus("idle");
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Search failed. Try again.");
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  function handleClear() {
    setQuery("");
    setDebouncedQuery("");
    setStatus("idle");
    setPeople([]);
    setJobs([]);
    setOpen(false);
  }

  function goToCandidate(candidateId: string) {
    setOpen(false);
    navigate(`/candidates/${candidateId}/preview`);
  }

  function goToJob(jobId: string) {
    setOpen(false);
    navigate(`/opportunities/${jobId}`);
  }

  const hasQuery = debouncedQuery.length > 0;
  const hasResults = people.length > 0 || jobs.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-faint"
          strokeWidth={2}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search candidates or job titles…"
          className="w-full rounded-full border border-border bg-canvas-elevated py-3 pr-10 pl-11 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute top-1/2 right-3 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-accent-soft hover:text-ink"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
      </div>

      {open && hasQuery && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-canvas-elevated shadow-[0_16px_40px_-16px_rgba(26,28,25,0.35)]">
          {status === "loading" ? (
            <div className="flex items-center justify-center px-4 py-8">
              <p className="text-sm text-ink-faint">Searching…</p>
            </div>
          ) : status === "error" ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : !hasResults ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-ink-soft">
                No results found for &ldquo;{debouncedQuery}&rdquo;
              </p>
            </div>
          ) : (
            <div className="max-h-[28rem] overflow-y-auto">
              <div className="px-4 pt-4 pb-2">
                <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
                  People
                </p>
              </div>
              {people.length === 0 ? (
                <p className="px-4 pb-3 text-sm text-ink-faint">No matching people</p>
              ) : (
                people.map((person) => (
                  <button
                    key={person.candidateId}
                    type="button"
                    onClick={() => goToCandidate(person.candidateId)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent-soft"
                  >
                    {person.avatarUrl ? (
                      <img
                        src={person.avatarUrl}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-full border border-border object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                        {getInitials(person.fullName)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {person.fullName || "Candidate"}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-ink-faint">
                        {person.headline && <span className="truncate">{person.headline}</span>}
                        {person.location && (
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" strokeWidth={2} />
                            {person.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-accent-dark">
                      View Profile
                    </span>
                  </button>
                ))
              )}

              <div className="border-t border-border px-4 pt-3 pb-2">
                <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
                  Jobs
                </p>
              </div>
              {jobs.length === 0 ? (
                <p className="px-4 pb-4 text-sm text-ink-faint">No matching jobs</p>
              ) : (
                jobs.map((job) => (
                  <button
                    key={job.jobId}
                    type="button"
                    onClick={() => goToJob(job.jobId)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent-soft"
                  >
                    {job.companyLogoUrl ? (
                      <img
                        src={job.companyLogoUrl}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-full border border-border object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                        {getInitials(job.companyName)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{job.title}</p>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-ink-faint">
                        <span className="truncate">{job.companyName}</span>
                        {job.location && <span>{job.location}</span>}
                        <span>{WORK_MODE_LABEL[job.workMode]}</span>
                        <span>{EMPLOYMENT_TYPE_LABEL[job.employmentType]}</span>
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent-dark">
                      View Job
                      <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
