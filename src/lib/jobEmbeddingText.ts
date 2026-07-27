interface JobTextInput {
  title: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
}

// One semantic block from the complete job posting — mirrors
// supabase/functions/match-candidates/matching.ts's buildJobEmbeddingText
// exactly (same construction, snake_case here since it runs against
// JobInput's own field names). Computed client-side at publish/update
// time so the job's embedding is stored (see achievementEmbeddingText.ts
// for the identical pattern on the Achievement side), the same way a
// job's embedding gets searched by match_jobs on the candidate side.
export function buildJobEmbeddingText(job: JobTextInput): string {
  return [
    job.title,
    job.description,
    job.required_skills.length ? `Required skills: ${job.required_skills.join(", ")}.` : "",
    job.preferred_skills.length ? `Preferred skills: ${job.preferred_skills.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}
