import { motion } from "framer-motion";
import { MapPin, CircleDot, Eye, Share2, Pencil } from "lucide-react";

interface ProfileStat {
  label: string;
  value: number;
}

interface ProfileIdentityCardProps {
  displayName: string;
  initials: string;
  headline: string;
  bio: string;
  location: string;
  availability: string;
  stats: ProfileStat[];
  isOwner: boolean;
  isPreview: boolean;
  onTogglePreview: () => void;
  onShare: () => void;
  onEdit: () => void;
}

export default function ProfileIdentityCard({
  displayName,
  initials,
  headline,
  bio,
  location,
  availability,
  stats,
  isOwner,
  isPreview,
  onTogglePreview,
  onShare,
  onEdit,
}: ProfileIdentityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-3xl border border-border bg-canvas-elevated p-8 sm:p-10"
    >
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-ink text-xl font-semibold text-white">
            {initials}
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {displayName}
            </h1>
            {headline && (
              <p className="mt-1 text-sm font-medium text-accent-dark">
                {headline}
              </p>
            )}
            {bio && (
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">
                &ldquo;{bio}&rdquo;
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-faint">
              {location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                  {location}
                </span>
              )}
              {availability && (
                <span className="inline-flex items-center gap-1.5 text-accent-dark">
                  <CircleDot className="h-3.5 w-3.5" strokeWidth={2} />
                  {availability}
                </span>
              )}
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
            <button
              type="button"
              onClick={onTogglePreview}
              className={[
                "inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition-colors",
                isPreview
                  ? "border-accent bg-accent text-white"
                  : "border-border text-ink-soft hover:border-ink-faint hover:text-ink",
              ].join(" ")}
            >
              <Eye className="h-3.5 w-3.5" strokeWidth={2} />
              {isPreview ? "Exit Preview" : "Preview Public Grove"}
            </button>
            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            >
              <Share2 className="h-3.5 w-3.5" strokeWidth={2} />
              Share
            </button>
            {!isPreview && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                Edit Grove
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="text-2xl font-semibold text-ink">{stat.value}</p>
            <p className="mt-0.5 text-xs text-ink-faint">{stat.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
