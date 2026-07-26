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

function toRowInput(userId: string, fullName: string, fields: GroveProfileFields) {
  return {
    user_id: userId,
    full_name: fullName,
    headline: fields.headline.trim(),
    bio: fields.bio.trim(),
    location: fields.location.trim(),
    availability: fields.availability.trim(),
    about_enjoys: fields.about.enjoys.trim(),
    about_interests: fields.about.interests.trim(),
    about_direction: fields.about.direction.trim(),
    about_technologies: fields.about.technologies.trim(),
    open_to_opportunities: fields.opportunities.openToOpportunities,
    roles_of_interest: fields.opportunities.rolesOfInterest.trim(),
    work_mode: fields.opportunities.workMode.trim(),
    collaboration_interests: fields.opportunities.collaborationInterests.trim(),
    contact_visible: fields.opportunities.contactVisible,
    contact_email: fields.opportunities.contactEmail.trim(),
    education: fields.education.trim(),
    experience: fields.experience.trim(),
    work_authorization: fields.workAuthorization.trim(),
    resume_url: fields.resumeUrl.trim() || null,
    linkedin_url: fields.linkedinUrl.trim() || null,
    github_url: fields.githubUrl.trim() || null,
    portfolio_url: fields.portfolioUrl.trim() || null,
  };
}

// Shared by both the candidate's own edit form (reading the base table)
// and anywhere that reads the public view — same field mapping either way.
export function candidateRowToFields(
  row: CandidateProfileRow | CandidateProfilePublic,
): GroveProfileFields {
  return {
    headline: row.headline,
    bio: row.bio,
    location: row.location,
    availability: row.availability,
    about: {
      enjoys: row.about_enjoys,
      interests: row.about_interests,
      direction: row.about_direction,
      technologies: row.about_technologies,
    },
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
    workAuthorization: row.work_authorization,
    resumeUrl: row.resume_url ?? "",
    linkedinUrl: row.linkedin_url ?? "",
    githubUrl: row.github_url ?? "",
    portfolioUrl: row.portfolio_url ?? "",
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
    .upsert(toRowInput(userId, fullName, fields))
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
