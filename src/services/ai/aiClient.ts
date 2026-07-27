import { supabase } from "../../lib/supabase";
import { generateLocalResponse } from "./localAssistant";
import type {
  AchievementDraftRequest,
  AchievementDraftResult,
  CopilotRequest,
  CopilotResponse,
} from "./types";

// VITE_AI_MODE=mock (default) uses the local, seed-aware dev assistant —
// see localAssistant.ts. VITE_AI_MODE=api calls the seed-copilot Supabase
// Edge Function instead, which holds the real ANTHROPIC_API_KEY as a
// server-side secret and is the only thing that ever talks to Claude. The
// browser never sees that key and never calls Claude directly — see
// docs/ai-integration.md.
const AI_MODE = import.meta.env.VITE_AI_MODE ?? "mock";

export function generateCopilotResponse(
  request: CopilotRequest,
): Promise<CopilotResponse> {
  if (AI_MODE === "api") {
    return generateRemoteResponse(request);
  }
  return generateLocalResponse(request);
}

// Fired automatically when a Seed is marked complete (see Seed.tsx's
// handleConfirmComplete) — same mode switch as generateCopilotResponse
// above.
export function generateAchievementSuggestions(
  request: AchievementDraftRequest,
): Promise<AchievementDraftResult> {
  if (AI_MODE === "api") {
    return generateRemoteAchievementSuggestions(request);
  }
  return generateLocalAchievementSuggestions(request);
}

// Response shape returned by supabase/functions/seed-copilot/index.ts.
interface EdgeFunctionResponse {
  message: string;
  intent: CopilotResponse["intent"];
  retrievedContext: { sourceType: string; sourceId: string | null; label: string }[];
  evidenceCandidate?: {
    title: string;
    summary: string;
    category: string;
    confidence: "low" | "medium" | "high";
    skillsDemonstrated?: string[];
    technologiesUsed?: string[];
    projectDomain?: string;
    relevantRoles?: string[];
    candidateContribution?: string;
    outcomeOrImpact?: string;
  };
  activityContent?: string;
}

// supabase-js's own error.message for a non-2xx Edge Function response is
// always the generic "Edge Function returned a non-2xx status code" — it
// doesn't read the response body. The real message (e.g. "The AI provider
// is temporarily unavailable. Please try again.", or a specific
// auth/validation error) is in that body, reachable via error.context (the
// raw Response). Falls back to the generic message if the body isn't the
// JSON shape we expect, so this never throws itself.
async function extractEdgeFunctionErrorMessage(error: {
  message?: string;
  context?: Response;
}): Promise<string> {
  const fallback = error.message || "The Copilot backend request failed.";
  if (!error.context || typeof error.context.json !== "function") {
    return fallback;
  }
  try {
    const body: unknown = await error.context.json();
    if (
      body &&
      typeof body === "object" &&
      typeof (body as { error?: unknown }).error === "string"
    ) {
      return (body as { error: string }).error;
    }
  } catch {
    // Response body wasn't JSON (or already consumed) — use the fallback.
  }
  return fallback;
}

async function generateRemoteResponse(
  request: CopilotRequest,
): Promise<CopilotResponse> {
  const { seed, message, recentMessages, activity, achievements } = request;

  // supabase.functions.invoke attaches the current session's access token
  // (and the anon apikey) automatically — no manual header wiring, and
  // nothing beyond the already-public anon key ever leaves the browser.
  const { data, error } = await supabase.functions.invoke<EdgeFunctionResponse>(
    "seed-copilot",
    {
      body: {
        seedId: seed.id,
        seedContext: {
          title: seed.title,
          description: seed.description,
          status: seed.status,
          progress: seed.progress,
        },
        message,
        recentMessages: recentMessages
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content })),
        activity: activity.map((a) => ({ type: a.type, content: a.content })),
        evidence: achievements.map((a) => ({
          category: a.skillsDemonstrated[0] ?? a.achievementType,
          title: a.title,
          description: a.shortDescription,
        })),
      },
    },
  );

  if (error) {
    throw new Error(await extractEdgeFunctionErrorMessage(error));
  }
  if (!data || typeof data.message !== "string") {
    throw new Error("The Copilot backend returned an unexpected response.");
  }

  return {
    content: data.message,
    intent: data.intent,
    evidenceSuggestion: data.evidenceCandidate
      ? {
          category: data.evidenceCandidate.category,
          title: data.evidenceCandidate.title,
          description: data.evidenceCandidate.summary,
          skillsDemonstrated: data.evidenceCandidate.skillsDemonstrated,
          technologiesUsed: data.evidenceCandidate.technologiesUsed,
          projectDomain: data.evidenceCandidate.projectDomain,
          relevantRoles: data.evidenceCandidate.relevantRoles,
          candidateContribution: data.evidenceCandidate.candidateContribution,
          outcomeOrImpact: data.evidenceCandidate.outcomeOrImpact,
        }
      : undefined,
    activityContent: data.activityContent,
    retrievedContext: data.retrievedContext,
  };
}

// Response shape returned by supabase/functions/seed-copilot/index.ts
// when body.mode === "generate_achievement" — a different shape from
// EdgeFunctionResponse above (no message/intent/retrievedContext; this
// mode never chats).
interface EdgeFunctionAchievementDraft {
  title: string;
  summary: string;
  category: string;
  skillsDemonstrated?: string[];
  technologiesUsed?: string[];
  projectDomain?: string;
  relevantRoles?: string[];
  candidateContribution?: string;
  outcomeOrImpact?: string;
}

interface EdgeFunctionAchievementDraftResponse {
  reason: string;
  suggestions: EdgeFunctionAchievementDraft[];
}

function toEvidenceSuggestion(draft: EdgeFunctionAchievementDraft) {
  return {
    category: draft.category,
    title: draft.title,
    description: draft.summary,
    skillsDemonstrated: draft.skillsDemonstrated,
    technologiesUsed: draft.technologiesUsed,
    projectDomain: draft.projectDomain,
    relevantRoles: draft.relevantRoles,
    candidateContribution: draft.candidateContribution,
    outcomeOrImpact: draft.outcomeOrImpact,
  };
}

async function generateRemoteAchievementSuggestions(
  request: AchievementDraftRequest,
): Promise<AchievementDraftResult> {
  const { seed, recentMessages, activity, achievements } = request;

  const { data, error } = await supabase.functions.invoke<EdgeFunctionAchievementDraftResponse>(
    "seed-copilot",
    {
      body: {
        seedId: seed.id,
        seedContext: {
          title: seed.title,
          description: seed.description,
          status: seed.status,
          progress: seed.progress,
        },
        // Ignored by the backend's achievement-suggestions prompt — kept
        // only because the shared request-body validator still requires a
        // non-empty message string regardless of mode.
        message: "Generate achievement suggestions.",
        mode: "generate_achievement",
        recentMessages: recentMessages
          .slice(-20)
          .map((m) => ({ role: m.role, content: m.content })),
        activity: activity.map((a) => ({ type: a.type, content: a.content })),
        // Every logged achievement for this Seed regardless of visibility
        // (published or private/draft) — the backend's duplicate-
        // detection rule treats both the same, deliberately.
        evidence: achievements.map((a) => ({
          category: a.skillsDemonstrated[0] ?? a.achievementType,
          title: a.title,
          description: a.shortDescription,
        })),
      },
    },
  );

  if (error) {
    throw new Error(await extractEdgeFunctionErrorMessage(error));
  }
  if (!data || !Array.isArray(data.suggestions)) {
    throw new Error("The Copilot backend returned an unexpected response.");
  }

  return {
    reason: data.reason,
    suggestions: data.suggestions.map(toEvidenceSuggestion),
  };
}

// Offline/dev fallback (VITE_AI_MODE=mock, the default) — deliberately
// simple rather than a full reimplementation of the real prompt's
// judgment: picks up to 2 recent substantive-looking user messages (long
// enough to plausibly describe real work, not phrased as a question) and
// turns each into a generic suggestion. Real usage goes through "api"
// mode (generateRemoteAchievementSuggestions above), which is what's
// actually tuned and tested against Groq/Claude.
async function generateLocalAchievementSuggestions(
  request: AchievementDraftRequest,
): Promise<AchievementDraftResult> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const candidates = [...request.recentMessages]
    .reverse()
    .filter(
      (m) =>
        m.role === "user" &&
        m.content.trim().length >= 40 &&
        !m.content.trim().endsWith("?"),
    )
    .slice(0, 2);

  if (candidates.length === 0) {
    return {
      reason: "Nothing specific enough yet — describe what you built or completed in the chat first.",
      suggestions: [],
    };
  }

  return {
    reason: "",
    suggestions: candidates.map((candidate) => ({
      category: "Milestone",
      title: request.seed.title,
      description: candidate.content.trim(),
      candidateContribution: candidate.content.trim(),
    })),
  };
}
