import { motion } from "framer-motion";
import ProfileIdentityCard from "./ProfileIdentityCard";
import GroveStrengthMeter from "./GroveStrengthMeter";
import FeaturedSeeds from "./FeaturedSeeds";
import DemonstratedSkills from "./DemonstratedSkills";
import AchievementHighlights from "./AchievementHighlights";
import GrowthTimeline from "./GrowthTimeline";
import AboutBuilder from "./AboutBuilder";
import ProfessionalDetails from "./ProfessionalDetails";
import OpportunitiesPanel from "./OpportunitiesPanel";
import GroveEmptyState from "./GroveEmptyState";
import EditGroveModal from "./EditGroveModal";
import type {
  GroveProfileFields,
  GroveStrength,
  FeaturedSeedCard,
  SkillSummary,
  AchievementHighlight,
  GrowthTimelineEntry,
} from "../../types/grove";

// Pure presentation — every prop is already-resolved data. pages/Grove.tsx
// is the only place that decides *how* that data is fetched (real user vs.
// demo account today; a future /grove/:username route would just supply a
// different loader and reuse this component unchanged, with isOwner=false).
interface GroveViewProps {
  displayName: string;
  initials: string;
  profileFields: GroveProfileFields;
  strength: GroveStrength;
  featuredSeeds: FeaturedSeedCard[];
  skills: SkillSummary[];
  achievementHighlights: AchievementHighlight[];
  timeline: GrowthTimelineEntry[];
  isOwner: boolean;
  isFreshGrove: boolean;
  isPreview: boolean;
  onTogglePreview: () => void;
  onShare: () => void;
  editOpen: boolean;
  onOpenEdit: () => void;
  onCloseEdit: () => void;
  onSaveProfile: (fields: GroveProfileFields) => Promise<void>;
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
  timeline,
  isOwner,
  isFreshGrove,
  isPreview,
  onTogglePreview,
  onShare,
  editOpen,
  onOpenEdit,
  onCloseEdit,
  onSaveProfile,
  readOnlyProfile,
  toast,
}: GroveViewProps) {
  const stats = [
    { label: "Published Achievements", value: achievementHighlights.length },
    { label: "Published Seeds", value: featuredSeeds.length },
    { label: "Demonstrated Skills", value: skills.length },
  ];

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
        headline={profileFields.headline}
        bio={profileFields.bio}
        location={profileFields.location}
        availability={profileFields.availability}
        stats={stats}
        isOwner={isOwner && !isPreview}
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
          <FeaturedSeeds seeds={featuredSeeds} />
          <DemonstratedSkills skills={skills} />
          <AchievementHighlights achievements={achievementHighlights} />
          <GrowthTimeline entries={timeline} />
          <AboutBuilder
            about={profileFields.about}
            isOwner={isOwner && !isPreview}
            onEdit={onOpenEdit}
          />
          <ProfessionalDetails
            fields={profileFields}
            isOwner={isOwner && !isPreview}
            onEdit={onOpenEdit}
          />
          <OpportunitiesPanel
            opportunities={profileFields.opportunities}
            isOwner={isOwner && !isPreview}
            onEdit={onOpenEdit}
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
