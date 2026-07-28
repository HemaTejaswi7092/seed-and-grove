import { supabase } from "../lib/supabase";
import type { DraftSeedInput, Seed, SeedSourceType, LifecycleStatus } from "../types/seed";

// Real Supabase Postgres — see supabase/seeds.sql. This is the Seed
// Workspace's source of truth: the sidebar list, /seeds/:id, and every
// edit action all go through this file, never localStorage (see
// state/seedStore.ts, which now holds only activity/draft-Achievements/
// messages/timeline — local-only by design, not the Seed record itself).
// RLS (not this file) is what actually enforces ownership; candidateId
// here is always passed through from the authenticated caller, matching
// this codebase's established convention, never inferred silently.

interface SeedRow {
  id: string;
  candidate_id: string;
  title: string;
  description: string;
  source_type: SeedSourceType;
  status: string;
  technologies: string[];
  progress: number;
  is_published: boolean;
  published_at: string | null;
  lifecycle_status: LifecycleStatus;
  completed_at: string | null;
  repo_url: string;
  demo_url: string;
  created_at: string;
  updated_at: string;
}

function toSeed(row: SeedRow): Seed {
  return {
    id: row.id,
    userId: row.candidate_id,
    title: row.title,
    description: row.description,
    sourceType: row.source_type,
    status: row.status,
    technologies: row.technologies,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    progress: row.progress,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    lifecycleStatus: row.lifecycle_status,
    completedAt: row.completed_at,
    repoUrl: row.repo_url,
    demoUrl: row.demo_url,
  };
}

const stageToStatus: Record<DraftSeedInput["stage"], string> = {
  Idea: "Just Started",
  Planning: "Planning",
  Building: "Currently Building",
  Scaling: "Scaling",
};

function parseCommaList(text: string): string[] {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function listSeeds(candidateId: string): Promise<Seed[]> {
  const { data, error } = await supabase
    .from("seeds")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as SeedRow[]).map(toSeed);
}

export async function getSeed(candidateId: string, seedId: string): Promise<Seed | null> {
  const { data, error } = await supabase
    .from("seeds")
    .select("*")
    .eq("candidate_id", candidateId)
    .eq("id", seedId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toSeed(data as SeedRow) : null;
}

export async function createSeed(candidateId: string, draft: DraftSeedInput): Promise<Seed> {
  const { data, error } = await supabase
    .from("seeds")
    .insert({
      id: crypto.randomUUID(),
      candidate_id: candidateId,
      title: draft.name.trim() || "Untitled Seed",
      description: draft.description.trim() || draft.goal.trim(),
      source_type: "manual",
      status: stageToStatus[draft.stage],
      technologies: parseCommaList(draft.technologies),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toSeed(data as SeedRow);
}

// Generic partial update — every specific transition (publish toggle,
// lifecycle change, link edit, metadata edit) is just a different patch
// through this one function. state/seedPublishing.ts is the only caller;
// it decides which fields change per transition and layers the local
// Timeline-event/grove_seeds-sync side effects on top.
export interface UpdateSeedInput {
  title?: string;
  description?: string;
  technologies?: string[];
  status?: string;
  progress?: number;
  is_published?: boolean;
  published_at?: string | null;
  lifecycle_status?: LifecycleStatus;
  completed_at?: string | null;
  repo_url?: string;
  demo_url?: string;
}

export async function updateSeed(
  candidateId: string,
  seedId: string,
  patch: UpdateSeedInput,
): Promise<Seed | null> {
  const { data, error } = await supabase
    .from("seeds")
    .update(patch)
    .eq("candidate_id", candidateId)
    .eq("id", seedId)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toSeed(data as SeedRow) : null;
}

// .select() is required here, not just .eq() — Postgres/PostgREST does
// NOT error when RLS silently filters a row out of a DELETE (it just
// deletes 0 rows and reports success). Without requesting the deleted
// rows back, a permission problem or a stale/already-gone row is
// indistinguishable from a real delete — same reasoning as
// groveSeedsStore.ts's deletePublishedSeed.
export async function deleteSeed(candidateId: string, seedId: string): Promise<void> {
  const { data, error } = await supabase
    .from("seeds")
    .delete()
    .eq("candidate_id", candidateId)
    .eq("id", seedId)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("Couldn't delete this Seed — nothing was removed. Please try again.");
  }
}
