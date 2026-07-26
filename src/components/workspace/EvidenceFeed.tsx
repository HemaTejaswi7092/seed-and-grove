import { motion } from "framer-motion";
import { ShieldCheck, ArrowUpRight, Sparkles } from "lucide-react";
import type { EvidenceItem } from "../../types/mockData";

interface EvidenceFeedProps {
  evidence: EvidenceItem[];
  onViewAll: () => void;
}

export default function EvidenceFeed({ evidence, onViewAll }: EvidenceFeedProps) {
  const preview = evidence.slice(0, 4);

  return (
    <div className="flex h-[560px] flex-col overflow-hidden rounded-2xl border border-border bg-canvas-elevated">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-ink">Recent Achievements</p>
          <p className="text-xs text-ink-faint">Saved as you build</p>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-medium text-accent-dark transition-colors hover:text-accent"
        >
          View all
          <ArrowUpRight className="h-3 w-3" strokeWidth={2.25} />
        </button>
      </div>

      {preview.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Sparkles className="h-5 w-5" strokeWidth={2} />
          </span>
          <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
            No achievements yet. They&apos;ll appear here as you build and
            save them from the Copilot.
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
          {preview.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
                delay: index * 0.08,
              }}
              className="rounded-xl border border-border bg-canvas p-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-dark">
                  {item.skill}
                </span>
                <ShieldCheck
                  className="h-3.5 w-3.5 text-accent"
                  strokeWidth={2}
                />
              </div>
              <p className="mt-2 text-sm leading-snug text-ink">
                {item.summary}
              </p>
              <p className="mt-1.5 text-xs text-ink-faint">
                {item.timestamp}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
