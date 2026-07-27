// Display-only shapes the Grove page renders. Real identity (name, email,
// avatar initials) always comes from Supabase auth/profile — never from
// here. These types cover the extra, Grove-specific fields the user fills
// in themselves (see lib/groveProfile.ts) plus data derived from published
// Seeds/achievements (see lib/groveSkills.ts).

import type { LifecycleStatus } from "./seed";

export interface OpportunitiesInfo {
  openToOpportunities: boolean;
  rolesOfInterest: string;
  workMode: string;
  collaborationInterests: string;
  contactVisible: boolean;
  contactEmail: string;
}

// Repeatable Profile entries (Professional Profile section) — stored as
// jsonb arrays on candidate_profiles (see supabase/candidate_settings.sql);
// `id` is a client-generated uuid used for React keys and edit/delete
// targeting within the array, never a separate DB row of its own.
export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  description: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  description: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expirationDate: string;
  credentialUrl: string;
}

// The candidate-editable form/draft shape — camelCase per this file's
// convention for display/edit shapes. Backed by the candidate_profiles
// Postgres table (see supabase/candidate_profiles.sql,
// supabase/candidate_settings.sql, and state/candidateProfileStore.ts),
// not localStorage — see candidate_profiles.sql's header comment for the
// migration this replaced.
//
// This is the single source of truth for everything Grove displays
// except Evidence & Achievements, Projects, and Skills (which are
// derived from published Achievements/Seeds instead) — edited
// exclusively on the Profile page (see pages/CandidateProfile.tsx),
// never on Grove itself, which only ever renders it read-only.
//
// professionalSkills is manually curated by the candidate for recruiter
// readability ONLY — see CandidateProfile.tsx's header comment. It is
// never read by the semantic matching engine (match-candidates /
// match-jobs-for-candidate), which continues to rely solely on published
// Achievements plus the rolesOfInterest/areasOfInterest fields already
// on this type.
export interface GroveProfileFields {
  avatarUrl: string;
  headline: string;
  // The candidate's own narrative: who they are, what they specialize
  // in, the technologies/domains they work in, and what they're looking
  // for. Rendered as Grove's About section — the DB column backing this
  // is still named `bio` (see candidateProfileStore.ts), kept for now to
  // avoid an unnecessary migration.
  professionalSummary: string;
  location: string;
  availability: string;
  // Small supporting metadata shown alongside the professional summary
  // on Grove, not the main content — the DB column backing this is
  // still named `about_interests`.
  areasOfInterest: string;
  opportunities: OpportunitiesInfo;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  certifications: CertificationEntry[];
  professionalSkills: string[];
  workAuthorization: string;
  requiresSponsorship: boolean;
  preferredJobTypes: string[];
  preferredLocations: string[];
  availabilityDate: string;
  yearsOfExperience: string;
  resumeUrl: string;
  resumeVisible: boolean;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  websiteUrl: string;
}

// Mirrors the candidate_profiles Postgres table verbatim (snake_case) —
// the candidate's own, fully-editable copy. Only ever read/written for
// the authenticated candidate's own row (RLS is own-row-only); cross-
// candidate reads always go through CandidateProfilePublic instead.
export interface CandidateProfileRow {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
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
  education: EducationEntry[];
  experience: ExperienceEntry[];
  certifications: CertificationEntry[];
  professional_skills: string[];
  work_authorization: string;
  requires_sponsorship: boolean;
  preferred_job_types: string[];
  preferred_locations: string[];
  availability_date: string | null;
  years_of_experience: string;
  resume_url: string | null;
  resume_visible: boolean;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

// Mirrors the candidate_profiles_public VIEW verbatim — what recruiters
// (and any other authenticated user) actually read. contact_email/
// resume_url come back null here whenever the candidate hasn't opted
// into contact_visible/resume_visible respectively; that redaction
// happens in the view's own SQL, not in this type or any component that
// reads it.
export interface CandidateProfilePublic {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
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
  education: EducationEntry[];
  experience: ExperienceEntry[];
  certifications: CertificationEntry[];
  professional_skills: string[];
  work_authorization: string;
  requires_sponsorship: boolean;
  preferred_job_types: string[];
  preferred_locations: string[];
  availability_date: string | null;
  years_of_experience: string;
  resume_visible: boolean;
  resume_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  website_url: string | null;
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

export interface RelatedAchievement {
  id: string;
  title: string;
}

export interface FeaturedSeedCard {
  id: string;
  title: string;
  description: string;
  status: string;
  // Optional — the owner's own Grove (sourced from the local Seed record)
  // always has this; a recruiter viewing a published Seed does not, since
  // grove_seeds deliberately doesn't mirror the private progress field.
  progress: number | null;
  lifecycleStatus: LifecycleStatus;
  technologies: string[];
  relatedAchievements: RelatedAchievement[];
  repoUrl: string | null;
  demoUrl: string | null;
}

export interface SkillSupportingAchievement {
  id: string;
  title: string;
  shortDescription: string;
  seedId: string;
  seedTitle: string;
  technologiesUsed: string[];
  proofUrl: string | null;
  proofLabel: string | null;
}

// Confidence here is always evidence-derived, never a self-rating — see
// deriveSkillsFromAchievements (lib/groveSkills.ts). projectCount is the
// number of distinct Seeds among supportingAchievements (dedup'd there,
// not recomputed by every consumer); technologies is the union of every
// supporting achievement's technologiesUsed, for the Skill drawer's
// "Technologies connected to this skill" section.
export interface SkillSummary {
  skill: string;
  achievementCount: number;
  projectCount: number;
  technologies: string[];
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

// Mirrors the grove_seeds Postgres table verbatim (snake_case, same
// convention as PublishedAchievement above). Presence of a row here
// already means "published" — see supabase/grove_seeds.sql's header
// comment for why this table exists at all (Seeds otherwise live only in
// the candidate's own localStorage, unreadable by anyone else).
export interface PublishedSeed {
  id: string;
  candidate_id: string;
  title: string;
  description: string;
  technologies: string[];
  status: string;
  lifecycle_status: LifecycleStatus;
  repo_url: string | null;
  demo_url: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
}
