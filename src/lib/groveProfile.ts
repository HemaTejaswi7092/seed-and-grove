import type { GroveProfileFields } from "../types/grove";

/**
 * TEMPORARY PERSISTENCE — Grove's own profile fields (headline, bio,
 * location, availability, About the Builder, Opportunities) don't have
 * columns on Supabase's `profiles` table yet (see supabase/setup.sql,
 * which only has full_name/onboarding_completed). This shape is written to
 * mirror what those columns will look like, so migrating later is a matter
 * of swapping this module's load/save bodies for `supabase.from("profiles")`
 * calls — nothing that reads GroveProfileFields needs to change.
 *
 * Keyed per authenticated userId in localStorage, same isolation pattern as
 * state/seedStore.ts. Real identity (name, email) is never stored here —
 * it always comes from useAuth().
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
};

function storageKey(userId: string): string {
  return `seedAndGroveProfileFields:${userId}`;
}

export function loadGroveProfileFields(userId: string): GroveProfileFields {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { ...EMPTY_GROVE_PROFILE_FIELDS };
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
    return { ...EMPTY_GROVE_PROFILE_FIELDS };
  }
}

export function saveGroveProfileFields(
  userId: string,
  fields: GroveProfileFields,
): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(fields));
  } catch {
    // localStorage unavailable — edits just won't persist across reloads.
  }
}
