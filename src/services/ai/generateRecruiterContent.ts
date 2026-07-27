import { supabase } from "../../lib/supabase";
import type { FeedPostType } from "../../types/feed";

// Client wrapper for the generate-recruiter-content Edge Function — see
// its index.ts for the two supported modes. Unlike embedText.ts (best-
// effort, never throws — embedding failures are silently deferred),
// generation here is always an explicit user action ("Generate with AI")
// with visible loading/error state, so failures are thrown for the caller
// to surface directly.

export type CompanyPostType = Extract<
  FeedPostType,
  "company_award" | "hiring_announcement" | "team_achievement" | "industry_update" | "company_news"
>;

export interface JobDescriptionDraft {
  jobTitle: string;
  summary: string;
  responsibilities: string[];
  qualifications: string[];
  requiredSkills: string[];
  preferredSkills: string[];
}

export interface CompanyPostDraft {
  caption: string;
}

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T & { error?: string }>(
    "generate-recruiter-content",
    { body },
  );
  if (error) throw new Error(error.message);
  if (!data || (data as { error?: string }).error) {
    throw new Error((data as { error?: string })?.error || "Generation failed.");
  }
  return data;
}

export async function generateJobDescription(prompt: string): Promise<JobDescriptionDraft> {
  return invoke<JobDescriptionDraft>({ mode: "job_description", prompt });
}

export async function generateCompanyPost(
  postType: CompanyPostType,
  prompt: string,
): Promise<CompanyPostDraft> {
  return invoke<CompanyPostDraft>({ mode: "company_post", postType, prompt });
}
