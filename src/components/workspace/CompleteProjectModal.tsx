import { useState } from "react";
import { motion } from "framer-motion";
import { X, CheckCircle2, Circle, Trophy } from "lucide-react";

export interface CompletionChecklistItem {
  key: string;
  label: string;
  done: boolean;
  optional?: boolean;
}

interface CompleteProjectModalProps {
  projectTitle: string;
  checklist: CompletionChecklistItem[];
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

// Informative, not a hard blocker — every item can be unchecked and
// "Mark as Complete" still works. This only ever appears after the
// candidate clicks "Mark Project as Complete" themselves; nothing here
// runs automatically off AI messages or achievement counts.
export default function CompleteProjectModal({
  projectTitle,
  checklist,
  onClose,
  onConfirm,
}: CompleteProjectModalProps) {
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
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
        className="w-full max-w-md rounded-3xl border border-border bg-canvas-elevated p-8 shadow-[0_24px_64px_-24px_rgba(26,28,25,0.4)]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">
            Mark &quot;{projectTitle}&quot; as Complete?
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <p className="mt-1.5 text-sm text-ink-soft">
          This is just a helpful check — nothing here blocks completion.
        </p>

        <ul className="mt-5 space-y-2.5">
          {checklist.map((item) => (
            <li key={item.key} className="flex items-start gap-2.5">
              {item.done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" strokeWidth={2} />
              )}
              <span className={item.done ? "text-sm text-ink" : "text-sm text-ink-faint"}>
                {item.label}
                {item.optional && (
                  <span className="ml-1.5 text-xs text-ink-faint">(optional)</span>
                )}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-7 flex items-center justify-end gap-3 border-t border-border pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trophy className="h-3.5 w-3.5" strokeWidth={2} />
            {submitting ? "Completing…" : "Mark as Complete"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
