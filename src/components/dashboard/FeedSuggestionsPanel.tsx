import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { getInitials } from "../../lib/initials";
import { suggestPeople } from "../../state/searchStore";
import type { PersonSearchResult } from "../../state/searchStore";
import type { FeaturedSeedCard, SkillSummary } from "../../types/grove";

interface FeedSuggestionsPanelProps {
  isDemo: boolean;
  // Who to fetch suggestions for (so the current viewer never suggests
  // themselves) and how to route "View profile" once picked — candidates
  // and recruiters each have their own destination route for viewing a
  // candidate vs. a recruiter profile (see GlobalSearchBar.tsx's
  // goToPerson, which this mirrors exactly).
  currentUserId: string;
  viewerAccountType: "candidate" | "recruiter";
  featuredProject?: FeaturedSeedCard;
  trendingSkills?: SkillSummary[];
}

function personProfileHref(
  person: PersonSearchResult,
  viewerAccountType: "candidate" | "recruiter",
): string {
  const isRecruiterViewer = viewerAccountType === "recruiter";
  if (person.kind === "candidate") {
    return isRecruiterViewer
      ? `/recruiter/candidates/${person.candidateId}`
      : `/candidates/${person.candidateId}/preview`;
  }
  return isRecruiterViewer
    ? `/recruiter/recruiters/${person.recruiterId}`
    : `/recruiters/${person.recruiterId}`;
}

function personDisplayName(person: PersonSearchResult): string {
  return person.kind === "candidate" ? person.fullName : person.companyName;
}

function personSubtitle(person: PersonSearchResult): string {
  return person.kind === "candidate" ? person.headline : person.jobTitle;
}

// Right sidebar. Suggestions come from candidate_profiles_public/
// recruiter_profiles_public directly (see state/searchStore.ts's
// suggestPeople) — both cross-user readable by any authenticated viewer,
// and deliberately independent of Grove/achievement data, so a user with
// no published Seeds yet is still suggested. The empty-state placeholder
// below is now reserved for when that query genuinely returns nobody
// (e.g. a brand new account before any other user has signed up), not a
// blanket "not implemented yet" state.
export default function FeedSuggestionsPanel({
  isDemo,
  currentUserId,
  viewerAccountType,
  featuredProject,
  trendingSkills,
}: FeedSuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<PersonSearchResult[] | null>(null);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    suggestPeople(currentUserId)
      .then((people) => {
        if (!cancelled) setSuggestions(people);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isDemo, currentUserId]);

  if (!isDemo) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-canvas-elevated p-5">
          <h3 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            People to know
          </h3>
          {suggestions === null ? (
            <p className="mt-3 text-sm text-ink-faint">Loading…</p>
          ) : suggestions.length === 0 ? (
            <div className="mt-3 text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Users className="h-5 w-5" strokeWidth={2} />
              </span>
              <p className="mt-3 text-sm leading-relaxed text-ink-faint">
                Suggested people will appear here as more builders join Seed
                &amp; Grove.
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {suggestions.map((person) => (
                <li key={`${person.kind}-${personDisplayName(person)}`}>
                  <Link
                    to={personProfileHref(person, viewerAccountType)}
                    className="flex items-center gap-2.5 rounded-lg -mx-1 px-1 py-1 transition-colors hover:bg-canvas"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white">
                      {getInitials(personDisplayName(person))}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">
                        {personDisplayName(person)}
                      </span>
                      {personSubtitle(person) && (
                        <span className="block truncate text-xs text-ink-faint">
                          {personSubtitle(person)}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
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
