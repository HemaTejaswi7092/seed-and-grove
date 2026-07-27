import { useState } from "react";
import { motion } from "framer-motion";
import ProfileIdentityCard from "./ProfileIdentityCard";
import GroveStrengthMeter from "./GroveStrengthMeter";
import FeaturedSeeds from "./FeaturedSeeds";
import VerifiedSkills from "./VerifiedSkills";
import About from "./About";
import ProfessionalDetails from "./ProfessionalDetails";
import GroveEmptyState from "./GroveEmptyState";
import type {
  GroveProfileFields,
  GroveStrength,
  FeaturedSeedCard,
  SkillSummary,
  AchievementHighlight,
} from "../../types/grove";

// Pure presentation — every prop is already-resolved data. pages/Grove.tsx
// (owner) and pages/RecruiterCandidateProfile.tsx (isOwner=false) are the
// only two places that decide *how* that data is fetched; both render
// this same component so the two views can never drift apart again.
//
// Section order answers, in order: who is this person (identity/about) →
// what have they built (projects) → their professional/educational
// background. Evidence & Achievements is no longer its own top-level
// section — every published achievement is grouped under the project it
// belongs to (see FeaturedSeeds.tsx / ProjectDetailModal.tsx), reachable
// by clicking "View Project," rather than repeated as a second, parallel
// wall of cards disconnected from the project it's evidence for.
//
// Grove is read-only, full stop — it never edits or saves profileFields
// itself. The Profile page (see pages/CandidateProfile.tsx) is the single
// source of truth and the only place any of this gets edited; every
// owner-facing "Edit" affordance here is a plain link to /profile, not a
// local form.
interface GroveViewProps {
  displayName: string;
  initials: string;
  profileFields: GroveProfileFields;
  strength: GroveStrength;
  featuredSeeds: FeaturedSeedCard[];
  skills: SkillSummary[];
  achievementHighlights: AchievementHighlight[];
  isOwner: boolean;
  isFreshGrove: boolean;
  isPreview: boolean;
  onTogglePreview: () => void;
  onShare: () => void;
  toast: string | null;
}

export default function GroveView({
  displayName,
  initials,
  profileFields,
  strength,
  featuredSeeds,
  skills,
  achievementHighlights,
  isOwner,
  isFreshGrove,
  isPreview,
  onTogglePreview,
  onShare,
  toast,
}: GroveViewProps) {
  const stats = [
    { label: "Published Achievements", value: achievementHighlights.length },
    { label: "Published Seeds", value: featuredSeeds.length },
    { label: "Verified Skills", value: skills.length },
  ];
  const showOwnerControls = isOwner && !isPreview;
  // The single source of truth for "which skill's evidence is currently
  // highlighted" — shared between VerifiedSkills (which sets it, and
  // shows the matching pill as active + opens its drawer) and
  // FeaturedSeeds (which highlights/dims project cards, and threads it
  // into any currently-open project's achievement cards) so the two
  // sections never fall out of sync with each other.
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  return (
    <main
      className={[
        "mx-auto w-full max-w-5xl px-6 py-12 transition-[padding] duration-300 ease-out",
        // Reflows the whole page away from SkillDrawer's footprint while
        // it's open (see SkillDrawer.tsx — it deliberately has no
        // blocking backdrop) instead of letting the two silently
        // overlap: without this, a project card positioned under the
        // drawer's right-docked panel would be visually fine but
        // physically unclickable on anything narrower than a very wide
        // window, since the drawer's own content still captures clicks
        // wherever it actually sits on screen.
        selectedSkill !== null ? "pr-[28rem]" : "",
      ].join(" ")}
    >
      {isPreview && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-accent-soft-border bg-accent-soft px-4 py-2.5 text-sm text-accent-dark">
          <span>You&apos;re viewing your Grove as the public would see it.</span>
          <button
            type="button"
            onClick={onTogglePreview}
            className="font-medium underline-offset-2 hover:underline"
          >
            Exit preview
          </button>
        </div>
      )}

      <ProfileIdentityCard
        displayName={displayName}
        initials={initials}
        avatarUrl={profileFields.avatarUrl}
        headline={profileFields.headline}
        location={profileFields.location}
        availability={profileFields.availability}
        stats={stats}
        openToOpportunities={profileFields.opportunities.openToOpportunities}
        workMode={profileFields.opportunities.workMode}
        contactVisible={profileFields.opportunities.contactVisible}
        contactEmail={profileFields.opportunities.contactEmail}
        resumeUrl={profileFields.resumeUrl}
        linkedinUrl={profileFields.linkedinUrl}
        githubUrl={profileFields.githubUrl}
        portfolioUrl={profileFields.portfolioUrl}
        websiteUrl={profileFields.websiteUrl}
        isOwner={showOwnerControls}
        isPreview={isPreview}
        onTogglePreview={onTogglePreview}
        onShare={onShare}
      />

      {isOwner && !isPreview && (
        <div className="mt-6">
          <GroveStrengthMeter strength={strength} />
        </div>
      )}

      {isFreshGrove ? (
        <div className="mt-8">
          <GroveEmptyState isOwner={showOwnerControls} onPreview={onTogglePreview} />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          className="mt-10 space-y-10"
        >
          <About
            professionalSummary={profileFields.professionalSummary}
            areasOfInterest={profileFields.areasOfInterest}
            isOwner={showOwnerControls}
          />

          <div className="space-y-6">
            <FeaturedSeeds
              seeds={featuredSeeds}
              achievementHighlights={achievementHighlights}
              isOwner={showOwnerControls}
              selectedSkill={selectedSkill}
            />
            <VerifiedSkills
              skills={skills}
              selectedSkill={selectedSkill}
              onSelectSkill={setSelectedSkill}
            />
          </div>

          <ProfessionalDetails
            fields={{
              education: profileFields.education,
              experience: profileFields.experience,
              certifications: profileFields.certifications,
              workAuthorization: profileFields.workAuthorization,
              requiresSponsorship: profileFields.requiresSponsorship,
              rolesOfInterest: profileFields.opportunities.rolesOfInterest,
              collaborationInterests: profileFields.opportunities.collaborationInterests,
            }}
            isOwner={showOwnerControls}
          />
        </motion.div>
      )}

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2.5 text-sm text-white shadow-lg"
        >
          {toast}
        </motion.div>
      )}
    </main>
  );
}
