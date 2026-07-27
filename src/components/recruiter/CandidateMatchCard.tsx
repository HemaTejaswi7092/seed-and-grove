import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { getInitials } from "../../lib/initials";
import type { CandidateMatch } from "../../recruiter/types";

interface CandidateMatchCardProps {
  match: CandidateMatch;
  index?: number;
}

// Deliberately concise, per the approved Phase B spec: name, match
// strength, one evidence-grounded sentence, top 1-3 Achievements, View
// Profile. No responsibilities/skills/technologies/gaps sections here —
// those were explicitly ruled out in favor of staying close to the
// underlying semantic evidence.
export default function CandidateMatchCard({ match, index = 0 }: CandidateMatchCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.05 }}
      className="rounded-2xl border border-border bg-canvas-elevated p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
          {getInitials(match.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{match.name}</p>
          {match.headline && (
            <p className="mt-0.5 truncate text-xs text-ink-faint">{match.headline}</p>
          )}
        </div>
        <span className="flex shrink-0 items-center justify-center rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-dark">
          {match.matchLabel} · {match.matchScore}%
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink-soft">{match.matchSentence}</p>

      {match.achievements.length > 0 && (
        <div className="mt-4 space-y-2">
          {match.achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="rounded-xl border border-border bg-canvas p-3"
            >
              <p className="text-xs font-semibold text-ink">{achievement.title}</p>
              {achievement.shortDescription && (
                <p className="mt-1 text-xs leading-relaxed text-ink-faint">
                  {achievement.shortDescription}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-end border-t border-border pt-4">
        <Link
          to={`/recruiter/candidates/${match.candidateId}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-accent-dark transition-colors hover:text-accent"
        >
          View Profile
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>
    </motion.div>
  );
}
