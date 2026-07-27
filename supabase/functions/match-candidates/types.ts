// Request body sent by src/state/matchingStore.ts.
export interface MatchCandidatesRequestBody {
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
}

// Row shape returned by the match_achievements() Postgres function — see
// supabase/achievement_embeddings.sql.
export interface AchievementMatchRow {
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
  created_at: string;
  similarity: number;
}

// Row shape from candidate_profiles_public.
export interface CandidateProfileRow {
  user_id: string;
  full_name: string;
  headline: string;
}

export interface MatchedAchievement {
  id: string;
  title: string;
  shortDescription: string;
  similarity: number;
}

// What the frontend actually renders — deliberately concise (see
// src/components/recruiter/CandidateMatchCard.tsx): no long
// responsibilities/skills/technologies/gaps sections, just enough to act
// on, with every claim traceable to a real, cited Achievement.
export interface CandidateMatchResult {
  candidateId: string;
  name: string;
  headline: string;
  matchScore: number; // 0-100
  matchLabel: string; // "Excellent Match" | "Strong Match" | "Good Match" | "Potential Match" — see ../_shared/matching.ts
  matchSentence: string;
  achievements: MatchedAchievement[];
}
