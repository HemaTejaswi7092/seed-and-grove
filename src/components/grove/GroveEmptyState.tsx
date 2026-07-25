import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TreeDeciduous, Eye, Pencil } from "lucide-react";

interface GroveEmptyStateProps {
  onEdit: () => void;
  onPreview: () => void;
}

export default function GroveEmptyState({ onEdit, onPreview }: GroveEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      className="flex flex-col items-center rounded-3xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-20 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <TreeDeciduous className="h-7 w-7" strokeWidth={2} />
      </span>
      <h2 className="mt-5 text-xl font-semibold text-ink">
        Your Grove is ready to grow.
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
        Publish work from your Seeds to build a professional identity based
        on demonstrated experience instead of self-reported skills.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/seeds"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
        >
          View My Seeds
        </Link>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-canvas-elevated px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink-faint"
        >
          <Pencil className="h-4 w-4" strokeWidth={2} />
          Edit Grove
        </button>
        <button
          type="button"
          onClick={onPreview}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-canvas-elevated px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink-faint"
        >
          <Eye className="h-4 w-4" strokeWidth={2} />
          Preview Public Grove
        </button>
      </div>
    </motion.div>
  );
}
