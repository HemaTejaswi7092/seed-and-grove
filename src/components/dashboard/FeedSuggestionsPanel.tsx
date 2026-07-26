import { Users } from "lucide-react";
import type { FeaturedSeedCard, SkillSummary } from "../../types/grove";

interface FeedSuggestionsPanelProps {
  isDemo: boolean;
  featuredProject?: FeaturedSeedCard;
  trendingSkills?: SkillSummary[];
}

// Right sidebar. Genuinely populating "suggested people" needs other
// users' Grove data to be readable cross-user, which isn't true yet (see
// project notes) — so real accounts get an honest placeholder instead of
// fabricated suggestions. The demo account still shows something, using
// its own existing curated Grove data rather than new mock content.
export default function FeedSuggestionsPanel({
  isDemo,
  featuredProject,
  trendingSkills,
}: FeedSuggestionsPanelProps) {
  if (!isDemo) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated p-5 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Users className="h-5 w-5" strokeWidth={2} />
        </span>
        <p className="mt-3 text-sm leading-relaxed text-ink-faint">
          Suggested people, skills, and projects will appear here as more
          builders join Seed &amp; Grove.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {featuredProject && (
        <div className="rounded-2xl border border-border bg-canvas-elevated p-5">
          <h3 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Featured Project
          </h3>
          <p className="mt-2 text-sm font-semibold text-ink">
            {featuredProject.title}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            {featuredProject.description}
          </p>
        </div>
      )}

      {trendingSkills && trendingSkills.length > 0 && (
        <div className="rounded-2xl border border-border bg-canvas-elevated p-5">
          <h3 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Trending Skills
          </h3>
          <ul className="mt-3 space-y-2.5">
            {trendingSkills.slice(0, 4).map((skill) => (
              <li
                key={skill.skill}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-ink">{skill.skill}</span>
                <span className="text-xs text-ink-faint">
                  {skill.achievementCount}{" "}
                  {skill.achievementCount === 1 ? "achievement" : "achievements"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
