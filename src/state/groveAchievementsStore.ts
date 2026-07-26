import { supabase } from "../lib/supabase";
import type { PublishedAchievement } from "../types/grove";

// Thin Supabase wrapper around grove_achievements (see
// supabase/grove_achievements.sql) — mirrors state/feedStore.ts's pattern.
// This file has no opinion on when something should be published; it only
// executes the insert/update/delete it's told to. state/achievements.ts is
// the only caller, and is what decides *when* these run, keeping the local
// (localStorage) Achievement record and this table in sync.

export interface UpsertPublishedAchievementInput {
  id: string;
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
  // Omitted (rather than explicitly null) when the embed call failed —
  // an upsert without this key leaves whatever embedding a previous
  // successful publish already wrote untouched, instead of clobbering it
  // with null. See state/achievements.ts's toPublishedInput.
  embedding?: number[];
  embedding_model?: string;
  embedding_updated_at?: string;
}

export async function upsertPublishedAchievement(
  candidateId: string,
  input: UpsertPublishedAchievementInput,
): Promise<PublishedAchievement> {
  const { data, error } = await supabase
    .from("grove_achievements")
    .upsert({ candidate_id: candidateId, ...input })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as PublishedAchievement;
}

export async function deletePublishedAchievement(
  achievementId: string,
): Promise<void> {
  // .select() is required here, not just .eq() — Postgres/PostgREST does
  // NOT error when RLS silently filters a row out of a DELETE (it just
  // deletes 0 rows and reports success). Without requesting the deleted
  // rows back, a permission problem or a stale/already-gone row is
  // indistinguishable from a real delete, and the caller (state/
  // achievements.ts) would wrongly proceed to remove the local record,
  // leaving an orphaned row behind in Postgres with no error ever shown.
  const { data, error } = await supabase
    .from("grove_achievements")
    .delete()
    .eq("id", achievementId)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error(
      "Couldn't delete the published achievement in Grove — nothing was removed. Please try again.",
    );
  }
}

// A single candidate's own published Achievements — used by Grove.tsx and
// the recruiter candidate-profile route. RLS already lets any
// authenticated user read every row here (see the SQL file's header
// comment), but this query narrows to one candidate since that's all
// either of those pages needs.
export async function listPublishedAchievements(
  candidateId: string,
): Promise<PublishedAchievement[]> {
  const { data, error } = await supabase
    .from("grove_achievements")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PublishedAchievement[];
}

// Across every candidate, newest first — the recruiter Discover feed's
// "Recent" tab. Same RLS as above; no per-candidate filter.
export async function listRecentPublishedAchievements(
  limit = 30,
): Promise<PublishedAchievement[]> {
  const { data, error } = await supabase
    .from("grove_achievements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as PublishedAchievement[];
}
