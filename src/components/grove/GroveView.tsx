import { motion } from "framer-motion";
import ProfileIdentityCard from "./ProfileIdentityCard";
import GroveStrengthMeter from "./GroveStrengthMeter";
import FeaturedSeeds from "./FeaturedSeeds";
import DemonstratedSkills from "./DemonstratedSkills";
import AchievementHighlights from "./AchievementHighlights";
import AboutBuilder from "./AboutBuilder";
import ProfessionalDetails from "./ProfessionalDetails";
import GroveEmptyState from "./GroveEmptyState";
import EditGroveModal from "./EditGroveModal";
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
// can they actually do the work (evidence & achievements) → what have
// they built and with what (projects & skills) → their professional/
// educational background. Evidence is deliberately the first thing after
// identity, not buried mid-page — it's Grove's actual differentiator from
// a LinkedIn-style resume page or a raw GitHub profile.
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
  editOpen: boolean;
  onOpenEdit: () => void;
  onCloseEdit: () => void;
  onSaveProfile: (fields: GroveProfileFields) => Promise<void>;
  // Education/experience/certifications/professional skills moved to
  // Settings — its own "Edit"/"Add details" affordance navigates there
  // instead of opening EditGroveModal, which no longer has fields for any
  // of it.
  onEditProfessionalDetails: () => void;
  readOnlyProfile: boolean;
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
  editOpen,
  onOpenEdit,
  onCloseEdit,
  onSaveProfile,
  onEditProfessionalDetails,
  readOnlyProfile,
  toast,
}: GroveViewProps) {
  const stats = [
    { label: "Published Achievements", value: achievementHighlights.length },
    { label: "Published Seeds", value: featuredSeeds.length },
    { label: "Demonstrated Skills", value: skills.length },
  ];
  const showOwnerControls = isOwner && !isPreview;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
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
        bio={profileFields.bio}
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
        onEdit={onOpenEdit}
      />

      {isOwner && !isPreview && (
        <div className="mt-6">
          <GroveStrengthMeter strength={strength} />
        </div>
      )}

      {isFreshGrove ? (
        <div className="mt-8">
          <GroveEmptyState onEdit={onOpenEdit} onPreview={onTogglePreview} />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          className="mt-10 space-y-10"
        >
          <AboutBuilder
            about={profileFields.about}
            isOwner={showOwnerControls}
            onEdit={onOpenEdit}
          />

          <AchievementHighlights achievements={achievementHighlights} />

          <div className="space-y-6">
            <FeaturedSeeds seeds={featuredSeeds} isOwner={showOwnerControls} />
            <DemonstratedSkills skills={skills} />
          </div>

          <ProfessionalDetails
            fields={{
              education: profileFields.education,
              experience: profileFields.experience,
              certifications: profileFields.certifications,
              professionalSkills: profileFields.professionalSkills,
              workAuthorization: profileFields.workAuthorization,
              requiresSponsorship: profileFields.requiresSponsorship,
              rolesOfInterest: profileFields.opportunities.rolesOfInterest,
              collaborationInterests: profileFields.opportunities.collaborationInterests,
            }}
            isOwner={showOwnerControls}
            onEditInSettings={onEditProfessionalDetails}
            onEditPreferences={onOpenEdit}
          />
        </motion.div>
      )}

      {isOwner && !readOnlyProfile && editOpen && (
        <EditGroveModal
          fields={profileFields}
          onClose={onCloseEdit}
          onSave={onSaveProfile}
        />
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
