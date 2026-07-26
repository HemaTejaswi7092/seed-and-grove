import { useState, type FormEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { GroveProfileFields } from "../../types/grove";

interface EditGroveModalProps {
  fields: GroveProfileFields;
  onClose: () => void;
  // Throw to signal failure — caught below, shown inline, and the modal
  // stays open so a failed save never reads as a silent success (the
  // caller only unmounts this modal once onSave resolves).
  onSave: (next: GroveProfileFields) => Promise<void>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none";

export default function EditGroveModal({
  fields,
  onClose,
  onSave,
}: EditGroveModalProps) {
  // GroveView only mounts this component while editOpen is true, so this
  // initial value is always fresh — no cancelled draft can leak into the
  // next open because there is no "next open" of the same instance.
  const [draft, setDraft] = useState(fields);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorText, setErrorText] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (status === "saving") return;
    setStatus("saving");
    setErrorText(null);
    try {
      await onSave(draft);
    } catch (err) {
      setStatus("error");
      setErrorText(err instanceof Error ? err.message : "Couldn't save your Grove.");
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
          className="w-full max-w-2xl rounded-3xl border border-border bg-canvas-elevated p-8 shadow-[0_24px_64px_-24px_rgba(26,28,25,0.4)]"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Edit Grove</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-8">
            <div className="space-y-4">
              <p className="text-xs font-semibold tracking-wide text-accent-dark uppercase">
                Profile
              </p>
              <Field label="Headline">
                <input
                  className={inputClass}
                  placeholder="e.g. Software Engineer · AI Builder"
                  value={draft.headline}
                  onChange={(e) =>
                    setDraft({ ...draft, headline: e.target.value })
                  }
                />
              </Field>
              <Field label="Bio">
                <textarea
                  className={inputClass}
                  rows={3}
                  placeholder="A short, professional summary of what you build."
                  value={draft.bio}
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Location">
                  <input
                    className={inputClass}
                    placeholder="City, State"
                    value={draft.location}
                    onChange={(e) =>
                      setDraft({ ...draft, location: e.target.value })
                    }
                  />
                </Field>
                <Field label="Availability">
                  <input
                    className={inputClass}
                    placeholder="e.g. Open to full-time opportunities"
                    value={draft.availability}
                    onChange={(e) =>
                      setDraft({ ...draft, availability: e.target.value })
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-6">
              <p className="text-xs font-semibold tracking-wide text-accent-dark uppercase">
                About the Builder
              </p>
              <Field label="What I enjoy building">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={draft.about.enjoys}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      about: { ...draft.about, enjoys: e.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Areas of interest">
                <input
                  className={inputClass}
                  value={draft.about.interests}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      about: { ...draft.about, interests: e.target.value },
                    })
                  }
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Career direction">
                  <input
                    className={inputClass}
                    value={draft.about.direction}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        about: { ...draft.about, direction: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Preferred technologies">
                  <input
                    className={inputClass}
                    value={draft.about.technologies}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        about: {
                          ...draft.about,
                          technologies: e.target.value,
                        },
                      })
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-6">
              <p className="text-xs font-semibold tracking-wide text-accent-dark uppercase">
                Opportunities
              </p>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={draft.opportunities.openToOpportunities}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      opportunities: {
                        ...draft.opportunities,
                        openToOpportunities: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
                Open to opportunities
              </label>
              <Field label="Roles of interest">
                <input
                  className={inputClass}
                  placeholder="e.g. Backend Engineer, ML Engineer"
                  value={draft.opportunities.rolesOfInterest}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      opportunities: {
                        ...draft.opportunities,
                        rolesOfInterest: e.target.value,
                      },
                    })
                  }
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Work mode">
                  <input
                    className={inputClass}
                    placeholder="Remote / Hybrid / Onsite"
                    value={draft.opportunities.workMode}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        opportunities: {
                          ...draft.opportunities,
                          workMode: e.target.value,
                        },
                      })
                    }
                  />
                </Field>
                <Field label="Collaboration interests">
                  <input
                    className={inputClass}
                    value={draft.opportunities.collaborationInterests}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        opportunities: {
                          ...draft.opportunities,
                          collaborationInterests: e.target.value,
                        },
                      })
                    }
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={draft.opportunities.contactVisible}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      opportunities: {
                        ...draft.opportunities,
                        contactVisible: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
                Show a contact button on my public Grove
              </label>
              {draft.opportunities.contactVisible && (
                <Field label="Contact email">
                  <input
                    className={inputClass}
                    type="email"
                    placeholder="you@example.com"
                    value={draft.opportunities.contactEmail}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        opportunities: {
                          ...draft.opportunities,
                          contactEmail: e.target.value,
                        },
                      })
                    }
                  />
                </Field>
              )}
              <p className="text-xs leading-relaxed text-ink-faint">
                Only shown to recruiters when &quot;Show a contact button&quot; is
                checked — this also controls whether your resume link below is
                visible to anyone but you.
              </p>
            </div>

            <div className="space-y-4 border-t border-border pt-6">
              <p className="text-xs font-semibold tracking-wide text-accent-dark uppercase">
                Professional Details
              </p>
              <Field label="Education">
                <textarea
                  className={inputClass}
                  rows={2}
                  placeholder="e.g. B.S. Computer Science, University of Florida"
                  value={draft.education}
                  onChange={(e) => setDraft({ ...draft, education: e.target.value })}
                />
              </Field>
              <Field label="Experience">
                <textarea
                  className={inputClass}
                  rows={2}
                  placeholder="e.g. Software Engineer Intern, Acme Co. (Summer 2025)"
                  value={draft.experience}
                  onChange={(e) => setDraft({ ...draft, experience: e.target.value })}
                />
              </Field>
              <Field label="Work authorization">
                <input
                  className={inputClass}
                  placeholder="e.g. U.S. Citizen, requires sponsorship, etc."
                  value={draft.workAuthorization}
                  onChange={(e) =>
                    setDraft({ ...draft, workAuthorization: e.target.value })
                  }
                />
              </Field>
            </div>

            <div className="space-y-4 border-t border-border pt-6">
              <p className="text-xs font-semibold tracking-wide text-accent-dark uppercase">
                Links
              </p>
              <Field label="Resume link">
                <input
                  className={inputClass}
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={draft.resumeUrl}
                  onChange={(e) => setDraft({ ...draft, resumeUrl: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="LinkedIn">
                  <input
                    className={inputClass}
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={draft.linkedinUrl}
                    onChange={(e) =>
                      setDraft({ ...draft, linkedinUrl: e.target.value })
                    }
                  />
                </Field>
                <Field label="GitHub">
                  <input
                    className={inputClass}
                    type="url"
                    placeholder="https://github.com/..."
                    value={draft.githubUrl}
                    onChange={(e) => setDraft({ ...draft, githubUrl: e.target.value })}
                  />
                </Field>
                <Field label="Portfolio">
                  <input
                    className={inputClass}
                    type="url"
                    placeholder="https://..."
                    value={draft.portfolioUrl}
                    onChange={(e) =>
                      setDraft({ ...draft, portfolioUrl: e.target.value })
                    }
                  />
                </Field>
              </div>
            </div>

            {status === "error" && errorText && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorText}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
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
                disabled={status === "saving"}
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "saving" ? "Saving…" : "Save Grove"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
  );
}
