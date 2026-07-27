import { supabase } from "../lib/supabase";
import type {
  CandidateProfilePublic,
  CandidateProfileRow,
  GroveProfileFields,
} from "../types/grove";

// Real Supabase Postgres, like feedStore.ts/groveAchievementsStore.ts —
// see supabase/candidate_profiles.sql. RLS (not this file) is what
// actually enforces ownership on the base table and redacts contact
// fields on the public view; userId here is always passed through from
// the authenticated caller, never inferred.

// Exported so CandidateProfile.tsx can build the same full snake_case
// payload and slice out just the columns one section owns, rather than
// re-deriving its own field mapping — see updateCandidateProfileFields
// below for why a per-section save still needs the FULL builder (just a
// subset of its keys), not a second, parallel mapper.
//
// `bio` and `about_interests` are deliberately unrenamed DB columns —
// they now back `professionalSummary`/`areasOfInterest` respectively
// (see types/grove.ts's GroveProfileFields comment). `about_enjoys`,
// `about_direction`, and `about_technologies` are no longer written by
// the app at all (dropped from GroveProfileFields); their columns are
// left in place, unused, rather than migrated away.
export function buildCandidateProfilePatch(
  userId: string,
  fullName: string,
  fields: GroveProfileFields,
) {
  return {
    user_id: userId,
    full_name: fullName,
    avatar_url: fields.avatarUrl.trim() || null,
    headline: fields.headline.trim(),
    bio: fields.professionalSummary.trim(),
    location: fields.location.trim(),
    availability: fields.availability.trim(),
    about_interests: fields.areasOfInterest.trim(),
    open_to_opportunities: fields.opportunities.openToOpportunities,
    roles_of_interest: fields.opportunities.rolesOfInterest.trim(),
    work_mode: fields.opportunities.workMode.trim(),
    collaboration_interests: fields.opportunities.collaborationInterests.trim(),
    contact_visible: fields.opportunities.contactVisible,
    contact_email: fields.opportunities.contactEmail.trim(),
    education: fields.education,
    experience: fields.experience,
    certifications: fields.certifications,
    professional_skills: fields.professionalSkills,
    work_authorization: fields.workAuthorization.trim(),
    requires_sponsorship: fields.requiresSponsorship,
    preferred_job_types: fields.preferredJobTypes,
    preferred_locations: fields.preferredLocations,
    availability_date: fields.availabilityDate.trim() || null,
    years_of_experience: fields.yearsOfExperience.trim(),
    resume_url: fields.resumeUrl.trim() || null,
    resume_visible: fields.resumeVisible,
    linkedin_url: fields.linkedinUrl.trim() || null,
    github_url: fields.githubUrl.trim() || null,
    portfolio_url: fields.portfolioUrl.trim() || null,
    website_url: fields.websiteUrl.trim() || null,
  };
}

// Shared by both the candidate's own edit form (reading the base table)
// and anywhere that reads the public view — same field mapping either way.
export function candidateRowToFields(
  row: CandidateProfileRow | CandidateProfilePublic,
): GroveProfileFields {
  return {
    avatarUrl: row.avatar_url ?? "",
    headline: row.headline,
    professionalSummary: row.bio,
    location: row.location,
    availability: row.availability,
    areasOfInterest: row.about_interests,
    opportunities: {
      openToOpportunities: row.open_to_opportunities,
      rolesOfInterest: row.roles_of_interest,
      workMode: row.work_mode,
      collaborationInterests: row.collaboration_interests,
      contactVisible: row.contact_visible,
      contactEmail: row.contact_email ?? "",
    },
    education: row.education,
    experience: row.experience,
    certifications: row.certifications,
    professionalSkills: row.professional_skills,
    workAuthorization: row.work_authorization,
    requiresSponsorship: row.requires_sponsorship,
    preferredJobTypes: row.preferred_job_types,
    preferredLocations: row.preferred_locations,
    availabilityDate: row.availability_date ?? "",
    yearsOfExperience: row.years_of_experience,
    resumeUrl: row.resume_url ?? "",
    resumeVisible: row.resume_visible,
    linkedinUrl: row.linkedin_url ?? "",
    githubUrl: row.github_url ?? "",
    portfolioUrl: row.portfolio_url ?? "",
    websiteUrl: row.website_url ?? "",
  };
}

export async function getCandidateProfile(
  userId: string,
): Promise<CandidateProfileRow | null> {
  const { data, error } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as CandidateProfileRow | null) ?? null;
}

export async function saveCandidateProfile(
  userId: string,
  fullName: string,
  fields: GroveProfileFields,
): Promise<CandidateProfileRow> {
  const { data, error } = await supabase
    .from("candidate_profiles")
    .upsert(buildCandidateProfilePatch(userId, fullName, fields))
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as CandidateProfileRow;
}

// Profile's per-section saves use this instead of saveCandidateProfile —
// an upsert with ONLY the columns being changed (plus user_id/full_name,
// always included so a candidate who saves e.g. Career Preferences
// before ever touching Professional Profile still gets a real denormalized
// name, matching what Grove's full save already guarantees). Supabase's
// upsert only sets the columns present in the payload on the UPDATE path
// (`on conflict (user_id) do update set <payload columns> = excluded...`),
// so any section not being saved right now is left completely untouched —
// this is what makes "save each section independently" safe without a
// full round-trip of every field on every save.
export async function updateCandidateProfileFields(
  userId: string,
  fullName: string,
  patch: Partial<Omit<CandidateProfileRow, "user_id" | "full_name" | "created_at" | "updated_at">>,
): Promise<CandidateProfileRow> {
  const { data, error } = await supabase
    .from("candidate_profiles")
    .upsert({ user_id: userId, full_name: fullName, ...patch })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as CandidateProfileRow;
}

// The recruiter-safe read — every caller outside the candidate's own
// Grove edit form should use these two, never the base table.
export async function getCandidateProfilePublic(
  userId: string,
): Promise<CandidateProfilePublic | null> {
  const { data, error } = await supabase
    .from("candidate_profiles_public")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as CandidateProfilePublic | null) ?? null;
}

export async function listCandidateProfilesPublic(
  userIds: string[],
): Promise<CandidateProfilePublic[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from("candidate_profiles_public")
    .select("*")
    .in("user_id", userIds);

  if (error) throw new Error(error.message);
  return (data ?? []) as CandidateProfilePublic[];
}
