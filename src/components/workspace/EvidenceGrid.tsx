import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Sparkles,
  Globe,
  Lock,
  Share2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Link2,
} from "lucide-react";
import { useMenuDismissRef } from "../../lib/useMenuDismiss";
import type { Achievement } from "../../types/seed";

// Renders Achievement records — kept as EvidenceGrid.tsx (the Seed
// Workspace's "Achievements" tab) to avoid an unrelated file-rename sweep;
// see the Phase 1 inspection notes on why "evidence" stayed as the
// internal/file-level name while all visible copy says "Achievement."
interface EvidenceGridProps {
  achievements: Achievement[];
  // Omitted for the demo Seed — its achievements live in curated mock
  // data, not the real store, so there's nothing for these to persist.
  onEdit?: (achievementId: string) => void;
  onDelete?: (achievementId: string) => void;
  // Only offered once an achievement is already published — sharing is a
  // deliberate second step after publishing, never a side effect of it.
  onShareToFeed?: (achievementId: string) => void;
}

export default function EvidenceGrid({
  achievements,
  onEdit,
  onDelete,
  onShareToFeed,
}: EvidenceGridProps) {
  const skills = useMemo(
    () => Array.from(new Set(achievements.flatMap((item) => item.skillsDemonstrated))),
    [achievements],
  );
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useMenuDismissRef<HTMLDivElement>(openMenuId !== null, () =>
    setOpenMenuId(null),
  );

  const visible = activeSkill
    ? achievements.filter((item) => item.skillsDemonstrated.includes(activeSkill))
    : achievements;

  if (achievements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Sparkles className="h-5 w-5" strokeWidth={2} />
        </span>
        <p className="text-sm leading-relaxed text-ink-soft">
          No achievements yet.
        </p>
      </div>
    );
  }

  return (
    <div className="px-8 py-10">
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveSkill(null)}
          className={[
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            activeSkill === null
              ? "border-accent bg-accent text-white"
              : "border-border text-ink-soft hover:border-ink-faint",
          ].join(" ")}
        >
          All
        </button>
        {skills.map((skill) => (
          <button
            key={skill}
            type="button"
            onClick={() => setActiveSkill(skill)}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              activeSkill === skill
                ? "border-accent bg-accent text-white"
                : "border-border text-ink-soft hover:border-ink-faint",
            ].join(" ")}
          >
            {skill}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visible.map((item, index) => {
          const isPublished = item.visibility === "published";
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.04 }}
              className="relative rounded-2xl border border-border bg-canvas-elevated p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.skillsDemonstrated.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-dark"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span
                    className={[
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      isPublished
                        ? "bg-accent-soft text-accent-dark"
                        : "bg-border/60 text-ink-faint",
                    ].join(" ")}
                  >
                    {isPublished ? (
                      <>
                        <Globe className="h-3 w-3" strokeWidth={2} />
                        Published
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" strokeWidth={2} />
                        Private
                      </>
                    )}
                  </span>
                  {(onEdit || onDelete) && (
                    <div
                      className="relative"
                      ref={openMenuId === item.id ? menuRef : undefined}
                    >
                      <button
                        type="button"
                        aria-label="Achievement options"
                        onClick={() =>
                          setOpenMenuId((current) => (current === item.id ? null : item.id))
                        }
                        className="flex h-6 w-6 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-canvas hover:text-ink"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                      {openMenuId === item.id && (
                        <div className="absolute right-0 z-50 mt-1 w-36 overflow-hidden rounded-xl border border-border bg-canvas-elevated shadow-lg">
                          {onEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onEdit(item.id);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
                            >
                              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                              Edit
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onDelete(item.id);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <p className="mt-3 text-sm font-semibold text-ink">{item.title}</p>
              {item.shortDescription && (
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {item.shortDescription}
                </p>
              )}

              {item.technologiesUsed.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.technologiesUsed.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-ink-soft"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              {item.outcomeOrImpact && (
                <p className="mt-3 text-xs text-ink-faint">
                  <span className="font-medium text-ink-soft">Outcome: </span>
                  {item.outcomeOrImpact}
                </p>
              )}

              {item.proofUrl && (
                <a
                  href={item.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-dark hover:text-accent"
                >
                  <Link2 className="h-3 w-3" strokeWidth={2} />
                  {item.proofLabel || "View proof"}
                </a>
              )}

              <div className="mt-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs text-ink-faint">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                {onShareToFeed && isPublished && (
                  <button
                    type="button"
                    onClick={() => onShareToFeed(item.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
                  >
                    <Share2 className="h-3 w-3" strokeWidth={2} />
                    Share to feed
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
