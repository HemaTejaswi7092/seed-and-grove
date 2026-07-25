import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles } from "lucide-react";
import { generateCopilotResponse } from "../../services/ai/aiClient";
import { addSeedActivity, addSeedEvidence, addSeedMessage } from "../../state/seedStore";
import type { Seed, SeedActivityItem, SeedConversationMessage, SeedEvidenceItem } from "../../types/seed";

interface CopilotChatProps {
  seed: Seed;
  userId: string | null;
  initialMessages: SeedConversationMessage[];
  activity: SeedActivityItem[];
  evidence: SeedEvidenceItem[];
  persist: boolean;
  // Called after evidence or activity is written to the store, so the
  // parent page can re-read it and refresh the Evidence panel/stats —
  // this component has no reactive link to Seed.tsx otherwise.
  onDataCaptured?: () => void;
}

type SendStatus = "idle" | "sending" | "error";

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
  evidence,
  persist,
  onDataCaptured,
}: CopilotChatProps) {
  const [messages, setMessages] = useState<SeedConversationMessage[]>(
    initialMessages,
  );
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<SendStatus>("idle");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);
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
        evidence,
        message: userText,
      });

      appendMessage("ai", response.content);

      if (persist && userId) {
        if (response.evidenceSuggestion) {
          addSeedEvidence(userId, seed.id, response.evidenceSuggestion);
        }
        if (response.activityContent) {
          addSeedActivity(userId, seed.id, "progress", response.activityContent);
        }
        if (response.evidenceSuggestion || response.activityContent) {
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
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={
              message.role === "user"
                ? "flex justify-end"
                : "flex justify-start"
            }
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
          </motion.div>
        ))}

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
    </div>
  );
}
