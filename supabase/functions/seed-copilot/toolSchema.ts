// The structured-output contract every AI provider must fill — defined
// once, provider-agnostic, so claude.ts and groq.ts (and any future
// provider) describe exactly the same shape to their model instead of two
// hand-copies silently drifting apart. Each provider wraps this JSON
// schema in its own wire format:
//   - Anthropic: { name, description, input_schema: COPILOT_RESPONSE_SCHEMA }
//   - OpenAI-compatible (Groq, and later OpenAI itself):
//     { type: "function", function: { name, description, parameters: COPILOT_RESPONSE_SCHEMA } }

export const TOOL_NAME = "provide_copilot_response";

export const TOOL_DESCRIPTION =
  "Provide the reply shown to the builder, plus optional structured signals about what's durable enough to remember or strong enough to count as evidence.";

// Forced tool-use, not "ask the model to emit JSON in prose" — the model
// literally cannot reply without filling this schema, so there's no
// free-text parsing/guessing on our end. memoryCandidate/evidenceCandidate
// are optional: the model omits them entirely for messages that don't
// warrant either (a plain question, small talk), which is what keeps
// memory writes to durable facts instead of every turn.
export const COPILOT_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    message: {
      type: "string",
      description: "The reply shown to the user, in full prose.",
    },
    memoryCandidate: {
      type: "object",
      description:
        "Only include this if the user's message stated a durable, reusable fact worth recalling in a future session — a project goal, a dataset, an architecture or technical decision, a completed milestone, a measurable result, or a stated preference. Do NOT include this for questions, plans not yet decided on, or small talk.",
      properties: {
        sourceType: {
          type: "string",
          enum: [
            "project_goal",
            "dataset",
            "architecture_decision",
            "technical_decision",
            "milestone",
            "measurable_result",
            "user_preference",
            "project_note",
          ],
        },
        content: {
          type: "string",
          description:
            "A short, self-contained statement of the fact — written so it makes sense on its own in a future conversation with no other context.",
        },
      },
      required: ["sourceType", "content"],
    },
    evidenceCandidate: {
      type: "object",
      description:
        "Only include this if the user reported specific, verifiable completed work (an implementation, a fix, a measurable improvement) — never for questions or stated plans/intentions. This pre-fills a review form the candidate always edits and approves before anything is saved, so it's fine to be a best-effort guess rather than certain.",
      properties: {
        title: { type: "string" },
        summary: { type: "string" },
        category: { type: "string" },
        confidence: { type: "string", enum: ["low", "medium", "high"] },
        skillsDemonstrated: {
          type: "array",
          items: { type: "string" },
          description: "Specific skills this work demonstrates, e.g. [\"SQL\", \"Data Modeling\"]. Omit if unclear.",
        },
        technologiesUsed: {
          type: "array",
          items: { type: "string" },
          description: "Specific technologies/tools/libraries used, e.g. [\"PostgreSQL\", \"Power BI\"]. Omit if unclear.",
        },
        projectDomain: {
          type: "string",
          description: "A short label for the problem domain, e.g. \"Computer Vision\" or \"E-commerce Analytics\". Omit if unclear.",
        },
        relevantRoles: {
          type: "array",
          items: { type: "string" },
          description: "Professional roles this achievement is relevant evidence for, e.g. [\"Data Analyst\", \"BI Developer\"]. Omit if unclear.",
        },
        candidateContribution: {
          type: "string",
          description: "What specifically the candidate did, in their own words from the message — not a generic restatement.",
        },
        outcomeOrImpact: {
          type: "string",
          description: "The measurable or observed result, if the message states one.",
        },
      },
      required: ["title", "summary", "category", "confidence"],
    },
  },
  required: ["message"],
};

// Shared validation — both providers parse a JSON object off the wire and
// must agree on what "valid" means before it's trusted as CopilotToolOutput.
export function isValidToolOutput(
  value: unknown,
): value is { message: string; [key: string]: unknown } {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { message?: unknown }).message === "string"
  );
}
