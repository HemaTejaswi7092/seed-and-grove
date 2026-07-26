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
  headline: "",
  bio: "",
  location: "",
  availability: "",
  about: {
    enjoys: "",
    interests: "",
    direction: "",
    technologies: "",
  },
  opportunities: {
    openToOpportunities: false,
    rolesOfInterest: "",
    workMode: "",
    collaborationInterests: "",
    contactVisible: false,
    contactEmail: "",
  },
  education: "",
  experience: "",
  workAuthorization: "",
  resumeUrl: "",
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
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
    const parsed = JSON.parse(raw) as Partial<GroveProfileFields>;
    return {
      ...EMPTY_GROVE_PROFILE_FIELDS,
      ...parsed,
      about: { ...EMPTY_GROVE_PROFILE_FIELDS.about, ...parsed.about },
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
    fields.bio.trim() ||
    fields.location.trim() ||
    fields.availability.trim() ||
    fields.about.enjoys.trim() ||
    fields.about.interests.trim() ||
    fields.about.direction.trim() ||
    fields.about.technologies.trim() ||
    fields.opportunities.openToOpportunities ||
    fields.opportunities.rolesOfInterest.trim() ||
    fields.education.trim() ||
    fields.experience.trim() ||
    fields.workAuthorization.trim() ||
    fields.resumeUrl.trim() ||
    fields.linkedinUrl.trim() ||
    fields.githubUrl.trim() ||
    fields.portfolioUrl.trim()
  );
}
