import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Sprout, UserX } from "lucide-react";
import {
  getCandidateProfilePublic,
  candidateRowToFields,
} from "../state/candidateProfileStore";
import { listPublishedAchievements } from "../state/groveAchievementsStore";
import { getInitials } from "../lib/initials";
import { timeAgo } from "../lib/dates";
import ProfileIdentityCard from "../components/grove/ProfileIdentityCard";
import ProfessionalDetails from "../components/grove/ProfessionalDetails";
import OpportunitiesPanel from "../components/grove/OpportunitiesPanel";
import AchievementHighlights from "../components/grove/AchievementHighlights";
import type {
  AchievementHighlight,
  CandidateProfilePublic,
  PublishedAchievement,
} from "../types/grove";

// Read-only — reuses Grove's own presentation components (isOwner=false
// throughout, so every edit/preview/share control they'd otherwise render
// is simply absent) rather than rebuilding this layout. Sourced only from
// candidate_profiles_public + this one candidate's grove_achievements —
// never Seed conversations, private achievements, copilot_memory, or
// draft data, none of which this page (or its RLS) can reach in the
// first place. No internal messaging anywhere on this page — contact is
// external only (mailto / LinkedIn / GitHub / portfolio links).
export default function RecruiterCandidateProfile() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const [candidate, setCandidate] = useState<CandidateProfilePublic | null | undefined>(
    undefined,
  );
  const [achievements, setAchievements] = useState<PublishedAchievement[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) return;
    let cancelled = false;

    Promise.all([
      getCandidateProfilePublic(candidateId),
      listPublishedAchievements(candidateId),
    ])
      .then(([profileRow, achievementRows]) => {
        if (cancelled) return;
        setCandidate(profileRow);
        setAchievements(achievementRows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't load this candidate.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  if (!candidateId) return <Navigate to="/recruiter/discover" replace />;

  if (error) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      </main>
    );
  }

  if (candidate === undefined || achievements === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="flex h-10 w-10 animate-pulse items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Sprout className="h-5 w-5" strokeWidth={2.25} />
        </span>
      </div>
    );
  }

  if (candidate === null) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <UserX className="h-6 w-6" strokeWidth={2} />
        </span>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          This candidate doesn&apos;t have a public Grove profile yet.
        </p>
      </main>
    );
  }

  const displayName = candidate.full_name.trim() || "Candidate";
  const initials = getInitials(displayName);
  const fields = candidateRowToFields(candidate);

  const achievementHighlights: AchievementHighlight[] = achievements.map((a) => ({
    id: a.id,
    seedId: a.project_id,
    seedTitle: a.project_domain || "Project",
    title: a.title,
    shortDescription: a.short_description,
    achievementType: a.achievement_type,
    skillsDemonstrated: a.skills_demonstrated,
    technologiesUsed: a.technologies_used,
    candidateContribution: a.candidate_contribution,
    outcomeOrImpact: a.outcome_or_impact,
    proofUrl: a.proof_url,
    proofLabel: a.proof_label,
    relevantRoles: a.relevant_roles,
    date: timeAgo(a.created_at),
  }));

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <ProfileIdentityCard
        displayName={displayName}
        initials={initials}
        headline={candidate.headline}
        bio={candidate.bio}
        location={candidate.location}
        availability={candidate.availability}
        stats={[{ label: "Published Achievements", value: achievements.length }]}
        isOwner={false}
        isPreview={false}
        onTogglePreview={() => {}}
        onShare={() => {}}
        onEdit={() => {}}
      />

      <div className="mt-10 space-y-10">
        <OpportunitiesPanel
          opportunities={fields.opportunities}
          isOwner={false}
          onEdit={() => {}}
        />
        <ProfessionalDetails fields={fields} isOwner={false} onEdit={() => {}} />
        <AchievementHighlights achievements={achievementHighlights} />
      </div>
    </main>
  );
}
