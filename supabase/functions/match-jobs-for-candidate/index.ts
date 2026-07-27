// Seed & Grove — match-jobs-for-candidate Edge Function (candidate ->
// jobs direction of the semantic matching engine; see match-candidates
// for the recruiter -> candidates direction and ../_shared/matching.ts
// for the scoring logic both share).
//
// Flow:
//   candidate's published Achievements + public profile interests/target
//   roles → ONE aggregate semantic representation (gte-small, in-process)
//   → pgvector inner-product retrieval over EVERY published job with an
//     embedding (match_jobs RPC, no similarity floor — a weak match still
//     gets scored, only the frontend's optional "Recommended" section
//     filters/ranks a highlighted subset)
//   → any published job with NO embedding yet (e.g. an old row from
//     before this pipeline existed, or a transient failure at publish
//     time) gets one generated right here before scoring, and best-effort
//     written back so future requests don't redo the work
//   → for each job, re-rank the candidate's OWN Achievements against that
//     job's specific embedding to pick 1-3 supporting pieces of evidence
//   → return a concise, evidence-cited result for every published job
//
// No keyword/skill-intersection matching anywhere in this file — ranking
// is entirely a function of embedding similarity, same as the recruiter
// direction. No LLM call either: the one-sentence explanation is built
// directly from the candidate's own top-matching Achievement text for
// that specific job.
//
// This function only ever matches the CALLER's own data (auth.uid()) —
// there is no candidate-id parameter. Reads only through grove_achievements
// (own rows), candidate_profiles (own row), and published jobs, all
// already scoped by RLS; never touches private Seed conversations,
// drafts, or copilot_memory. There is no code path here that could. The
// one narrow exception is the service-role client used ONLY to write
// embedding/embedding_model/embedding_updated_at back onto a job that is
// already publicly readable (status = 'published') — never any other
// column, never a non-published row.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "./cors.ts";
import { buildCandidateEmbeddingText, buildJobEmbeddingText, buildJobMatches } from "./matching.ts";
import type {
  AchievementRow,
  CandidateProfileRow,
  JobMatchRow,
  UnembeddedJobRow,
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

// Effectively "every published, embedded job" — no similarity floor
// (min_similarity=-1 disables match_jobs' WHERE filter entirely; cosine
// similarity can't go below -1) and a generous cap well above any
// realistic job count for this product.
const MATCH_COUNT = 1000;
const MIN_SIMILARITY = -1;

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

  const { data: achievementRows, error: achievementsError } = await client
    .from("grove_achievements")
    .select(
      "id, title, short_description, skills_demonstrated, technologies_used, project_domain, candidate_contribution, outcome_or_impact, relevant_roles, embedding",
    )
    .eq("candidate_id", user.id);
  if (achievementsError) {
    console.error(
      "[match-jobs-for-candidate] grove_achievements read failed:",
      achievementsError,
    );
    return jsonResponse({ error: "Couldn't load your published achievements." }, 500);
  }

  const achievements = (achievementRows ?? []) as AchievementRow[];

  // Rule: with no published Achievements yet, there is nothing to build a
  // semantic representation from — return unscored so the frontend shows
  // every job without a percentage, explaining that publishing
  // Achievements enables personalized matching. No embedding call is made
  // in this case.
  if (achievements.length === 0) {
    return jsonResponse({ matches: [], hasPublishedAchievements: false });
  }

  const { data: profileRow, error: profileError } = await client
    .from("candidate_profiles")
    .select("headline, roles_of_interest, about_interests, about_direction, work_mode")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError) {
    console.error("[match-jobs-for-candidate] candidate_profiles read failed:", profileError);
    return jsonResponse({ error: "Couldn't load your profile." }, 500);
  }

  const candidateText = buildCandidateEmbeddingText(
    achievements,
    (profileRow as CandidateProfileRow | null) ?? null,
  );

  let queryEmbedding: number[];
  try {
    const session = new Supabase.ai.Session("gte-small");
    queryEmbedding = await session.run(candidateText, {
      mean_pool: true,
      normalize: true,
    });
  } catch (err) {
    console.error("[match-jobs-for-candidate] candidate embedding failed:", err);
    return jsonResponse({ error: "Couldn't process your published work." }, 500);
  }

  const { data: jobRows, error: rpcError } = await client.rpc("match_jobs", {
    query_embedding: queryEmbedding,
    match_count: MATCH_COUNT,
    min_similarity: MIN_SIMILARITY,
  });
  if (rpcError) {
    console.error("[match-jobs-for-candidate] match_jobs RPC failed:", rpcError);
    return jsonResponse({ error: "Couldn't search published jobs." }, 500);
  }

  // match_jobs only ever returns jobs that already HAVE an embedding —
  // find any published job that doesn't (rare: an old row from before
  // this pipeline, or a publish-time embed call that failed) and embed
  // it now, so it still gets scored instead of silently missing from the
  // results.
  const { data: unembeddedRows, error: unembeddedError } = await client
    .from("jobs")
    .select(
      "id, recruiter_id, title, location, employment_type, work_mode, description, required_skills, preferred_skills, application_url, created_at",
    )
    .eq("status", "published")
    .is("embedding", null);
  if (unembeddedError) {
    console.error("[match-jobs-for-candidate] unembedded jobs read failed:", unembeddedError);
    return jsonResponse({ error: "Couldn't search published jobs." }, 500);
  }

  const backfilled: JobMatchRow[] = [];
  const unembedded = (unembeddedRows ?? []) as UnembeddedJobRow[];
  if (unembedded.length > 0) {
    const session = new Supabase.ai.Session("gte-small");
    // Writes ONLY embedding/embedding_model/embedding_updated_at, and
    // ONLY for the specific already-published job id just embedded — see
    // this file's header comment. Best-effort: a failed write still lets
    // this request return the freshly-computed score, it just means the
    // next request re-embeds that job.
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    for (const job of unembedded) {
      try {
        const embedding = await session.run(buildJobEmbeddingText(job), {
          mean_pool: true,
          normalize: true,
        });
        backfilled.push({ ...job, embedding: JSON.stringify(embedding) });

        const { error: writeError } = await serviceClient
          .from("jobs")
          .update({
            embedding,
            embedding_model: "gte-small",
            embedding_updated_at: new Date().toISOString(),
          })
          .eq("id", job.id)
          .eq("status", "published");
        if (writeError) {
          console.error(
            "[match-jobs-for-candidate] embedding backfill write failed for job",
            job.id,
            writeError,
          );
        }
      } catch (err) {
        console.error(
          "[match-jobs-for-candidate] on-demand embedding failed for job",
          job.id,
          err,
        );
        // Skip this one job's score rather than fail the whole request.
      }
    }
  }

  const allJobRows = [...((jobRows ?? []) as JobMatchRow[]), ...backfilled];
  const matches = buildJobMatches(allJobRows, achievements, queryEmbedding);
  return jsonResponse({ matches, hasPublishedAchievements: true });
});
