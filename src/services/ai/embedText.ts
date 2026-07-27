import { supabase } from "../../lib/supabase";

interface EmbedTextResponse {
  embedding: number[];
  model: string;
}

// Generic gte-small text embedding — used for both published Achievement
// text (see lib/achievementEmbeddingText.ts) and job posting text (see
// lib/jobEmbeddingText.ts). The embed-achievement Edge Function it calls
// has no achievement-specific logic; it just turns text into a vector.
//
// Best-effort only, by design — see supabase/achievement_embeddings.sql's
// header comment. A failed embed call never blocks publishing; it just
// means the achievement/job won't surface in semantic matching until it's
// successfully re-embedded (the next edit retries automatically).
export async function embedText(text: string): Promise<number[] | null> {
  try {
    const { data, error } = await supabase.functions.invoke<EmbedTextResponse>(
      "embed-achievement",
      { body: { text } },
    );
    if (error || !data?.embedding) return null;
    return data.embedding;
  } catch {
    return null;
  }
}
