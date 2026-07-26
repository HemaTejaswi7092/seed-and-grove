import { NotebookPen } from "lucide-react";
import type { AboutBuilder as AboutBuilderFields } from "../../types/grove";

interface AboutBuilderProps {
  about: AboutBuilderFields;
  isOwner: boolean;
  onEdit: () => void;
}

const rows: { key: keyof AboutBuilderFields; label: string }[] = [
  { key: "enjoys", label: "What I enjoy building" },
  { key: "interests", label: "Areas of interest" },
  { key: "direction", label: "Career direction" },
  { key: "technologies", label: "Preferred technologies" },
];

export default function AboutBuilder({ about, isOwner, onEdit }: AboutBuilderProps) {
  const filled = rows.filter((row) => about[row.key].trim());

  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
        About
      </h2>

      {filled.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <NotebookPen className="h-6 w-6" strokeWidth={2} />
          </span>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-faint">
            {isOwner
              ? "Tell people what you enjoy building, your interests, and where you're headed."
              : "This builder hasn't shared their story yet."}
          </p>
          {isOwner && (
            <button
              type="button"
              onClick={onEdit}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            >
              Add your story
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 rounded-2xl border border-border bg-canvas-elevated p-6 sm:grid-cols-2">
          {filled.map((row) => (
            <div key={row.key}>
              <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                {row.label}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">
                {about[row.key]}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
