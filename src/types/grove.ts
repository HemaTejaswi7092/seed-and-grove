// Display-only shapes the Grove page renders. Real identity (name, email,
// avatar initials) always comes from Supabase auth/profile — never from
// here. These types cover the extra, Grove-specific fields the user fills
// in themselves (see lib/groveProfile.ts) plus data derived from published
// Seeds/achievements (see lib/groveSkills.ts, lib/groveTimeline.ts).

import type { LifecycleStatus } from "./seed";

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

// The candidate-editable form/draft shape — camelCase per this file's
// convention for display/edit shapes. Backed by the candidate_profiles
// Postgres table (see supabase/candidate_profiles.sql and
// state/candidateProfileStore.ts), not localStorage — see that SQL
// file's header comment for the migration this replaced.
export interface GroveProfileFields {
  headline: string;
  bio: string;
  location: string;
  availability: string;
  about: AboutBuilder;
  opportunities: OpportunitiesInfo;
  education: string;
  experience: string;
  workAuthorization: string;
  resumeUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
}

// Mirrors the candidate_profiles Postgres table verbatim (snake_case) —
// the candidate's own, fully-editable copy. Only ever read/written for
// the authenticated candidate's own row (RLS is own-row-only); cross-
// candidate reads always go through CandidateProfilePublic instead.
export interface CandidateProfileRow {
  user_id: string;
  full_name: string;
  headline: string;
  bio: string;
  location: string;
  availability: string;
  about_enjoys: string;
  about_interests: string;
  about_direction: string;
  about_technologies: string;
  open_to_opportunities: boolean;
  roles_of_interest: string;
  work_mode: string;
  collaboration_interests: string;
  contact_visible: boolean;
  contact_email: string;
  education: string;
  experience: string;
  work_authorization: string;
  resume_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  created_at: string;
  updated_at: string;
}

// Mirrors the candidate_profiles_public VIEW verbatim — what recruiters
// (and any other authenticated user) actually read. contact_email/
// resume_url come back null here whenever the candidate hasn't opted
// into contact_visible; that redaction happens in the view's own SQL,
// not in this type or any component that reads it.
export interface CandidateProfilePublic {
  user_id: string;
  full_name: string;
  headline: string;
  bio: string;
  location: string;
  availability: string;
  about_enjoys: string;
  about_interests: string;
  about_direction: string;
  about_technologies: string;
  open_to_opportunities: boolean;
  roles_of_interest: string;
  work_mode: string;
  collaboration_interests: string;
  contact_visible: boolean;
  contact_email: string | null;
  education: string;
  experience: string;
  work_authorization: string;
  resume_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  created_at: string;
  updated_at: string;
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
  lifecycleStatus: LifecycleStatus;
  skills: string[];
  achievementCount: number;
}

export interface SkillSupportingAchievement {
  title: string;
  seedTitle: string;
}

export interface SkillSummary {
  skill: string;
  achievementCount: number;
  supportingAchievements: SkillSupportingAchievement[];
}

// Mirrors the grove_achievements Postgres table verbatim (snake_case,
// matching the codebase's convention of Postgres-backed types tracking
// their columns exactly — see AGENTS/CLAUDE notes on this). Presence of a
// row in that table already means "published": there is no separate
// visibility column there, since a private achievement is never written
// to Postgres in the first place (see state/achievements.ts).
export interface PublishedAchievement {
  id: string;
  candidate_id: string;
  project_id: string;
  title: string;
  short_description: string;
  achievement_type: string;
  skills_demonstrated: string[];
  technologies_used: string[];
  project_domain: string;
  candidate_contribution: string;
  outcome_or_impact: string;
  proof_url: string | null;
  proof_label: string | null;
  relevant_roles: string[];
  verification_status: string | null;
  created_at: string;
  updated_at: string;
}

// Grove's display shape — a PublishedAchievement joined with its parent
// Seed's title, camelCased like every other display-only type in this
// file (see the header comment).
export interface AchievementHighlight {
  id: string;
  seedId: string;
  seedTitle: string;
  title: string;
  shortDescription: string;
  achievementType: string;
  skillsDemonstrated: string[];
  technologiesUsed: string[];
  candidateContribution: string;
  outcomeOrImpact: string;
  proofUrl: string | null;
  proofLabel: string | null;
  relevantRoles: string[];
  date: string;
}

export type GrowthTimelineEntryType =
  | "seed_published"
  | "seed_completed"
  | "achievement_published"
  | "skill_demonstrated";

export interface GrowthTimelineEntry {
  id: string;
  type: GrowthTimelineEntryType;
  title: string;
  date: string;
  sortKey: number;
}
