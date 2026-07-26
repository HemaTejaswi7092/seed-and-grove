// Seed & Grove — match-candidates Edge Function (Phase B: AI candidate
// matching).
//
// Flow (per the approved architecture):
//   full job description → semantic embedding (gte-small, in-process)
//   → pgvector cosine/inner-product retrieval over grove_achievements
//     (match_achievements RPC — published Achievements only, nothing
//      else is queryable through it)
//   → group retrieved Achievements by candidate
//   → rank candidates by their strongest single piece of evidence
//   → join candidate_profiles_public for name/headline
//   → return a concise, evidence-cited result per candidate
//
// No keyword/skill-intersection matching anywhere in this file — ranking
// is entirely a function of embedding similarity. No LLM call either:
// the one-sentence explanation is built directly from the candidate's own
// top-matching Achievement text (see matching.ts's buildMatchSentence),
// so it can never say anything not already true of a real, cited
// Achievement.
//
// Reads only through candidate_profiles_public and grove_achievements
// (via match_achievements) — both already scoped by RLS to published/
// public data. This function never touches Seed conversations, private
// Achievements, copilot_memory, or draft data; there is no code path
// here that could.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "./cors.ts";
import { buildJobEmbeddingText, groupAndRankCandidates } from "./matching.ts";
import type {
  AchievementMatchRow,
  CandidateProfileRow,
  MatchCandidatesRequestBody,
} from "./types.ts";

declare const Supabase: {
  ai: {
    Session: new (model: string) => {
      run: (
        input: string,
        options?: { mean_pool?: boolean; normalize?: boolean },
      ) => Promise<number[]>;
    };
  };
};

const MATCH_COUNT = 60;
const MIN_SIMILARITY = 0.15;
const MAX_CANDIDATES = 10;

function isValidBody(body: unknown): body is MatchCandidatesRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Partial<MatchCandidatesRequestBody>;
  return (
    typeof b.title === "string" &&
    typeof b.description === "string" &&
    Array.isArray(b.requiredSkills) &&
    Array.isArray(b.preferredSkills)
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing Authorization header." }, 401);
  }

  // Scoped to the caller's own JWT — every read this client makes is
  // subject to that user's RLS. No service-role key anywhere here.
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) {
    return jsonResponse({ error: "Not authenticated." }, 401);
  }

  const body: unknown = await req.json().catch(() => null);
  if (!isValidBody(body)) {
    return jsonResponse(
      { error: "Expected { title, description, requiredSkills, preferredSkills }." },
      400,
    );
  }

  let queryEmbedding: number[];
  try {
    const session = new Supabase.ai.Session("gte-small");
    queryEmbedding = await session.run(buildJobEmbeddingText(body), {
      mean_pool: true,
      normalize: true,
    });
  } catch (err) {
    console.error("[match-candidates] job embedding failed:", err);
    return jsonResponse({ error: "Couldn't process the job description." }, 500);
  }

  const { data: achievementRows, error: rpcError } = await client.rpc("match_achievements", {
    query_embedding: queryEmbedding,
    match_count: MATCH_COUNT,
    min_similarity: MIN_SIMILARITY,
  });
  if (rpcError) {
    console.error("[match-candidates] match_achievements RPC failed:", rpcError);
    return jsonResponse({ error: "Couldn't search published achievements." }, 500);
  }

  const rows = (achievementRows ?? []) as AchievementMatchRow[];
  if (rows.length === 0) {
    return jsonResponse({ candidates: [] });
  }

  const candidateIds = Array.from(new Set(rows.map((row) => row.candidate_id)));
  const { data: profiles, error: profilesError } = await client
    .from("candidate_profiles_public")
    .select("user_id, full_name, headline")
    .in("user_id", candidateIds);
  if (profilesError) {
    console.error("[match-candidates] candidate_profiles_public read failed:", profilesError);
    return jsonResponse({ error: "Couldn't load matching candidates." }, 500);
  }

  const profilesById = new Map(
    ((profiles ?? []) as CandidateProfileRow[]).map((p) => [p.user_id, p]),
  );

  const candidates = groupAndRankCandidates(rows, profilesById, MAX_CANDIDATES);
  return jsonResponse({ candidates });
});
