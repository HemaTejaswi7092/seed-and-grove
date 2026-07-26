import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { X, Globe, Lock, Share2 } from "lucide-react";
import type { FeedPostVisibility } from "../../types/feed";

interface ShareToFeedModalProps {
  projectTitle: string;
  evidenceSummary: string | null;
  skills: string[];
  defaultCaption: string;
  onClose: () => void;
  onPublish: (input: {
    caption: string;
    visibility: FeedPostVisibility;
  }) => Promise<void>;
}

// Mounted by the caller only while there's something to share (Seed.tsx
// renders `{shareState && <ShareToFeedModal ... />}`) rather than taking
// an `open` prop — same fix as EditGroveModal: a fresh mount per open
// means useState's initial value is always current, no effect needed to
// re-sync a stale draft.
export default function ShareToFeedModal({
  projectTitle,
  evidenceSummary,
  skills,
  defaultCaption,
  onClose,
  onPublish,
}: ShareToFeedModalProps) {
  const [caption, setCaption] = useState(defaultCaption);
  const [visibility, setVisibility] = useState<FeedPostVisibility>("public");
  const [status, setStatus] = useState<"idle" | "publishing" | "error">("idle");
  const [errorText, setErrorText] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!caption.trim() || status === "publishing") return;
    setStatus("publishing");
    setErrorText(null);
    try {
      await onPublish({ caption: caption.trim(), visibility });
    } catch (err) {
      setStatus("error");
      setErrorText(
        err instanceof Error ? err.message : "Couldn't share this to the feed.",
      );
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 px-4 py-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-3xl border border-border bg-canvas-elevated p-8 shadow-[0_24px_64px_-24px_rgba(26,28,25,0.4)]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Share to Feed</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="rounded-2xl border border-border bg-canvas p-4">
            <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
              What you're sharing
            </p>
            <p className="mt-1.5 text-sm font-semibold text-ink">
              {projectTitle}
            </p>
            {evidenceSummary && (
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                {evidenceSummary}
              </p>
            )}
            {skills.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-ink-soft"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          <label className="block">
            <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
              Caption
            </span>
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
              placeholder="Say a bit about this update..."
            />
          </label>

          <div>
            <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
              Visibility
            </span>
            <div className="mt-1.5 flex gap-2">
              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={[
                  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  visibility === "public"
                    ? "border-accent-soft-border bg-accent-soft text-accent-dark"
                    : "border-border text-ink-soft hover:border-ink-faint",
                ].join(" ")}
              >
                <Globe className="h-3.5 w-3.5" strokeWidth={2} />
                Public feed
              </button>
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className={[
                  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  visibility === "private"
                    ? "border-accent-soft-border bg-accent-soft text-accent-dark"
                    : "border-border text-ink-soft hover:border-ink-faint",
                ].join(" ")}
              >
                <Lock className="h-3.5 w-3.5" strokeWidth={2} />
                Only me
              </button>
            </div>
          </div>

          {status === "error" && errorText && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorText}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={status === "publishing"}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "publishing" || !caption.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Share2 className="h-3.5 w-3.5" strokeWidth={2} />
              {status === "publishing" ? "Publishing…" : "Publish"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
