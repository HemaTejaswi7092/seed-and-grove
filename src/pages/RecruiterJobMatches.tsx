import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Search, Users } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { getJob } from "../recruiter/recruiterStore";
import { matchCandidatesForJob } from "../recruiter/matchingStore";
import CandidateMatchCard from "../components/recruiter/CandidateMatchCard";
import type { CandidateMatch, Job } from "../recruiter/types";

// Auto-runs semantic matching for this job on mount — full job
// description → embedding → pgvector retrieval over published
// Achievements → grouped/ranked candidates. See match-candidates Edge
// Function's header comment for the full pipeline; this page only ever
// renders what that function returns, nothing derived independently.
export default function RecruiterJobMatches() {
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [matches, setMatches] = useState<CandidateMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !jobId) return;
    let cancelled = false;

    getJob(user.id, jobId)
      .then((row) => {
        if (cancelled) return;
        if (!row) {
          setError("That job couldn't be found.");
          return;
        }
        setJob(row);
        return matchCandidatesForJob({
          title: row.title,
          description: row.description,
          requiredSkills: row.required_skills,
          preferredSkills: row.preferred_skills,
        }).then((results) => {
          if (!cancelled) setMatches(results);
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't find matches for this job.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, jobId]);

  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link
        to="/recruiter/jobs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to Jobs
      </Link>

      <div className="mt-4 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Search className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Candidate Matches
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {job ? `Evidence-backed candidates for "${job.title}".` : "Loading the job…"}
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!error && matches === null && (
        <div className="mt-8 flex items-center justify-center rounded-3xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16">
          <p className="text-sm text-ink-faint">Matching against published achievements…</p>
        </div>
      )}

      {!error && matches !== null && matches.length === 0 && (
        <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Users className="h-7 w-7" strokeWidth={2} />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-ink">No strong matches yet</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            No published achievement is a close enough semantic match to this job description
            right now. Check back as more candidates publish achievements.
          </p>
        </div>
      )}

      {!error && matches !== null && matches.length > 0 && (
        <div className="mt-8 space-y-4">
          {matches.map((match, index) => (
            <CandidateMatchCard key={match.candidateId} match={match} index={index} />
          ))}
        </div>
      )}
    </main>
  );
}
