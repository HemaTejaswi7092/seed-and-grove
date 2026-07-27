import type { GroveProfileFields } from "../types/grove";

/**
 * Grove's own profile fields now live in Postgres — see
 * supabase/candidate_profiles.sql and state/candidateProfileStore.ts.
 * What's left in this file is only the legacy localStorage reader, kept
 * so Grove.tsx can migrate a candidate's pre-existing local draft into
 * Postgres the first time they load Grove after this migration — it's
 * read once and never written to again.
 */

export const EMPTY_GROVE_PROFILE_FIELDS: GroveProfileFields = {
  avatarUrl: "",
  headline: "",
  professionalSummary: "",
  location: "",
  availability: "",
  areasOfInterest: "",
  opportunities: {
    openToOpportunities: false,
    rolesOfInterest: "",
    workMode: "",
    collaborationInterests: "",
    contactVisible: false,
    contactEmail: "",
  },
  education: [],
  experience: [],
  certifications: [],
  professionalSkills: [],
  workAuthorization: "",
  requiresSponsorship: false,
  preferredJobTypes: [],
  preferredLocations: [],
  availabilityDate: "",
  yearsOfExperience: "",
  resumeUrl: "",
  resumeVisible: false,
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
  websiteUrl: "",
};

function legacyStorageKey(userId: string): string {
  return `seedAndGroveProfileFields:${userId}`;
}

// Returns null if there's nothing to migrate (never saved locally, or
// already migrated — see clearLegacyGroveProfileFields).
export function loadLegacyGroveProfileFields(
  userId: string,
): GroveProfileFields | null {
  try {
    const raw = localStorage.getItem(legacyStorageKey(userId));
    if (!raw) return null;
    // Only the fields that existed in this shape when localStorage was
    // still the source of truth are migrated — education/experience were
    // free text back then and are structured arrays now, so a legacy
    // string value for either is deliberately dropped rather than
    // spread over the (correctly-typed) empty defaults below.
    const parsed = JSON.parse(raw) as Partial<
      Omit<GroveProfileFields, "education" | "experience">
    >;
    return {
      ...EMPTY_GROVE_PROFILE_FIELDS,
      ...parsed,
      opportunities: {
        ...EMPTY_GROVE_PROFILE_FIELDS.opportunities,
        ...parsed.opportunities,
      },
    };
  } catch {
    return null;
  }
}

// Called once the legacy draft has been upserted into Postgres, so the
// migration never re-runs (and never overwrites a later Postgres edit
// with a stale local copy) on a subsequent Grove load.
export function clearLegacyGroveProfileFields(userId: string): void {
  try {
    localStorage.removeItem(legacyStorageKey(userId));
  } catch {
    // localStorage unavailable — harmless, there's nothing to clear.
  }
}

export function isGroveProfileFieldsEmpty(fields: GroveProfileFields): boolean {
  return !(
    fields.headline.trim() ||
    fields.professionalSummary.trim() ||
    fields.location.trim() ||
    fields.availability.trim() ||
    fields.areasOfInterest.trim() ||
    fields.opportunities.openToOpportunities ||
    fields.opportunities.rolesOfInterest.trim() ||
    fields.education.length > 0 ||
    fields.experience.length > 0 ||
    fields.workAuthorization.trim() ||
    fields.resumeUrl.trim() ||
    fields.linkedinUrl.trim() ||
    fields.githubUrl.trim() ||
    fields.portfolioUrl.trim()
  );
}
