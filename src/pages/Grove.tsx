import { useEffect, useState } from "react";
import { Sprout } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { isDemoAccount } from "../config/demoAccount";
import { getDisplayName } from "../lib/displayName";
import { getInitials } from "../lib/initials";
import { listSeeds, getSeedAchievements } from "../state/seedStore";
import { listPublishedAchievements } from "../state/groveAchievementsStore";
import { listPublishedSeeds } from "../state/groveSeedsStore";
import {
  getCandidateProfile,
  saveCandidateProfile,
  candidateRowToFields,
} from "../state/candidateProfileStore";
import {
  EMPTY_GROVE_PROFILE_FIELDS,
  loadLegacyGroveProfileFields,
  clearLegacyGroveProfileFields,
  isGroveProfileFieldsEmpty,
} from "../lib/groveProfile";
import { calculateGroveStrength } from "../lib/groveStrength";
import { deriveSkillsFromAchievements } from "../lib/groveSkills";
import type { PublishedAchievementWithSeed } from "../lib/groveSkills";
import { timeAgo } from "../lib/dates";
import {
  demoGroveProfileFields,
  demoFeaturedSeeds,
  demoSkillSummaries,
  demoAchievementHighlights,
} from "../data/mockData";
import GroveView from "../components/grove/GroveView";
import type {
  AchievementHighlight,
  FeaturedSeedCard,
  GroveProfileFields,
  PublishedAchievement,
  PublishedSeed,
} from "../types/grove";

// Thin data-loading wrapper: this file's only job is deciding *what data*
// the authenticated user should see (real vs. demo account) and shaping it
// into GroveView's props. GroveView itself is pure presentation and
// strictly read-only — Grove.tsx has no save/edit path of its own; the
// Profile page (see pages/CandidateProfile.tsx) is the only place
// profileFields is ever written, aside from the one-time legacy
// migration below. A future /grove/:username route can reuse GroveView
// unchanged — it would just need a loader that resolves a Seed/
// achievement set by username instead of by the current session, and
// render with isOwner={false}.
//
// Featured Seeds and the achievement/seed join are sourced from
// grove_seeds/grove_achievements (Postgres), not the local Seed record —
// mirrors RecruiterCandidateProfile.tsx's read exactly, which is what
// every other viewer of this candidate's Grove already sees. This is a
// cross-device correctness fix: the local Seed record only ever exists in
// the browser that created it (see state/seedStore.ts's header comment),
// so building the owner's own Featured Seeds from it meant a second
// device signed into the same account saw an empty Grove even after
// publishing succeeded. `listSeeds`/`getSeedAchievements` below are used
// only for signals that are legitimately local/draft-only (e.g. "has this
// device drafted a Seed at all, published or not") — never for anything
// rendered as Grove content.
export default function Grove() {
  const { user, profile } = useAuth();
  const [previewMode, setPreviewMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isDemo = !!user && isDemoAccount(user.email);

  // Published Seeds/Achievements and the candidate's own profile fields
  // all live in Postgres (grove_seeds / grove_achievements /
  // candidate_profiles), not localStorage. Fetched fresh on every visit;
  // routed through .then()/.catch() so no setState call is ever reached
  // synchronously in the effect body itself (same pattern as
  // useRecruiterProfile.ts).
  const [publishedAchievements, setPublishedAchievements] = useState<
    PublishedAchievement[] | null
  >(null);
  const [publishedSeeds, setPublishedSeeds] = useState<PublishedSeed[] | null>(null);
  const [profileFields, setProfileFields] = useState<GroveProfileFields | null>(
    null,
  );

  useEffect(() => {
    if (!user || isDemo) return;
    let cancelled = false;
    Promise.all([listPublishedAchievements(user.id), listPublishedSeeds(user.id)])
      .then(([achievementRows, seedRows]) => {
        if (cancelled) return;
        setPublishedAchievements(achievementRows);
        setPublishedSeeds(seedRows);
      })
      .catch(() => {
        if (cancelled) return;
        setPublishedAchievements([]);
        setPublishedSeeds([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isDemo]);

  useEffect(() => {
    if (!user || isDemo) return;
    let cancelled = false;

    getCandidateProfile(user.id)
      .then(async (row) => {
        if (row) return candidateRowToFields(row);

        // No Postgres row yet — one-time migration of whatever this
        // candidate had saved locally before candidate_profiles existed.
        // Never runs again once migrated (the legacy key is cleared).
        const legacy = loadLegacyGroveProfileFields(user.id);
        if (legacy && !isGroveProfileFieldsEmpty(legacy)) {
          const fullName = getDisplayName(user, profile) || "";
          await saveCandidateProfile(user.id, fullName, legacy);
          clearLegacyGroveProfileFields(user.id);
          return legacy;
        }
        return EMPTY_GROVE_PROFILE_FIELDS;
      })
      .then((fields) => {
        if (!cancelled) setProfileFields(fields);
      })
      .catch(() => {
        if (!cancelled) setProfileFields(EMPTY_GROVE_PROFILE_FIELDS);
      });

    return () => {
      cancelled = true;
    };
    // profile is read only inside the migration branch, above — omitted
    // from deps so a profile refresh elsewhere doesn't re-trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isDemo]);

  if (!user) return null;
  // Captured as its own const so TS narrows it as non-null inside the
  // nested function declarations below (closures aren't narrowed by the
  // `if (!user) return null` guard above on their own).
  const currentUser = user;

  const displayName = getDisplayName(currentUser, profile) || "Your name";
  const initials = getInitials(displayName);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  function handleShare() {
    const url = `${window.location.origin}/grove`;
    navigator.clipboard
      .writeText(url)
      .then(() => showToast("Grove link copied to clipboard"))
      .catch(() => showToast("Couldn't copy link"));
  }

  if (isDemo) {
    const strength = calculateGroveStrength({
      hasHeadlineOrBio: true,
      hasFirstSeed: true,
      hasAchievementCaptured: true,
      hasFirstPublishedSeed: true,
      hasPublishedAchievement: true,
      hasAboutSection: true,
    });

    return (
      <GroveView
        displayName={displayName}
        initials={initials}
        profileFields={demoGroveProfileFields}
        strength={strength}
        featuredSeeds={demoFeaturedSeeds}
        skills={demoSkillSummaries}
        achievementHighlights={demoAchievementHighlights}
        isOwner
        isFreshGrove={false}
        isPreview={previewMode}
        onTogglePreview={() => setPreviewMode((v) => !v)}
        onShare={handleShare}
        toast={toast}
      />
    );
  }

  if (publishedAchievements === null || publishedSeeds === null || profileFields === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="flex h-10 w-10 animate-pulse items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Sprout className="h-5 w-5" strokeWidth={2.25} />
        </span>
      </div>
    );
  }

  // Local-only — used below strictly for draft-state signals (e.g. "has
  // this device drafted a Seed at all"), never for anything rendered as
  // Grove content. See this file's header comment.
  const allSeeds = listSeeds(currentUser.id);
  const seedById = new Map(publishedSeeds.map((seed) => [seed.id, seed]));

  // An achievement can be published without its parent Seed being
  // published (there's no dependency between the two) — when that
  // happens there's no grove_seeds row to join against, so this falls
  // back to the achievement's own project_domain rather than dropping
  // the achievement (same fallback RecruiterCandidateProfile.tsx uses).
  const achievementsWithSeed: PublishedAchievementWithSeed[] = publishedAchievements.map(
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

  const featuredSeeds: FeaturedSeedCard[] = publishedSeeds.map((seed) => ({
    id: seed.id,
    title: seed.title,
    description: seed.description,
    status: seed.status,
    // grove_seeds deliberately doesn't mirror the private progress field
    // — see types/grove.ts's FeaturedSeedCard comment. Previously this
    // read the local Seed's live progress %; that's no longer available
    // once Featured Seeds is sourced from Postgres (the fix for this
    // file's cross-device bug), so it's null here same as every other
    // (non-owner) viewer of this Grove already sees.
    progress: null,
    lifecycleStatus: seed.lifecycle_status,
    technologies: seed.technologies,
    relatedAchievements: publishedAchievements
      .filter((achievement) => achievement.project_id === seed.id)
      .map((achievement) => ({ id: achievement.id, title: achievement.title })),
    repoUrl: seed.repo_url,
    demoUrl: seed.demo_url,
  }));

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

  const hasHeadlineOrBio = Boolean(
    profileFields.headline.trim() || profileFields.professionalSummary.trim(),
  );
  const hasAboutSection = Boolean(profileFields.areasOfInterest.trim());
  // Local drafted-and-captured OR anything actually published — either is
  // real evidence of having captured an achievement, and only checking
  // the local (draft-only) side would wrongly read as "none" on a device
  // that never drafted anything but does have published Postgres content.
  const hasAchievementCaptured =
    allSeeds.some((seed) => getSeedAchievements(currentUser.id, seed.id).length > 0) ||
    achievementsWithSeed.length > 0;

  const strength = calculateGroveStrength({
    hasHeadlineOrBio,
    hasFirstSeed: allSeeds.length > 0 || publishedSeeds.length > 0,
    hasAchievementCaptured,
    hasFirstPublishedSeed: publishedSeeds.length > 0,
    hasPublishedAchievement: achievementsWithSeed.length > 0,
    hasAboutSection,
  });

  // Same reasoning as hasAchievementCaptured above — a device with no
  // local drafts but real published content is not a fresh Grove.
  const isFreshGrove =
    allSeeds.length === 0 &&
    publishedSeeds.length === 0 &&
    achievementsWithSeed.length === 0 &&
    !hasHeadlineOrBio;

  return (
    <GroveView
      displayName={displayName}
      initials={initials}
      profileFields={profileFields}
      strength={strength}
      featuredSeeds={featuredSeeds}
      skills={skills}
      achievementHighlights={achievementHighlights}
      isOwner
      isFreshGrove={isFreshGrove}
      isPreview={previewMode}
      onTogglePreview={() => setPreviewMode((v) => !v)}
      onShare={handleShare}
      toast={toast}
    />
  );
}
