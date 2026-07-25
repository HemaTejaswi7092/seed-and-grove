import { ShieldCheck } from "lucide-react";
import type { EvidenceHighlight } from "../../types/grove";

interface EvidenceHighlightsProps {
  evidence: EvidenceHighlight[];
}

export default function EvidenceHighlights({ evidence }: EvidenceHighlightsProps) {
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
        Evidence Highlights
      </h2>

      {evidence.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <ShieldCheck className="h-6 w-6" strokeWidth={2} />
          </span>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-faint">
            Published evidence from your Seeds will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {evidence.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border bg-canvas-elevated p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent-dark">
                    {item.skill}
                  </span>
                  <span className="text-xs text-ink-faint">
                    {item.seedTitle}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-faint">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
                  Public
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink">
                {item.title}
              </p>
              {item.description && item.description !== item.title && (
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {item.description}
                </p>
              )}
              <p className="mt-3 text-xs text-ink-faint">{item.date}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
