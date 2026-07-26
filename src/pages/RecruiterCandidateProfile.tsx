import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Sprout, UserX } from "lucide-react";
import {
  getCandidateProfilePublic,
  candidateRowToFields,
} from "../state/candidateProfileStore";
import { listPublishedAchievements } from "../state/groveAchievementsStore";
import { listPublishedSeeds } from "../state/groveSeedsStore";
import { deriveSkillsFromAchievements } from "../lib/groveSkills";
import type { PublishedAchievementWithSeed } from "../lib/groveSkills";
import { getInitials } from "../lib/initials";
import { timeAgo } from "../lib/dates";
import GroveView from "../components/grove/GroveView";
import type {
  AchievementHighlight,
  CandidateProfilePublic,
  FeaturedSeedCard,
  PublishedAchievement,
  PublishedSeed,
} from "../types/grove";

// Read-only — reuses Grove's own presentation component (GroveView,
// isOwner=false throughout, so every edit/preview/share control it would
// otherwise render is simply absent) rather than maintaining a second,
// hand-rolled layout that inevitably drifts from the owner's own Grove
// page. Sourced only from candidate_profiles_public + this one
// candidate's published grove_achievements + grove_seeds — never Seed
// conversations, private achievements/seeds, copilot_memory, or draft
// data, none of which this page (or its RLS) can reach in the first
// place. No internal messaging anywhere on this page — contact is
// external only (mailto / LinkedIn / GitHub / portfolio links).
export default function RecruiterCandidateProfile() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const [candidate, setCandidate] = useState<CandidateProfilePublic | null | undefined>(
    undefined,
  );
  const [achievements, setAchievements] = useState<PublishedAchievement[] | null>(null);
  const [seeds, setSeeds] = useState<PublishedSeed[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) return;
    let cancelled = false;

    Promise.all([
      getCandidateProfilePublic(candidateId),
      listPublishedAchievements(candidateId),
      listPublishedSeeds(candidateId),
    ])
      .then(([profileRow, achievementRows, seedRows]) => {
        if (cancelled) return;
        setCandidate(profileRow);
        setAchievements(achievementRows);
        setSeeds(seedRows);
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

  if (candidate === undefined || achievements === null || seeds === null) {
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
  const profileFields = candidateRowToFields(candidate);
  const seedById = new Map(seeds.map((seed) => [seed.id, seed]));

  // An achievement can be published without its parent Seed being
  // published (there's no dependency between the two) — when that
  // happens there's no grove_seeds row to join against, so this falls
  // back to the achievement's own project_domain rather than dropping
  // the achievement. Evidence is the single most important thing on this
  // page; it must never silently disappear just because the Seed behind
  // it happens to still be private.
  const achievementsWithSeed: PublishedAchievementWithSeed[] = achievements.map(
    (achievement) => {
      const seed = seedById.get(achievement.project_id);
      return {
        achievement,
        seed: seed
          ? { id: seed.id, title: seed.title }
          : { id: achievement.project_id, title: achievement.project_domain || "Project" },
      };
    },
  );

  const skills = deriveSkillsFromAchievements(achievementsWithSeed);

  const achievementHighlights: AchievementHighlight[] = achievementsWithSeed
    .slice()
    .sort(
      (a, b) =>
        new Date(b.achievement.created_at).getTime() -
        new Date(a.achievement.created_at).getTime(),
    )
    .map(({ achievement, seed }) => ({
      id: achievement.id,
      seedId: seed.id,
      seedTitle: seed.title,
      title: achievement.title,
      shortDescription: achievement.short_description,
      achievementType: achievement.achievement_type,
      skillsDemonstrated: achievement.skills_demonstrated,
      technologiesUsed: achievement.technologies_used,
      candidateContribution: achievement.candidate_contribution,
      outcomeOrImpact: achievement.outcome_or_impact,
      proofUrl: achievement.proof_url,
      proofLabel: achievement.proof_label,
      relevantRoles: achievement.relevant_roles,
      date: timeAgo(achievement.created_at),
    }));

  const featuredSeeds: FeaturedSeedCard[] = seeds.map((seed) => ({
    id: seed.id,
    title: seed.title,
    description: seed.description,
    status: seed.status,
    // grove_seeds deliberately doesn't mirror the private progress field
    // — see types/grove.ts's FeaturedSeedCard comment.
    progress: null,
    lifecycleStatus: seed.lifecycle_status,
    technologies: seed.technologies,
    relatedAchievements: achievements
      .filter((achievement) => achievement.project_id === seed.id)
      .map((achievement) => ({ id: achievement.id, title: achievement.title })),
    repoUrl: seed.repo_url,
    demoUrl: seed.demo_url,
  }));

  return (
    <GroveView
      displayName={displayName}
      initials={initials}
      profileFields={profileFields}
      strength={{ completed: 0, total: 0, items: [] }}
      featuredSeeds={featuredSeeds}
      skills={skills}
      achievementHighlights={achievementHighlights}
      isOwner={false}
      isFreshGrove={false}
      isPreview={false}
      onTogglePreview={() => {}}
      onShare={() => {}}
      editOpen={false}
      onOpenEdit={() => {}}
      onCloseEdit={() => {}}
      onSaveProfile={async () => {}}
      onEditProfessionalDetails={() => {}}
      readOnlyProfile
      toast={null}
    />
  );
}
