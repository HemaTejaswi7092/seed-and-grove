import { supabase } from "../../lib/supabase";

interface EmbedAchievementResponse {
  embedding: number[];
  model: string;
}

// Best-effort only, by design — see supabase/achievement_embeddings.sql's
// header comment. A failed embed call never blocks publishing; it just
// means this achievement won't surface in semantic matching until it's
// successfully re-embedded (the next edit retries automatically).
export async function embedAchievementText(text: string): Promise<number[] | null> {
  try {
    const { data, error } = await supabase.functions.invoke<EmbedAchievementResponse>(
      "embed-achievement",
      { body: { text } },
    );
    if (error || !data?.embedding) return null;
    return data.embedding;
  } catch {
    return null;
  }
}
