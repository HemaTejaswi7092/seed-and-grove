// Seed & Grove: recruiter AI content generation — Supabase Edge Function.
//
// React frontend (src/services/ai/generateRecruiterContent.ts)
//   → supabase.functions.invoke("generate-recruiter-content", { mode, ... })
//     → this function authenticates the caller from their own JWT
//     → calls Groq with a forced tool_choice matching the requested mode
//     → returns the structured draft — always editable, never auto-saved
//
// Deliberately simpler than seed-copilot's provider registry: a single
// hardcoded Groq call (same GROQ_API_KEY secret, same forced-tool-schema
// JSON-output technique already proven there), no Anthropic fallback. This
// is a prototype feature — two modes (job description, company post)
// sharing one small function is the right amount of infrastructure for it;
// a provider registry would be scaffolding for scale this doesn't need.
//
// This file deliberately does NOT import anything from src/ — Deno's
// module resolution and the Vite/browser build are separate graphs (same
// rule seed-copilot/index.ts follows).

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "./cors.ts";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

type CompanyPostType =
  | "company_award"
  | "hiring_announcement"
  | "team_achievement"
  | "industry_update"
  | "company_news";

const COMPANY_POST_TYPE_LABELS: Record<CompanyPostType, string> = {
  company_award: "Company Award",
  hiring_announcement: "Hiring Announcement",
  team_achievement: "Team Achievement",
  industry_update: "Industry Update",
  company_news: "Company News",
};

type RequestBody =
  | { mode: "job_description"; prompt: string }
  | { mode: "company_post"; postType: CompanyPostType; prompt: string };

interface JobDescriptionOutput {
  jobTitle: string;
  summary: string;
  responsibilities: string[];
  qualifications: string[];
  requiredSkills: string[];
  preferredSkills: string[];
}

interface CompanyPostOutput {
  caption: string;
}

const JOB_DESCRIPTION_TOOL_NAME = "draft_job_description";
const JOB_DESCRIPTION_SCHEMA = {
  type: "object",
  properties: {
    jobTitle: { type: "string" },
    summary: {
      type: "string",
      description: "A 2-3 sentence overview of the role.",
    },
    responsibilities: {
      type: "array",
      items: { type: "string" },
      description: "4-6 concrete, concise responsibility bullets.",
    },
    qualifications: {
      type: "array",
      items: { type: "string" },
      description: "3-5 concise qualification bullets.",
    },
    requiredSkills: { type: "array", items: { type: "string" } },
    preferredSkills: { type: "array", items: { type: "string" } },
  },
  required: [
    "jobTitle",
    "summary",
    "responsibilities",
    "qualifications",
    "requiredSkills",
    "preferredSkills",
  ],
};

const JOB_DESCRIPTION_SYSTEM_PROMPT =
  "You are helping a recruiter quickly draft a job posting from a short " +
  "description of what they need. Produce a complete, realistic draft: " +
  "job title, summary, responsibilities, qualifications, and separate " +
  "required vs. preferred skills. Be concrete and specific to the role " +
  "described — never pad with generic corporate filler. This is always a " +
  "starting draft the recruiter reviews and edits before publishing, " +
  "never final text.";

const COMPANY_POST_TOOL_NAME = "draft_company_post";
const COMPANY_POST_SCHEMA = {
  type: "object",
  properties: {
    caption: {
      type: "string",
      description: "One polished post caption, 2-4 sentences.",
    },
  },
  required: ["caption"],
};

function companyPostSystemPrompt(postType: CompanyPostType): string {
  return (
    `You are helping a recruiter write a short, professional post for a ` +
    `shared professional feed (similar to a LinkedIn company update), ` +
    `categorized as "${COMPANY_POST_TYPE_LABELS[postType]}". Write one ` +
    `polished caption in a warm, professional, non-cheesy tone — specific ` +
    `to what they describe, never generic filler. This is always a draft ` +
    `the recruiter reviews and edits before publishing, never final text.`
  );
}

async function callGroqTool(
  systemPrompt: string,
  userTurn: string,
  toolName: string,
  schema: object,
  maxTokens: number,
): Promise<unknown> {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured on this function.");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userTurn },
      ],
      tools: [
        {
          type: "function",
          function: { name: toolName, description: toolName, parameters: schema },
        },
      ],
      tool_choice: { type: "function", function: { name: toolName } },
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Groq API request failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  const rawArguments = toolCall?.function?.arguments;
  if (typeof rawArguments !== "string") {
    throw new Error("Groq did not return a structured tool call.");
  }

  try {
    return JSON.parse(rawArguments);
  } catch {
    throw new Error("Groq's tool call arguments were not valid JSON.");
  }
}

function isValidJobDescription(value: unknown): value is JobDescriptionOutput {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<JobDescriptionOutput>;
  return (
    typeof v.jobTitle === "string" &&
    typeof v.summary === "string" &&
    Array.isArray(v.responsibilities) &&
    Array.isArray(v.qualifications) &&
    Array.isArray(v.requiredSkills) &&
    Array.isArray(v.preferredSkills)
  );
}

function isValidCompanyPost(value: unknown): value is CompanyPostOutput {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { caption?: unknown }).caption === "string"
  );
}

function isValidBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Partial<RequestBody> & { prompt?: unknown };
  if (typeof b.prompt !== "string" || b.prompt.trim().length === 0) return false;
  if (b.mode === "job_description") return true;
  if (b.mode === "company_post") {
    return (
      typeof (b as { postType?: unknown }).postType === "string" &&
      Object.prototype.hasOwnProperty.call(
        COMPANY_POST_TYPE_LABELS,
        (b as { postType: string }).postType,
      )
    );
  }
  return false;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header." }, 401);
    }

    // Scoped to the caller's own JWT, same as seed-copilot/index.ts — this
    // function makes no DB calls of its own, but verifying here still
    // protects the shared Groq quota from unauthenticated abuse.
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: "Not authenticated." }, 401);
    }

    const body: unknown = await req.json().catch(() => null);
    if (!isValidBody(body)) {
      return jsonResponse(
        { error: "Expected { mode: 'job_description', prompt } or { mode: 'company_post', postType, prompt }." },
        400,
      );
    }

    try {
      if (body.mode === "job_description") {
        const raw = await callGroqTool(
          JOB_DESCRIPTION_SYSTEM_PROMPT,
          body.prompt,
          JOB_DESCRIPTION_TOOL_NAME,
          JOB_DESCRIPTION_SCHEMA,
          900,
        );
        if (!isValidJobDescription(raw)) {
          throw new Error("Groq did not return a valid job description draft.");
        }
        return jsonResponse(raw);
      }

      const raw = await callGroqTool(
        companyPostSystemPrompt(body.postType),
        body.prompt,
        COMPANY_POST_TOOL_NAME,
        COMPANY_POST_SCHEMA,
        500,
      );
      if (!isValidCompanyPost(raw)) {
        throw new Error("Groq did not return a valid company post draft.");
      }
      return jsonResponse(raw);
    } catch (err) {
      console.error("[generate-recruiter-content] AI provider call failed", err);
      return jsonResponse(
        { error: "The AI provider is temporarily unavailable. Please try again." },
        502,
      );
    }
  } catch (err) {
    console.error("[generate-recruiter-content] caught an error before responding:", err);
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return jsonResponse({ error: message }, 500);
  }
});
