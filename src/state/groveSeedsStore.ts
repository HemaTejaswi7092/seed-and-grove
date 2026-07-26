import { supabase } from "../lib/supabase";
import type { PublishedSeed } from "../types/grove";

// Thin Supabase wrapper around grove_seeds (see supabase/grove_seeds.sql)
// — mirrors state/groveAchievementsStore.ts's pattern exactly. This file
// has no opinion on when a Seed should be published; it only executes
// the insert/update/delete it's told to. state/seedPublishing.ts is the
// only caller, and is what decides *when* these run, keeping the local
// (localStorage) Seed record and this table in sync.

export interface UpsertPublishedSeedInput {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  status: string;
  lifecycle_status: string;
  repo_url: string | null;
  demo_url: string | null;
}

export async function upsertPublishedSeed(
  candidateId: string,
  input: UpsertPublishedSeedInput,
): Promise<PublishedSeed> {
  const { data, error } = await supabase
    .from("grove_seeds")
    .upsert({ candidate_id: candidateId, ...input })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as PublishedSeed;
}

export async function deletePublishedSeed(seedId: string): Promise<void> {
  // .select() is required here, not just .eq() — Postgres/PostgREST does
  // NOT error when RLS silently filters a row out of a DELETE (it just
  // deletes 0 rows and reports success). Without requesting the deleted
  // rows back, a permission problem or a stale/already-gone row is
  // indistinguishable from a real delete, and the caller (state/
  // seedPublishing.ts) would wrongly proceed as if unpublish succeeded,
  // leaving a stale public row visible to recruiters.
  const { data, error } = await supabase
    .from("grove_seeds")
    .delete()
    .eq("id", seedId)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error(
      "Couldn't unpublish this Seed in Grove — nothing was removed. Please try again.",
    );
  }
}

// A single candidate's own published Seeds — used by Grove.tsx (owner's
// own Grove) and the recruiter candidate-profile route. RLS already lets
// any authenticated user read every row here (see the SQL file's header
// comment), but this query narrows to one candidate since that's all
// either of those pages needs.
export async function listPublishedSeeds(
  candidateId: string,
): Promise<PublishedSeed[]> {
  const { data, error } = await supabase
    .from("grove_seeds")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("published_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PublishedSeed[];
}
