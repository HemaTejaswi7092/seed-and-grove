import { useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  Globe,
  Loader2,
  Lock,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import AchievementReviewModal from "./AchievementReviewModal";
import {
  buildEmptyAchievementFormValues,
  evidenceSuggestionToCreateInput,
  evidenceSuggestionToFormValues,
} from "../../lib/evidenceSuggestion";
import type { CreateAchievementInput } from "../../state/seedStore";
import type { EvidenceSuggestion } from "../../services/ai/types";
import type { Seed } from "../../types/seed";

type SuggestionStatus = "pending" | "saving" | "published" | "drafted" | "dismissed" | "error";

interface ProjectCompletionWorkflowProps {
  seed: Seed;
  // null = AI generation still in flight. An empty array means the AI
  // call succeeded but found nothing credible — still distinct from
  // aiUnavailable, which means the call itself failed.
  suggestions: EvidenceSuggestion[] | null;
  aiUnavailable: boolean;
  // Live count of achievements already logged for this Seed (of any
  // visibility) — recomputed by Seed.tsx on every store write, so this
  // updates the instant a suggestion or a manual entry is saved. The
  // completion gate reads this directly rather than tracking its own
  // running total.
  achievementCount: number;
  onClose: () => void;
  onSaveAchievement: (input: CreateAchievementInput) => Promise<void>;
  // Only ever invoked while achievementCount > 0 — the button that calls
  // this is disabled otherwise, so this never needs to re-check the gate
  // itself.
  onComplete: () => Promise<void>;
}

// Replaces the old CompleteProjectModal + AchievementSuggestionsReview
// pair. "Complete Project" now opens this instead of completing
// immediately: the project isn't marked Completed until the candidate
// has logged at least one achievement here, whether that came from an
// AI suggestion or a manual entry. Closing without doing that leaves the
// project exactly as it was — still in_progress.
export default function ProjectCompletionWorkflow({
  seed,
  suggestions,
  aiUnavailable,
  achievementCount,
  onClose,
  onSaveAchievement,
  onComplete,
}: ProjectCompletionWorkflowProps) {
  const [manualOpen, setManualOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const loading = suggestions === null && !aiUnavailable;
  const hasAchievements = achievementCount > 0;

  async function handleManualSave(input: CreateAchievementInput) {
    await onSaveAchievement(input);
    setManualOpen(false);
  }

  async function handleComplete() {
    if (!hasAchievements || completing) return;
    setCompleting(true);
    setCompleteError(null);
    try {
      await onComplete();
    } catch (err) {
      setCompleteError(
        err instanceof Error ? err.message : "Couldn't mark this project as completed.",
      );
    } finally {
      setCompleting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 px-4 py-10 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-2xl rounded-3xl border border-border bg-canvas-elevated p-8 shadow-[0_24px_64px_-24px_rgba(26,28,25,0.4)]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Trophy className="h-4 w-4" strokeWidth={2} />
            </span>
            <h2 className="text-lg font-semibold text-ink">Complete "{seed.title}"</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          A completed project needs at least one achievement as evidence. Review the AI's
          suggestions below, or add one yourself — nothing is saved or published until you
          choose an action for it.
        </p>

        <div className="mt-6 max-h-[52vh] space-y-4 overflow-y-auto pr-1">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-12 text-center">
              <Loader2 className="h-5 w-5 animate-spin text-accent" strokeWidth={2} />
              <p className="text-sm text-ink-soft">
                Analyzing your completed work for achievements…
              </p>
            </div>
          )}

          {!loading && aiUnavailable && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
              <Sparkles className="h-5 w-5 text-ink-faint" strokeWidth={2} />
              <p className="text-sm text-ink-soft">
                Achievement suggestions are temporarily unavailable.
              </p>
              <p className="text-xs text-ink-faint">
                Add at least one achievement manually to complete this project.
              </p>
            </div>
          )}

          {!loading && !aiUnavailable && suggestions && suggestions.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
              <Award className="h-5 w-5 text-ink-faint" strokeWidth={2} />
              <p className="text-sm text-ink-soft">No credible suggestions found.</p>
              <p className="text-xs text-ink-faint">
                Add at least one achievement manually to complete this project.
              </p>
            </div>
          )}

          {!loading && !aiUnavailable && suggestions && suggestions.length > 0 && (
            <CompletionSuggestionCards
              suggestions={suggestions}
              onSaveAchievement={onSaveAchievement}
            />
          )}

          {!loading && (
            <button
              type="button"
              onClick={() => setManualOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border py-3 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Add Achievement Manually
            </button>
          )}
        </div>

        <div className="mt-6 space-y-3 border-t border-border pt-6">
          <div className="flex items-center gap-2 text-xs font-medium">
            {hasAchievements ? (
              <span className="inline-flex items-center gap-1.5 text-accent-dark">
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                {achievementCount === 1
                  ? "1 achievement logged — ready to complete."
                  : `${achievementCount} achievements logged — ready to complete.`}
              </span>
            ) : (
              <span className="text-ink-faint">
                At least one achievement is required before this project can be marked
                Completed.
              </span>
            )}
          </div>

          {completeError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {completeError}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!hasAchievements || completing}
              onClick={handleComplete}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {completing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
              ) : (
                <Trophy className="h-3.5 w-3.5" strokeWidth={2} />
              )}
              Mark Project as Completed
            </button>
          </div>
        </div>
      </motion.div>

      {manualOpen && (
        <AchievementReviewModal
          mode="create"
          initial={buildEmptyAchievementFormValues(seed)}
          onClose={() => setManualOpen(false)}
          onSave={handleManualSave}
        />
      )}
    </motion.div>
  );
}

// Split out from the parent so its per-suggestion statuses/errors state
// can be sized correctly via useState's lazy initializer: this only ever
// mounts once `suggestions` has actually landed (never during the
// loading state), so there's no async prop transition to resync against
// after mount — no effect required.
function CompletionSuggestionCards({
  suggestions,
  onSaveAchievement,
}: {
  suggestions: EvidenceSuggestion[];
  onSaveAchievement: (input: CreateAchievementInput) => Promise<void>;
}) {
  const [statuses, setStatuses] = useState<SuggestionStatus[]>(() =>
    suggestions.map(() => "pending"),
  );
  const [errors, setErrors] = useState<(string | null)[]>(() => suggestions.map(() => null));
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function setStatus(index: number, status: SuggestionStatus) {
    setStatuses((prev) => prev.map((value, i) => (i === index ? status : value)));
  }

  function setError(index: number, message: string | null) {
    setErrors((prev) => prev.map((value, i) => (i === index ? message : value)));
  }

  async function handleQuickSave(index: number, visibility: "published" | "private") {
    if (statuses[index] === "saving") return;
    setStatus(index, "saving");
    setError(index, null);
    try {
      await onSaveAchievement(evidenceSuggestionToCreateInput(suggestions[index], visibility));
      setStatus(index, visibility === "published" ? "published" : "drafted");
    } catch (err) {
      setStatus(index, "error");
      setError(index, err instanceof Error ? err.message : "Couldn't save this achievement.");
    }
  }

  function handleDismiss(index: number) {
    setStatus(index, "dismissed");
  }

  async function handleEditSave(input: CreateAchievementInput) {
    if (editingIndex === null) return;
    await onSaveAchievement(input);
    setStatus(editingIndex, input.visibility === "published" ? "published" : "drafted");
    setEditingIndex(null);
  }

  return (
    <>
      {suggestions.map((suggestion, index) => {
        const status = statuses[index];
        const resolved = status !== "pending" && status !== "saving" && status !== "error";
        return (
          <div key={index} className="rounded-2xl border border-border bg-canvas p-5">
            <p className="text-sm font-semibold text-ink">{suggestion.title}</p>
            {suggestion.description && (
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                {suggestion.description}
              </p>
            )}

            {((suggestion.skillsDemonstrated?.length ?? 0) > 0 ||
              (suggestion.technologiesUsed?.length ?? 0) > 0) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(suggestion.skillsDemonstrated ?? []).map((skill) => (
                  <span
                    key={`skill-${skill}`}
                    className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent-dark"
                  >
                    {skill}
                  </span>
                ))}
                {(suggestion.technologiesUsed ?? []).map((tech) => (
                  <span
                    key={`tech-${tech}`}
                    className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-ink-soft"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}

            {suggestion.outcomeOrImpact && (
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                <span className="font-medium text-ink">Outcome: </span>
                {suggestion.outcomeOrImpact}
              </p>
            )}

            {status === "error" && errors[index] && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                {errors[index]}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              {resolved ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint">
                  {status === "published" && (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
                      Published to Grove
                    </>
                  )}
                  {status === "drafted" && (
                    <>
                      <Lock className="h-3.5 w-3.5" strokeWidth={2} />
                      Saved as draft
                    </>
                  )}
                  {status === "dismissed" && "Dismissed"}
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={status === "saving"}
                    onClick={() => handleQuickSave(index, "published")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Globe className="h-3.5 w-3.5" strokeWidth={2} />
                    Publish to Grove
                  </button>
                  <button
                    type="button"
                    disabled={status === "saving"}
                    onClick={() => handleQuickSave(index, "private")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Lock className="h-3.5 w-3.5" strokeWidth={2} />
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    disabled={status === "saving"}
                    onClick={() => setEditingIndex(index)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={status === "saving"}
                    onClick={() => handleDismiss(index)}
                    className="ml-auto text-xs font-medium text-ink-faint transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Dismiss
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}

      {editingIndex !== null && (
        <AchievementReviewModal
          mode="create"
          initial={evidenceSuggestionToFormValues(suggestions[editingIndex], "published")}
          onClose={() => setEditingIndex(null)}
          onSave={handleEditSave}
        />
      )}
    </>
  );
}
