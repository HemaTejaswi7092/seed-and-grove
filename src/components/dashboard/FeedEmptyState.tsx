import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Newspaper } from "lucide-react";

export default function FeedEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center rounded-3xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <Newspaper className="h-7 w-7" strokeWidth={2} />
      </span>
      <h2 className="mt-5 text-lg font-semibold text-ink">
        Your feed is ready to grow.
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
        Share approved evidence or a published Seed from the Workspace, and
        it'll show up here.
      </p>
      <Link
        to="/seeds"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
      >
        View My Seeds
      </Link>
    </motion.div>
  );
}
