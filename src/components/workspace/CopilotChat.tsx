import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, ShieldCheck, ChevronDown, X } from "lucide-react";
import { generateCopilotResponse } from "../../services/ai/aiClient";
import {
  addSeedActivity,
  addSeedMessage,
  addTimelineEvent,
  getSeedTimeline,
} from "../../state/seedStore";
import { createAchievement } from "../../state/achievements";
import { evidenceSuggestionToFormValues } from "../../lib/evidenceSuggestion";
import AchievementReviewModal from "./AchievementReviewModal";
import type { Seed, SeedActivityItem, SeedConversationMessage, Achievement } from "../../types/seed";
import type { EvidenceSuggestion, RetrievedContextItem } from "../../services/ai/types";

interface CopilotChatProps {
  seed: Seed;
  userId: string | null;
  initialMessages: SeedConversationMessage[];
  activity: SeedActivityItem[];
  achievements: Achievement[];
  persist: boolean;
  // Called after an achievement or activity is written to the store, so
  // the parent page can re-read it and refresh the Achievements panel/
  // stats — this component has no reactive link to Seed.tsx otherwise.
  onDataCaptured?: () => void;
  // Stamped on the Community Feed post if the Copilot's "Save as
  // Achievement" flow saves it as published — see Seed.tsx's authorName.
  // Falls back to a generic label rather than requiring every caller to
  // resolve a display name just for this.
  authorName?: string;
}

type SendStatus = "idle" | "sending" | "error";
type EvidenceStatus = "pending" | "saved" | "dismissed";

// Per-AI-message extras that don't belong on the persisted
// SeedConversationMessage record itself: an evidence suggestion awaiting
// the candidate's review (see the product rule — nothing is ever
// auto-published, and the candidate edits every field before it's saved
// as an Achievement), and the memory this reply was grounded in ("Why
// this answer?"). Both are session-only, keyed by message id, and don't
// survive a refresh — the saved/dismissed choice is the only durable
// outcome (it's written via state/achievements.ts's createAchievement).
interface MessageExtra {
  evidenceSuggestion?: EvidenceSuggestion;
  evidenceStatus?: EvidenceStatus;
  retrievedContext?: RetrievedContextItem[];
}

// Kept outside the component: an ephemeral (non-persisted, demo-mode)
// message id just needs to be unique for a React key, but generating it
// inline inside the component body trips the React Compiler's purity
// check for impure calls reachable from render.
function createEphemeralMessage(
  role: "user" | "ai",
  seedId: string,
  content: string,
): SeedConversationMessage {
  return {
    id: `${role}-${Date.now()}`,
    seedId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

const STARTER_PROMPTS = [
  { label: "Suggest project ideas", prompt: "Can you suggest some project ideas?" },
  { label: "Create a project plan", prompt: "Create a project plan for me." },
  { label: "Help me get started", prompt: "Help me get started." },
  { label: "Explain this project", prompt: "Explain this project." },
  { label: "Recommend the next step", prompt: "Recommend the next step." },
];

// Splits AI message content on ```fenced``` code blocks so responses that
// include starter code render as an actual code block instead of one
// run-together line. Everything outside a fence stays plain text.
function renderMessageContent(content: string): ReactNode[] {
  const parts = content.split(/```(\w*)\n?([\s\S]*?)```/g);
  const nodes: ReactNode[] = [];
  for (let i = 0; i < parts.length; i += 3) {
    const text = parts[i];
    if (text) {
      nodes.push(
        <p key={`t-${i}`} className="whitespace-pre-wrap">
          {text.trim()}
        </p>,
      );
    }
    const code = parts[i + 2];
    if (code !== undefined) {
      nodes.push(
        <pre
          key={`c-${i}`}
          className="overflow-x-auto rounded-lg bg-ink px-3 py-2.5 text-xs text-white"
        >
          <code>{code.trim()}</code>
        </pre>,
      );
    }
  }
  return nodes;
}

export default function CopilotChat({
  seed,
  userId,
  initialMessages,
  activity,
  achievements,
  persist,
  onDataCaptured,
  authorName = "A builder",
}: CopilotChatProps) {
  const [messages, setMessages] = useState<SeedConversationMessage[]>(
    initialMessages,
  );
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<SendStatus>("idle");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [messageExtras, setMessageExtras] = useState<Record<string, MessageExtra>>({});
  const [expandedContext, setExpandedContext] = useState<Set<string>>(new Set());
  const [reviewMessageId, setReviewMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  function appendMessage(role: "user" | "ai", content: string): SeedConversationMessage {
    const message: SeedConversationMessage =
      persist && userId
        ? addSeedMessage(userId, seed.id, role, content)
        : createEphemeralMessage(role, seed.id, content);
    setMessages((prev) => [...prev, message]);
    return message;
  }

  async function requestReply(
    userText: string,
    historyForContext: SeedConversationMessage[],
  ) {
    setStatus("sending");
    setErrorText(null);

    try {
      const response = await generateCopilotResponse({
        user: { id: userId, displayName: null },
        seed,
        recentMessages: historyForContext,
        activity,
        achievements,
        message: userText,
      });

      const aiMessage = appendMessage("ai", response.content);

      // Evidence is never auto-published — only tracked here so the
      // confirm/dismiss card can render, and only written to the Seed's
      // record via handleConfirmEvidence below, on explicit user action.
      // Not offered at all in non-persisting (demo) mode, where there's no
      // real Seed record to write it to.
      if (persist && (response.evidenceSuggestion || response.retrievedContext?.length)) {
        setMessageExtras((prev) => ({
          ...prev,
          [aiMessage.id]: {
            evidenceSuggestion: response.evidenceSuggestion,
            evidenceStatus: response.evidenceSuggestion ? "pending" : undefined,
            retrievedContext: response.retrievedContext,
          },
        }));
      }

      if (persist && userId && response.activityContent) {
        addSeedActivity(userId, seed.id, "progress", response.activityContent);
        onDataCaptured?.();
      }

      // Timeline-worthy exactly once per Seed — the AI producing its
      // first real plan is a meaningful project milestone, but every
      // later "asking_for_plan" reply is just ongoing conversation (see
      // types/seed.ts's TimelineEvent — never logged per chat message).
      if (persist && userId && response.intent === "asking_for_plan") {
        const hasPlanEvent = getSeedTimeline(userId, seed.id).some(
          (event) => event.type === "ai_plan_generated",
        );
        if (!hasPlanEvent) {
          addTimelineEvent(userId, seed.id, "ai_plan_generated");
          onDataCaptured?.();
        }
      }

      setStatus("idle");
      setPendingText(null);
    } catch (err) {
      setStatus("error");
      setErrorText(
        err instanceof Error
          ? err.message
          : "Something went wrong generating a response.",
      );
      setPendingText(userText);
    }
  }

  function sendText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || status === "sending") return;
    const userMessage = appendMessage("user", trimmed);
    setInput("");
    void requestReply(trimmed, [...messages, userMessage]);
  }

  function handleSend() {
    sendText(input);
  }

  function handleRetry() {
    if (pendingText) void requestReply(pendingText, messages);
  }

  async function handleSaveAchievement(input: Parameters<typeof createAchievement>[2]) {
    if (!reviewMessageId || !userId) return;
    await createAchievement(userId, seed.id, input, authorName);
    const messageId = reviewMessageId;
    setMessageExtras((prev) => ({
      ...prev,
      [messageId]: { ...prev[messageId], evidenceStatus: "saved" },
    }));
    setReviewMessageId(null);
    onDataCaptured?.();
  }

  function handleDismissEvidence(messageId: string) {
    setMessageExtras((prev) => ({
      ...prev,
      [messageId]: { ...prev[messageId], evidenceStatus: "dismissed" },
    }));
  }

  function toggleContext(messageId: string) {
    setExpandedContext((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  }

  return (
    <div className="flex h-[560px] flex-col overflow-hidden rounded-2xl border border-border bg-canvas-elevated">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Bot className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">AI Copilot</p>
          <p className="text-xs text-ink-faint">
            Ready — using your Seed&apos;s context
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-5 py-5"
      >
        {messages.map((message) => {
          const extra = messageExtras[message.id];
          const isContextExpanded = expandedContext.has(message.id);

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={[
                "flex flex-col gap-1.5",
                message.role === "user" ? "items-end" : "items-start",
              ].join(" ")}
            >
              <div
                className={[
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  message.role === "user"
                    ? "rounded-br-sm bg-ink text-white"
                    : "rounded-bl-sm border border-accent-soft-border bg-accent-soft text-ink",
                ].join(" ")}
              >
                <div className="flex flex-col gap-2">
                  {renderMessageContent(message.content)}
                </div>
              </div>

              {extra?.evidenceStatus === "pending" && extra.evidenceSuggestion && (
                <div className="w-full max-w-[85%] rounded-xl border border-accent-soft-border bg-canvas px-3.5 py-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-accent-dark">
                    <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                    Possible achievement: {extra.evidenceSuggestion.category}
                  </div>
                  <p className="mt-1.5 text-sm text-ink">
                    {extra.evidenceSuggestion.title}
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewMessageId(message.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-dark"
                    >
                      <ShieldCheck className="h-3 w-3" strokeWidth={2.5} />
                      Save as Achievement
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDismissEvidence(message.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
                    >
                      <X className="h-3 w-3" strokeWidth={2.5} />
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {extra?.evidenceStatus === "saved" && (
                <p className="flex items-center gap-1 text-[11px] font-medium text-accent-dark">
                  <ShieldCheck className="h-3 w-3" strokeWidth={2} />
                  Saved as an achievement
                </p>
              )}

              {!!extra?.retrievedContext?.length && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleContext(message.id)}
                    className="flex items-center gap-1 text-[11px] font-medium text-ink-faint transition-colors hover:text-ink-soft"
                  >
                    Why this answer?
                    <ChevronDown
                      className={[
                        "h-3 w-3 transition-transform",
                        isContextExpanded ? "rotate-180" : "",
                      ].join(" ")}
                      strokeWidth={2}
                    />
                  </button>
                  {isContextExpanded && (
                    <ul className="mt-1.5 max-w-[85%] space-y-1 rounded-lg border border-border bg-canvas px-3 py-2">
                      {extra.retrievedContext.map((item, index) => (
                        <li
                          key={`${message.id}-ctx-${index}`}
                          className="text-[11px] leading-snug text-ink-soft"
                        >
                          <span className="font-medium text-ink-faint">
                            {item.sourceType}:
                          </span>{" "}
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}

        <AnimatePresence>
          {status === "sending" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-accent-soft-border bg-accent-soft px-4 py-3">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent"
                    style={{ animationDelay: `${dot * 0.12}s` }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3">
          {STARTER_PROMPTS.map((starter) => (
            <button
              key={starter.label}
              type="button"
              onClick={() => sendText(starter.prompt)}
              disabled={status === "sending"}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent-dark disabled:opacity-50"
            >
              {starter.label}
            </button>
          ))}
        </div>
      )}

      {status === "error" && errorText && (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-red-50 px-5 py-2.5 text-xs text-red-700">
          <span>{errorText}</span>
          <button
            type="button"
            onClick={handleRetry}
            className="shrink-0 font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-canvas px-3 py-2">
          <Sparkles className="h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSend();
            }}
            type="text"
            placeholder="Ask for guidance, share progress, or describe where you're stuck…"
            disabled={status === "sending"}
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={status === "sending" || !input.trim()}
            aria-label="Send message"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>
        </div>
      </div>

      {reviewMessageId && messageExtras[reviewMessageId]?.evidenceSuggestion && (
        <AchievementReviewModal
          mode="create"
          initial={evidenceSuggestionToFormValues(
            messageExtras[reviewMessageId].evidenceSuggestion!,
            "private",
          )}
          onClose={() => setReviewMessageId(null)}
          onSave={handleSaveAchievement}
        />
      )}
    </div>
  );
}
