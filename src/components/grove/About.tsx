import { Link } from "react-router-dom";
import { NotebookPen, Sparkles } from "lucide-react";

interface AboutProps {
  professionalSummary: string;
  areasOfInterest: string;
  isOwner: boolean;
}

// Read-only — the professional summary is the primary introduction
// (who this person is, what they specialize in, the technologies/
// domains they work in, and what they're looking for), with areas of
// interest shown underneath as small supporting metadata, not the main
// content. Both fields are edited exclusively on the Profile page (see
// pages/CandidateProfile.tsx); this component never mutates them.
export default function About({ professionalSummary, areasOfInterest, isOwner }: AboutProps) {
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
        About
      </h2>

      {!professionalSummary.trim() ? (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <NotebookPen className="h-6 w-6" strokeWidth={2} />
          </span>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-faint">
            {isOwner
              ? "Add a professional summary in your Profile so people know who you are and what you're looking for."
              : "This builder hasn't shared their story yet."}
          </p>
          {isOwner && (
            <Link
              to="/profile"
              className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            >
              Add your summary in Profile
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-border bg-canvas-elevated p-6">
          <p className="text-sm leading-relaxed text-ink">{professionalSummary}</p>
          {areasOfInterest.trim() && (
            <div className="mt-4 flex items-start gap-2 border-t border-border pt-4">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2} />
              <p className="text-xs leading-relaxed text-ink-faint">
                <span className="font-medium text-ink-soft">Areas of interest — </span>
                {areasOfInterest}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
