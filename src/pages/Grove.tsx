import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { isDemoAccount } from "../config/demoAccount";
import { getDisplayName } from "../lib/displayName";
import { getInitials } from "../lib/initials";
import { listSeeds, getPublishedSeeds, getSeedAchievements } from "../state/seedStore";
import { listPublishedAchievements } from "../state/groveAchievementsStore";
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
} from "../types/grove";

// Thin data-loading wrapper: this file's only job is deciding *what data*
// the authenticated user should see (real vs. demo account) and shaping it
// into GroveView's props. GroveView itself is pure presentation, so a
// future /grove/:username route can reuse it unchanged — it would just
// need a loader that resolves a Seed/achievement set by username instead
// of by the current session, and render with isOwner={false}.
export default function Grove() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [previewMode, setPreviewMode] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function goToSettings() {
    navigate("/settings");
  }

  const isDemo = !!user && isDemoAccount(user.email);

  // Both Published Achievements and the candidate's own profile fields
  // now live in Postgres (grove_achievements / candidate_profiles — see
  // supabase/candidate_profiles.sql), not localStorage. Fetched fresh on
  // every visit; routed through .then()/.catch() so no setState call is
  // ever reached synchronously in the effect body itself (same pattern
  // as useRecruiterProfile.ts).
  const [publishedAchievements, setPublishedAchievements] = useState<
    PublishedAchievement[] | null
  >(null);
  const [profileFields, setProfileFields] = useState<GroveProfileFields | null>(
    null,
  );

  useEffect(() => {
    if (!user || isDemo) return;
    let cancelled = false;
    listPublishedAchievements(user.id)
      .then((rows) => {
        if (!cancelled) setPublishedAchievements(rows);
      })
      .catch(() => {
        if (!cancelled) setPublishedAchievements([]);
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

  // Left to throw on failure — EditGroveModal's own submit handler
  // catches it, shows the error inline, and keeps the modal open, so a
  // failed save never reads as a silent success.
  async function handleSaveProfile(next: GroveProfileFields) {
    await saveCandidateProfile(currentUser.id, displayName, next);
    setProfileFields(next);
    setEditOpen(false);
    showToast("Grove saved");
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
        editOpen={editOpen}
        onOpenEdit={() => setEditOpen(true)}
        onCloseEdit={() => setEditOpen(false)}
        onSaveProfile={handleSaveProfile}
        onEditProfessionalDetails={goToSettings}
        readOnlyProfile
        toast={toast}
      />
    );
  }

  if (publishedAchievements === null || profileFields === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="flex h-10 w-10 animate-pulse items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Sprout className="h-5 w-5" strokeWidth={2.25} />
        </span>
      </div>
    );
  }

  const allSeeds = listSeeds(currentUser.id);
  const publishedSeeds = getPublishedSeeds(currentUser.id);
  const seedById = new Map(allSeeds.map((seed) => [seed.id, seed]));

  const achievementsWithSeed: PublishedAchievementWithSeed[] = publishedAchievements
    .map((achievement) => {
      const seed = seedById.get(achievement.project_id);
      return seed ? { achievement, seed: { id: seed.id, title: seed.title } } : null;
    })
    .filter((item): item is PublishedAchievementWithSeed => item !== null);

  const featuredSeeds: FeaturedSeedCard[] = publishedSeeds.map((seed) => {
    const seedAchievements = achievementsWithSeed.filter(
      (item) => item.seed.id === seed.id,
    );
    return {
      id: seed.id,
      title: seed.title,
      description: seed.description,
      status: seed.status,
      progress: seed.progress,
      lifecycleStatus: seed.lifecycleStatus,
      technologies: seed.technologies,
      relatedAchievements: seedAchievements.map((item) => ({
        id: item.achievement.id,
        title: item.achievement.title,
      })),
      repoUrl: seed.repoUrl || null,
      demoUrl: seed.demoUrl || null,
    };
  });

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
    profileFields.headline.trim() || profileFields.bio.trim(),
  );
  const hasAboutSection = Boolean(
    profileFields.about.enjoys.trim() ||
      profileFields.about.interests.trim() ||
      profileFields.about.direction.trim() ||
      profileFields.about.technologies.trim(),
  );
  const hasAchievementCaptured = allSeeds.some(
    (seed) => getSeedAchievements(currentUser.id, seed.id).length > 0,
  );

  const strength = calculateGroveStrength({
    hasHeadlineOrBio,
    hasFirstSeed: allSeeds.length > 0,
    hasAchievementCaptured,
    hasFirstPublishedSeed: publishedSeeds.length > 0,
    hasPublishedAchievement: achievementsWithSeed.length > 0,
    hasAboutSection,
  });

  const isFreshGrove = allSeeds.length === 0 && !hasHeadlineOrBio;

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
      editOpen={editOpen}
      onOpenEdit={() => setEditOpen(true)}
      onCloseEdit={() => setEditOpen(false)}
      onSaveProfile={handleSaveProfile}
      onEditProfessionalDetails={goToSettings}
      readOnlyProfile={false}
      toast={toast}
    />
  );
}
