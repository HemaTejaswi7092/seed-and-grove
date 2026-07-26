// Seed & Grove — embed-achievement Edge Function.
//
// A thin wrapper around Supabase Edge Functions' built-in Supabase.ai
// runtime (the gte-small text-embedding model) — this is the ONLY place
// gte-small can run, since Supabase.ai isn't available in the browser.
// The caller (src/services/ai/embedAchievement.ts, invoked from
// state/achievements.ts at publish/update time) does the actual database
// write itself using its own normal, RLS-scoped Supabase client; this
// function has no database access at all — it only turns text into a
// 384-dim vector and returns it.
//
// No external API, no provider key, no secret to manage — that's the
// whole reason gte-small was chosen over Hugging Face/Gemini/OpenAI for
// this (see the embedding-provider comparison in the project history).
//
// Auth is still required (caller's JWT) purely to keep this from being an
// open, unauthenticated compute endpoint — it doesn't touch any
// user-scoped data, so there's nothing here for RLS to protect.

import { corsHeaders, jsonResponse } from "./cors.ts";

// Ambient global injected by the Supabase Edge Runtime itself — not an
// npm/Deno module import. See:
// https://supabase.com/docs/guides/functions/ai-models
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

interface RequestBody {
  text: string;
}

function isValidBody(body: unknown): body is RequestBody {
  return (
    !!body &&
    typeof body === "object" &&
    typeof (body as Partial<RequestBody>).text === "string" &&
    (body as RequestBody).text.trim().length > 0
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

  const body: unknown = await req.json().catch(() => null);
  if (!isValidBody(body)) {
    return jsonResponse({ error: "Expected { text: string }." }, 400);
  }

  try {
    const session = new Supabase.ai.Session("gte-small");
    // gte-small truncates input past ~512 tokens on its own — achievement
    // text (title/description/skills/etc.) is always well under that, so
    // no manual truncation is done here.
    const embedding = await session.run(body.text, {
      mean_pool: true,
      normalize: true,
    });
    return jsonResponse({ embedding, model: "gte-small" });
  } catch (err) {
    console.error("[embed-achievement] gte-small run failed:", err);
    return jsonResponse({ error: "Embedding generation failed." }, 500);
  }
});
