import { Briefcase, Mail, Users } from "lucide-react";
import type { OpportunitiesInfo } from "../../types/grove";

interface OpportunitiesPanelProps {
  opportunities: OpportunitiesInfo;
  isOwner: boolean;
  onEdit: () => void;
}

export default function OpportunitiesPanel({
  opportunities,
  isOwner,
  onEdit,
}: OpportunitiesPanelProps) {
  const hasAnything =
    opportunities.openToOpportunities ||
    opportunities.rolesOfInterest.trim() ||
    opportunities.collaborationInterests.trim() ||
    (opportunities.contactVisible && opportunities.contactEmail.trim());

  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
        Opportunities
      </h2>

      {!hasAnything ? (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Briefcase className="h-6 w-6" strokeWidth={2} />
          </span>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-faint">
            {isOwner
              ? "Let people know what you're open to and how to reach you."
              : "This builder hasn't shared their opportunity preferences yet."}
          </p>
          {isOwner && (
            <button
              type="button"
              onClick={onEdit}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            >
              Set opportunity preferences
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-border bg-canvas-elevated p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                opportunities.openToOpportunities
                  ? "bg-accent-soft text-accent-dark"
                  : "border border-border text-ink-faint",
              ].join(" ")}
            >
              <Briefcase className="h-3.5 w-3.5" strokeWidth={2} />
              {opportunities.openToOpportunities
                ? "Open to opportunities"
                : "Not currently looking"}
            </span>
            {opportunities.workMode && (
              <span className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft">
                {opportunities.workMode}
              </span>
            )}
          </div>

          {opportunities.rolesOfInterest && (
            <div className="mt-4">
              <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Roles of interest
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">
                {opportunities.rolesOfInterest}
              </p>
            </div>
          )}

          {opportunities.collaborationInterests && (
            <div className="mt-4">
              <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3 w-3" strokeWidth={2} />
                  Collaboration interests
                </span>
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">
                {opportunities.collaborationInterests}
              </p>
            </div>
          )}

          {opportunities.contactVisible && opportunities.contactEmail && (
            <a
              href={`mailto:${opportunities.contactEmail}`}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
            >
              <Mail className="h-3.5 w-3.5" strokeWidth={2} />
              Email Candidate
            </a>
          )}
        </div>
      )}
    </section>
  );
}
