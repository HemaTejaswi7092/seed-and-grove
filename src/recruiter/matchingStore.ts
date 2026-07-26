import { supabase } from "../lib/supabase";
import type { CandidateMatch } from "./types";

export interface MatchCandidatesInput {
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
}

interface MatchCandidatesResponse {
  candidates: CandidateMatch[];
}

// supabase-js's own error.message for a non-2xx Edge Function response is
// always the generic "Edge Function returned a non-2xx status code" — see
// the identical helper in services/ai/aiClient.ts, duplicated here rather
// than shared since it's a few lines and the two call sites have no other
// reason to depend on each other.
async function extractEdgeFunctionErrorMessage(error: {
  message?: string;
  context?: Response;
}): Promise<string> {
  const fallback = error.message || "The matching service request failed.";
  if (!error.context || typeof error.context.json !== "function") {
    return fallback;
  }
  try {
    const body: unknown = await error.context.json();
    if (
      body &&
      typeof body === "object" &&
      typeof (body as { error?: unknown }).error === "string"
    ) {
      return (body as { error: string }).error;
    }
  } catch {
    // Response body wasn't JSON (or already consumed) — use the fallback.
  }
  return fallback;
}

// Calls the match-candidates Edge Function — the only place semantic
// retrieval actually runs (it needs Supabase.ai, which only exists inside
// an Edge Function, and the pgvector RPC). See that function's header
// comment for the full pipeline.
export async function matchCandidatesForJob(
  input: MatchCandidatesInput,
): Promise<CandidateMatch[]> {
  const { data, error } = await supabase.functions.invoke<MatchCandidatesResponse>(
    "match-candidates",
    { body: input },
  );

  if (error) {
    throw new Error(await extractEdgeFunctionErrorMessage(error));
  }
  if (!data) {
    throw new Error("The matching service returned an unexpected response.");
  }
  return data.candidates;
}
