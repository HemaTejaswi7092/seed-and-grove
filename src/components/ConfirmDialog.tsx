import { useState } from "react";
import { motion } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  // Throw to signal failure — the dialog stays open and shows the error
  // inline instead of closing, so a failed action never reads as if it
  // silently succeeded. Only the caller closes the dialog, by unmounting
  // it once onConfirm resolves without throwing.
  onConfirm: () => Promise<void>;
}

// A real in-app modal, not window.confirm — native confirm() blocks the
// whole tab synchronously (including browser-automation/testing tools)
// and has no way to show a follow-up error if the confirmed action fails.
export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  destructive,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const [status, setStatus] = useState<"idle" | "confirming" | "error">("idle");
  const [errorText, setErrorText] = useState<string | null>(null);

  async function handleConfirm() {
    setStatus("confirming");
    setErrorText(null);
    try {
      await onConfirm();
    } catch (err) {
      setStatus("error");
      setErrorText(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 px-4 py-10 backdrop-blur-sm"
      onClick={status === "confirming" ? undefined : onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-border bg-canvas-elevated p-6 shadow-[0_24px_64px_-24px_rgba(26,28,25,0.4)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={status === "confirming"}
            aria-label="Cancel"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink disabled:opacity-50"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p>

        {status === "error" && errorText && (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            {errorText}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={status === "confirming"}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={status === "confirming"}
            className={[
              "rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              destructive
                ? "bg-red-600 shadow-red-600/20 hover:bg-red-700"
                : "bg-accent shadow-accent/20 hover:bg-accent-dark",
            ].join(" ")}
          >
            {status === "confirming" ? "Working…" : confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
