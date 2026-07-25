import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { isDemoAccount } from "../config/demoAccount";
import { getDisplayName } from "../lib/displayName";
import { getInitials } from "../lib/initials";
import {
  listSeeds,
  getPublishedSeeds,
  getPublicEvidenceForSeed,
  getSeedEvidence,
} from "../state/seedStore";
import {
  EMPTY_GROVE_PROFILE_FIELDS,
  loadGroveProfileFields,
  saveGroveProfileFields,
} from "../lib/groveProfile";
import { calculateGroveStrength } from "../lib/groveStrength";
import { deriveSkillsFromEvidence } from "../lib/groveSkills";
import type { PublicEvidenceWithSeed } from "../lib/groveSkills";
import { buildGrowthTimeline } from "../lib/groveTimeline";
import { timeAgo } from "../lib/dates";
import {
  demoGroveProfileFields,
  demoFeaturedSeeds,
  demoSkillSummaries,
  demoEvidenceHighlights,
  demoGrowthTimeline,
} from "../data/mockData";
import GroveView from "../components/grove/GroveView";
import type {
  EvidenceHighlight,
  FeaturedSeedCard,
  GroveProfileFields,
} from "../types/grove";

// Thin data-loading wrapper: this file's only job is deciding *what data*
// the authenticated user should see (real vs. demo account) and shaping it
// into GroveView's props. GroveView itself is pure presentation, so a
// future /grove/:username route can reuse it unchanged — it would just
// need a loader that resolves a Seed/evidence set by username instead of
// by the current session, and render with isOwner={false}.
export default function Grove() {
  const { user, profile } = useAuth();
  const [previewMode, setPreviewMode] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [profileFields, setProfileFields] = useState<GroveProfileFields>(
    () => (user ? loadGroveProfileFields(user.id) : EMPTY_GROVE_PROFILE_FIELDS),
  );

  if (!user) return null;
  // Captured as its own const so TS narrows it as non-null inside the
  // nested function declarations below (closures aren't narrowed by the
  // `if (!user) return null` guard above on their own).
  const currentUser = user;

  const isDemo = isDemoAccount(currentUser.email);
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

  function handleSaveProfile(next: GroveProfileFields) {
    saveGroveProfileFields(currentUser.id, next);
    setProfileFields(next);
    setEditOpen(false);
    showToast("Grove saved");
  }

  if (isDemo) {
    const strength = calculateGroveStrength({
      hasHeadlineOrBio: true,
      hasFirstSeed: true,
      hasEvidenceCaptured: true,
      hasFirstPublishedSeed: true,
      hasPublicEvidence: true,
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
        evidenceHighlights={demoEvidenceHighlights}
        timeline={demoGrowthTimeline}
        isOwner
        isFreshGrove={false}
        isPreview={previewMode}
        onTogglePreview={() => setPreviewMode((v) => !v)}
        onShare={handleShare}
        editOpen={editOpen}
        onOpenEdit={() => setEditOpen(true)}
        onCloseEdit={() => setEditOpen(false)}
        onSaveProfile={handleSaveProfile}
        readOnlyProfile
        toast={toast}
      />
    );
  }

  const allSeeds = listSeeds(currentUser.id);
  const publishedSeeds = getPublishedSeeds(currentUser.id);

  const evidenceWithSeed: PublicEvidenceWithSeed[] = publishedSeeds.flatMap(
    (seed) =>
      getPublicEvidenceForSeed(currentUser.id, seed.id).map((evidence) => ({
        evidence,
        seed,
      })),
  );

  const featuredSeeds: FeaturedSeedCard[] = publishedSeeds.map((seed) => {
    const seedEvidence = evidenceWithSeed.filter(
      (item) => item.seed.id === seed.id,
    );
    return {
      id: seed.id,
      title: seed.title,
      description: seed.description,
      status: seed.status,
      progress: seed.progress,
      skills: Array.from(
        new Set(seedEvidence.map((item) => item.evidence.category)),
      ),
      evidenceCount: seedEvidence.length,
    };
  });

  const skills = deriveSkillsFromEvidence(evidenceWithSeed);

  const evidenceHighlights: EvidenceHighlight[] = evidenceWithSeed
    .slice()
    .sort(
      (a, b) =>
        new Date(b.evidence.publishedAt ?? b.evidence.createdAt).getTime() -
        new Date(a.evidence.publishedAt ?? a.evidence.createdAt).getTime(),
    )
    .map(({ evidence, seed }) => ({
      id: evidence.id,
      title: evidence.title,
      description: evidence.description,
      seedTitle: seed.title,
      seedId: seed.id,
      date: timeAgo(evidence.publishedAt ?? evidence.createdAt),
      skill: evidence.category,
      visibility: "public",
    }));

  const timeline = buildGrowthTimeline(publishedSeeds, evidenceWithSeed);

  const hasHeadlineOrBio = Boolean(
    profileFields.headline.trim() || profileFields.bio.trim(),
  );
  const hasAboutSection = Boolean(
    profileFields.about.enjoys.trim() ||
      profileFields.about.interests.trim() ||
      profileFields.about.direction.trim() ||
      profileFields.about.technologies.trim(),
  );
  const hasEvidenceCaptured = allSeeds.some(
    (seed) => getSeedEvidence(currentUser.id, seed.id).length > 0,
  );

  const strength = calculateGroveStrength({
    hasHeadlineOrBio,
    hasFirstSeed: allSeeds.length > 0,
    hasEvidenceCaptured,
    hasFirstPublishedSeed: publishedSeeds.length > 0,
    hasPublicEvidence: evidenceWithSeed.length > 0,
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
      evidenceHighlights={evidenceHighlights}
      timeline={timeline}
      isOwner
      isFreshGrove={isFreshGrove}
      isPreview={previewMode}
      onTogglePreview={() => setPreviewMode((v) => !v)}
      onShare={handleShare}
      editOpen={editOpen}
      onOpenEdit={() => setEditOpen(true)}
      onCloseEdit={() => setEditOpen(false)}
      onSaveProfile={handleSaveProfile}
      readOnlyProfile={false}
      toast={toast}
    />
  );
}
