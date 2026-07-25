// Display-only shapes the Grove page renders. Real identity (name, email,
// avatar initials) always comes from Supabase auth/profile — never from
// here. These types cover the extra, Grove-specific fields the user fills
// in themselves (see lib/groveProfile.ts) plus data derived from published
// Seeds/evidence (see lib/groveSkills.ts, lib/groveTimeline.ts).

export interface AboutBuilder {
  enjoys: string;
  interests: string;
  direction: string;
  technologies: string;
}

export interface OpportunitiesInfo {
  openToOpportunities: boolean;
  rolesOfInterest: string;
  workMode: string;
  collaborationInterests: string;
  contactVisible: boolean;
  contactEmail: string;
}

// Shaped to mirror the columns this will eventually become on the
// `profiles` table in Supabase — see lib/groveProfile.ts for the migration
// note. Nothing here duplicates real profile fields (full_name etc).
export interface GroveProfileFields {
  headline: string;
  bio: string;
  location: string;
  availability: string;
  about: AboutBuilder;
  opportunities: OpportunitiesInfo;
}

export interface GroveStrengthItem {
  key: string;
  label: string;
  done: boolean;
}

export interface GroveStrength {
  completed: number;
  total: number;
  items: GroveStrengthItem[];
}

export interface FeaturedSeedCard {
  id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  skills: string[];
  evidenceCount: number;
}

export interface SkillSupportingEvidence {
  title: string;
  seedTitle: string;
}

export interface SkillSummary {
  skill: string;
  evidenceCount: number;
  supportingEvidence: SkillSupportingEvidence[];
}

export interface EvidenceHighlight {
  id: string;
  title: string;
  description: string;
  seedTitle: string;
  seedId: string;
  date: string;
  skill: string;
  visibility: "public";
}

export type GrowthTimelineEntryType =
  | "seed_published"
  | "seed_completed"
  | "evidence_published"
  | "skill_demonstrated";

export interface GrowthTimelineEntry {
  id: string;
  type: GrowthTimelineEntryType;
  title: string;
  date: string;
  sortKey: number;
}
