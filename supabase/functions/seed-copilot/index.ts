// Seed & Grove Copilot — Supabase Edge Function.
//
// React frontend (src/services/ai/aiClient.ts, "api" mode)
//   → supabase.functions.invoke("seed-copilot", { seedId, message, ... })
//     → this function authenticates the caller from their own JWT
//     → classifies intent, retrieves relevant long-term memory (Postgres,
//       RLS-scoped to this user — see memory.ts; no vector search yet,
//       that's Phase 2, see copilot_memory.sql)
//     → calls the active AI provider (see provider.ts) with that context
//       via forced structured output
//     → optionally saves a new durable-memory row
//     → returns { message, intent, retrievedContext, evidenceCandidate? }
//
// This file deliberately does NOT import anything from src/ — Deno's
// module resolution and the Vite/browser build are separate graphs, and
// bridging them for a couple of shared strings isn't worth the fragility.
// Keep prompt.ts's SYSTEM_PROMPT and this repo's
// src/services/ai/buildSeedPrompt.ts in sync by hand if either changes.
//
// AI provider is selected by the AI_PROVIDER secret ("groq" | "anthropic",
// defaults to "groq" — see provider.ts) and reads that provider's own
// secret (GROQ_API_KEY or ANTHROPIC_API_KEY), never both, never in this
// file directly. SUPABASE_URL and SUPABASE_ANON_KEY are injected
// automatically by the Supabase platform for every Edge Function —
// nothing to set for those. The service-role key is never used anywhere
// in this function.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "./cors.ts";
import { classifyIntent } from "./intent.ts";
import { retrieveMemory, saveMemory, toRetrievedContext } from "./memory.ts";
import { buildUserTurn } from "./prompt.ts";
import { buildAchievementDraftUserTurn } from "./achievementDraft.ts";
import {
  callAiProvider,
  callAiProviderForAchievementDraft,
  resolveProviderName,
} from "./provider.ts";
import { classifyProviderError } from "./providerError.ts";
import type {
  AchievementDraftResponseBody,
  CopilotRequestBody,
  CopilotResponseBody,
  CopilotToolOutput,
} from "./types.ts";

const PROVIDER_UNAVAILABLE_MESSAGE =
  "The AI provider is temporarily unavailable. Please try again.";

function isValidBody(body: unknown): body is CopilotRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Partial<CopilotRequestBody>;
  return (
    typeof b.seedId === "string" &&
    b.seedId.length > 0 &&
    typeof b.message === "string" &&
    b.message.trim().length > 0 &&
    !!b.seedContext &&
    typeof b.seedContext.title === "string"
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  // TEMPORARY debug logging — every line tagged [debug] is stage
  // instrumentation for tracing a request end to end (frontend → auth →
  // memory → provider → response). Safe to remove once you've confirmed
  // the pipeline end-to-end with a working provider key.
  console.log("[debug] request received", { method: req.method });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("[debug] no Authorization header — returning 401");
      return jsonResponse({ error: "Missing Authorization header." }, 401);
    }

    // Scoped to the caller's own JWT — every table read/write this client
    // makes is subject to that user's RLS policies. No service-role key.
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
      console.log("[debug] auth.getUser() failed", { authError: authError?.message });
      return jsonResponse({ error: "Not authenticated." }, 401);
    }
    console.log("[debug] authenticated", { userId: user.id });

    const body: unknown = await req.json().catch(() => null);
    if (!isValidBody(body)) {
      console.log("[debug] invalid request body", { body });
      return jsonResponse(
        { error: "Expected { seedId, seedContext, message, recentMessages, activity, evidence }." },
        400,
      );
    }
    console.log("[debug] body ok", {
      seedId: body.seedId,
      messagePreview: body.message.slice(0, 80),
    });

    // Fires automatically when a candidate marks a Seed complete (see
    // Seed.tsx's handleConfirmComplete) — a single-purpose request with
    // its own prompt, tool schema, and response shape (see
    // achievementDraft.ts). Never chats, never touches long-term memory
    // (nothing here is a durable fact worth recalling later; it's a
    // one-off generation action), and returns before any of the chat-flow
    // logic below runs. Completion itself already succeeded before the
    // frontend ever calls this — a failure here is reported to the
    // candidate as "suggestions unavailable," never as completion having
    // failed.
    if (body.mode === "generate_achievement") {
      const draftUserTurn = buildAchievementDraftUserTurn({
        seedContext: body.seedContext,
        recentMessages: body.recentMessages ?? [],
        activity: body.activity ?? [],
        evidence: body.evidence ?? [],
      });
      console.log("[debug] achievement-suggestions prompt built", { userTurnLength: draftUserTurn.length });

      const providerName = resolveProviderName();
      console.log("[debug] calling AI provider for achievement suggestions...", { provider: providerName });
      try {
        const draftOutput = await callAiProviderForAchievementDraft(draftUserTurn);
        console.log("[debug] achievement-suggestions provider responded", {
          provider: providerName,
          count: draftOutput.suggestions.length,
        });
        const responseBody: AchievementDraftResponseBody = {
          reason: draftOutput.reason,
          suggestions: draftOutput.suggestions,
        };
        return jsonResponse(responseBody);
      } catch (err) {
        const classified = classifyProviderError(err);
        console.error("[copilot] AI provider call failed (achievement suggestions)", {
          provider: providerName,
          code: classified.code,
          status: classified.status,
          message: classified.message,
        });
        return jsonResponse({ error: PROVIDER_UNAVAILABLE_MESSAGE }, 502);
      }
    }

    const intent = classifyIntent(body.message);
    console.log("[debug] classified intent", { intent });

    const memoryRows = await retrieveMemory(client, user.id, body.seedId, intent);
    console.log("[debug] memory retrieved", {
      count: memoryRows.length,
      sourceTypes: memoryRows.map((r) => r.source_type),
    });

    const userTurn = buildUserTurn({
      seedContext: body.seedContext,
      memory: memoryRows,
      recentMessages: body.recentMessages ?? [],
      activity: body.activity ?? [],
      evidence: body.evidence ?? [],
      message: body.message,
    });
    console.log("[debug] prompt built", { userTurnLength: userTurn.length });

    // Isolated from the rest of the handler: any failure calling the
    // provider (bad/missing key, rate limit, network error, malformed
    // model output) is logged here in full detail, server-side only, and
    // never reaches the client as raw provider text — the client only
    // ever sees the fixed message below. Auth/validation errors above
    // this point keep their own specific messages; those aren't provider
    // failures.
    let toolOutput: CopilotToolOutput;
    const providerName = resolveProviderName();
    console.log("[debug] calling AI provider...", { provider: providerName });
    try {
      toolOutput = await callAiProvider(userTurn);
    } catch (err) {
      // Classified so this is greppable/alertable by cause (rate limit vs.
      // bad key vs. timeout vs. genuine outage) instead of only a raw,
      // differently-worded string per provider — see providerError.ts.
      // Deliberately still only ever a generic message to the client; the
      // classification is for the function logs only.
      const classified = classifyProviderError(err);
      console.error("[copilot] AI provider call failed", {
        provider: providerName,
        code: classified.code,
        status: classified.status,
        message: classified.message,
      });
      return jsonResponse({ error: PROVIDER_UNAVAILABLE_MESSAGE }, 502);
    }
    console.log("[debug] provider responded", {
      provider: providerName,
      messagePreview: toolOutput.message.slice(0, 80),
      hasMemoryCandidate: !!toolOutput.memoryCandidate,
      hasEvidenceCandidate: !!toolOutput.evidenceCandidate,
    });

    let memorySaved: CopilotResponseBody["memorySaved"];
    if (toolOutput.memoryCandidate) {
      const ok = await saveMemory(client, user.id, body.seedId, toolOutput.memoryCandidate);
      console.log("[debug] memory save attempted", { ok, candidate: toolOutput.memoryCandidate });
      if (ok) memorySaved = toolOutput.memoryCandidate;
    }

    const responseBody: CopilotResponseBody = {
      message: toolOutput.message,
      intent,
      retrievedContext: toRetrievedContext(memoryRows),
      evidenceCandidate: toolOutput.evidenceCandidate,
      activityContent: intent === "reporting_progress" ? body.message.trim() : undefined,
      memorySaved,
    };
    console.log("[debug] returning response to frontend", { intent: responseBody.intent });

    return jsonResponse(responseBody);
  } catch (err) {
    // Never leak internals (stack traces, key fragments) to the client.
    console.error("[debug] seed-copilot caught an error before responding:", err);
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return jsonResponse({ error: message }, 500);
  }
});
