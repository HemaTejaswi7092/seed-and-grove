import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { X, Check, ChevronDown, ChevronRight } from "lucide-react";
import { ACHIEVEMENT_TYPES } from "../../types/seed";
import type { AchievementType, AchievementVisibility } from "../../types/seed";
import type { CreateAchievementInput } from "../../state/seedStore";

const inputClasses =
  "mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none";
const labelClasses = "text-xs font-medium tracking-wide text-ink-faint uppercase";

const TYPE_LABELS: Record<AchievementType, string> = {
  project: "Project",
  milestone: "Milestone",
  code: "Code",
  dashboard: "Dashboard",
  document: "Document",
  certification: "Certification",
  deployment: "Deployment",
  research: "Research",
  presentation: "Presentation",
  award: "Award",
};

function parseList(text: string): string[] {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export interface AchievementReviewFormValues {
  title: string;
  shortDescription: string;
  achievementType: AchievementType;
  skillsDemonstrated: string;
  technologiesUsed: string;
  projectDomain: string;
  candidateContribution: string;
  outcomeOrImpact: string;
  proofUrl: string;
  proofLabel: string;
  relevantRoles: string;
  visibility: AchievementVisibility;
}

interface AchievementReviewModalProps {
  mode: "create" | "edit";
  initial: AchievementReviewFormValues;
  onClose: () => void;
  onSave: (input: CreateAchievementInput) => Promise<void>;
}

// Shared by both "Save as Achievement" (CopilotChat's suggestion card,
// mode="create") and "Edit" (the Achievements tab's overflow menu,
// mode="edit") — one form, one set of fields, so the two flows can never
// drift apart. Every field the AI might have guessed is editable here;
// nothing is saved until the candidate explicitly submits this form.
export default function AchievementReviewModal({
  mode,
  initial,
  onClose,
  onSave,
}: AchievementReviewModalProps) {
  const [title, setTitle] = useState(initial.title);
  const [shortDescription, setShortDescription] = useState(initial.shortDescription);
  const [achievementType, setAchievementType] = useState(initial.achievementType);
  const [skillsDemonstrated, setSkillsDemonstrated] = useState(initial.skillsDemonstrated);
  const [technologiesUsed, setTechnologiesUsed] = useState(initial.technologiesUsed);
  const [projectDomain, setProjectDomain] = useState(initial.projectDomain);
  const [candidateContribution, setCandidateContribution] = useState(initial.candidateContribution);
  const [outcomeOrImpact, setOutcomeOrImpact] = useState(initial.outcomeOrImpact);
  const [proofUrl, setProofUrl] = useState(initial.proofUrl);
  const [proofLabel, setProofLabel] = useState(initial.proofLabel);
  const [relevantRoles, setRelevantRoles] = useState(initial.relevantRoles);
  const [visibility, setVisibility] = useState(initial.visibility);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorText, setErrorText] = useState<string | null>(null);
  // Collapsed by default so creating an achievement only ever asks for
  // the essentials — editing an existing record starts expanded since
  // there's usually already-meaningful data back there worth seeing.
  const [detailsOpen, setDetailsOpen] = useState(mode === "edit");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || status === "saving") return;
    setStatus("saving");
    setErrorText(null);
    try {
      await onSave({
        title: title.trim(),
        shortDescription: shortDescription.trim(),
        achievementType,
        skillsDemonstrated: parseList(skillsDemonstrated),
        technologiesUsed: parseList(technologiesUsed),
        projectDomain: projectDomain.trim(),
        candidateContribution: candidateContribution.trim(),
        outcomeOrImpact: outcomeOrImpact.trim(),
        proofUrl: proofUrl.trim() || null,
        proofLabel: proofLabel.trim() || null,
        relevantRoles: parseList(relevantRoles),
        visibility,
      });
    } catch (err) {
      setStatus("error");
      setErrorText(
        err instanceof Error ? err.message : "Couldn't save this achievement.",
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
        className="w-full max-w-xl rounded-3xl border border-border bg-canvas-elevated p-8 shadow-[0_24px_64px_-24px_rgba(26,28,25,0.4)]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">
            {mode === "create" ? "Save as Achievement" : "Edit Achievement"}
          </h2>
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
          Review and edit before saving — nothing publishes automatically.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          <label className="block">
            <span className={labelClasses}>Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className={inputClasses}
              placeholder="E-commerce Analytics Pipeline"
            />
          </label>

          <label className="block">
            <span className={labelClasses}>Short description</span>
            <textarea
              value={shortDescription}
              onChange={(event) => setShortDescription(event.target.value)}
              rows={2}
              className={`${inputClasses} resize-none`}
              placeholder="What did you build or accomplish?"
            />
          </label>

          <label className="block">
            <span className={labelClasses}>Your contribution</span>
            <textarea
              value={candidateContribution}
              onChange={(event) => setCandidateContribution(event.target.value)}
              rows={2}
              className={`${inputClasses} resize-none`}
              placeholder="What specifically did you do?"
            />
          </label>

          <label className="block">
            <span className={labelClasses}>Outcome or impact</span>
            <textarea
              value={outcomeOrImpact}
              onChange={(event) => setOutcomeOrImpact(event.target.value)}
              rows={2}
              className={`${inputClasses} resize-none`}
              placeholder="What changed as a result?"
            />
          </label>

          <label className="block">
            <span className={labelClasses}>Skills demonstrated</span>
            <input
              value={skillsDemonstrated}
              onChange={(event) => setSkillsDemonstrated(event.target.value)}
              className={inputClasses}
              placeholder="SQL, Data Modeling"
            />
          </label>

          <div>
            <span className={labelClasses}>Visibility</span>
            <div className="mt-1.5 flex gap-2">
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className={[
                  "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  visibility === "private"
                    ? "border-accent-soft-border bg-accent-soft text-accent-dark"
                    : "border-border text-ink-soft hover:border-ink-faint",
                ].join(" ")}
              >
                Keep private
              </button>
              <button
                type="button"
                onClick={() => setVisibility("published")}
                className={[
                  "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  visibility === "published"
                    ? "border-accent-soft-border bg-accent-soft text-accent-dark"
                    : "border-border text-ink-soft hover:border-ink-faint",
                ].join(" ")}
              >
                Publish to Grove
              </button>
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <button
              type="button"
              onClick={() => setDetailsOpen((open) => !open)}
              className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-ink-faint uppercase transition-colors hover:text-ink"
            >
              {detailsOpen ? (
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
              )}
              More Details (Optional)
            </button>

            {detailsOpen && (
              <div className="mt-4 space-y-5">
                <label className="block">
                  <span className={labelClasses}>Achievement type</span>
                  <select
                    value={achievementType}
                    onChange={(event) =>
                      setAchievementType(event.target.value as AchievementType)
                    }
                    className={inputClasses}
                  >
                    {ACHIEVEMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={labelClasses}>Technologies used</span>
                  <input
                    value={technologiesUsed}
                    onChange={(event) => setTechnologiesUsed(event.target.value)}
                    className={inputClasses}
                    placeholder="PostgreSQL, Power BI"
                  />
                </label>

                <label className="block">
                  <span className={labelClasses}>Project domain</span>
                  <input
                    value={projectDomain}
                    onChange={(event) => setProjectDomain(event.target.value)}
                    className={inputClasses}
                    placeholder="E-commerce Analytics"
                  />
                </label>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClasses}>Proof link</span>
                    <input
                      value={proofUrl}
                      onChange={(event) => setProofUrl(event.target.value)}
                      type="url"
                      className={inputClasses}
                      placeholder="https://github.com/..."
                    />
                  </label>
                  <label className="block">
                    <span className={labelClasses}>Proof label</span>
                    <input
                      value={proofLabel}
                      onChange={(event) => setProofLabel(event.target.value)}
                      className={inputClasses}
                      placeholder="GitHub repository"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className={labelClasses}>Relevant roles</span>
                  <input
                    value={relevantRoles}
                    onChange={(event) => setRelevantRoles(event.target.value)}
                    className={inputClasses}
                    placeholder="Data Analyst, BI Developer"
                  />
                </label>
              </div>
            )}
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
              disabled={status === "saving"}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "saving" || !title.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
              {status === "saving" ? "Saving…" : "Save Achievement"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
