import type { CertificationEntry, EducationEntry, ExperienceEntry } from "../types/grove";
import type { VideoEntry } from "./types";

// The Grove-specific columns added by recruiter_grove_profile.sql, kept
// as its own type since both RecruiterProfile (owner) and
// RecruiterProfilePublic (public view) carry them identically.
interface RecruiterGroveFieldsRow {
  professional_bio: string;
  hiring_philosophy: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications: CertificationEntry[];
  industry: string;
  team_or_department: string;
  company_description: string;
  company_website: string | null;
  hiring_domains: string[];
  hiring_skills: string[];
  hiring_levels: string[];
  videos: VideoEntry[];
}

// Normalizes a raw Supabase row into safe defaults for every Grove field
// this migration added. Necessary because this repo's SQL files are
// applied by hand (see recruiter_grove_profile.sql's header comment) — if
// the code deploys before the migration runs, `select("*")` simply omits
// these columns and every field below comes back `undefined`, not the
// DB's `not null default` — without this, RecruiterGroveView's `.trim()`/
// `.length` calls would throw instead of just showing empty sections.
export function normalizeRecruiterGroveFields(
  row: Partial<RecruiterGroveFieldsRow>,
): RecruiterGroveFieldsRow {
  return {
    professional_bio: row.professional_bio ?? "",
    hiring_philosophy: row.hiring_philosophy ?? "",
    experience: row.experience ?? [],
    education: row.education ?? [],
    certifications: row.certifications ?? [],
    industry: row.industry ?? "",
    team_or_department: row.team_or_department ?? "",
    company_description: row.company_description ?? "",
    company_website: row.company_website ?? null,
    hiring_domains: row.hiring_domains ?? [],
    hiring_skills: row.hiring_skills ?? [],
    hiring_levels: row.hiring_levels ?? [],
    videos: row.videos ?? [],
  };
}
