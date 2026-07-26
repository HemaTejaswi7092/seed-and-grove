import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { relevantSourceTypes } from "./intent.ts";
import type {
  CopilotIntent,
  MemoryCandidate,
  MemoryRow,
  RetrievedContextItem,
} from "./types.ts";

// Phase 1 retrieval: no embeddings/similarity search yet (see
// copilot_memory.sql's header comment) — just RLS-scoped, filtered,
// recency-ordered rows. `client` is created per-request from the caller's
// own JWT (see index.ts), so RLS already guarantees these rows belong to
// this user; the .eq("user_id", ...) below is a defense-in-depth filter,
// not the only thing standing between users' data.
const RETRIEVAL_LIMIT = 6;

export async function retrieveMemory(
  client: SupabaseClient,
  userId: string,
  seedId: string,
  intent: CopilotIntent,
): Promise<MemoryRow[]> {
  const types = relevantSourceTypes(intent);

  // Seed-specific memory only — a different Seed's rows are never eligible,
  // even for the same user (see copilot_memory.sql: seed_id is an exact
  // filter, not a fallback chain). General (seed_id null) rows like a
  // stated learning-style preference are included alongside it.
  const { data, error } = await client
    .from("copilot_memory")
    .select("id, seed_id, source_type, source_id, content, metadata, created_at")
    .eq("user_id", userId)
    .or(`seed_id.eq.${seedId},seed_id.is.null`)
    .in("source_type", types)
    .order("created_at", { ascending: false })
    .limit(RETRIEVAL_LIMIT);

  if (error) {
    console.error("retrieveMemory failed:", error.message);
    return [];
  }
  return (data ?? []) as MemoryRow[];
}

export function toRetrievedContext(rows: MemoryRow[]): RetrievedContextItem[] {
  return rows.map((row) => ({
    sourceType: row.source_type,
    sourceId: row.source_id,
    label: row.content.length > 80 ? `${row.content.slice(0, 77)}...` : row.content,
  }));
}

// Only called when Claude itself flags a durable fact (see claude.ts's
// tool schema) — never for every message. A short server-side guard still
// rejects near-empty content in case the model's judgment slips.
export async function saveMemory(
  client: SupabaseClient,
  userId: string,
  seedId: string,
  candidate: MemoryCandidate,
): Promise<boolean> {
  const content = candidate.content.trim();
  if (content.length < 8) return false;

  const { error } = await client.from("copilot_memory").insert({
    user_id: userId,
    seed_id: seedId,
    source_type: candidate.sourceType,
    content,
  });

  if (error) {
    console.error("saveMemory failed:", error.message);
    return false;
  }
  return true;
}
