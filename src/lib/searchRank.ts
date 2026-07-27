// Relevance tiers for a value already known to contain the search term
// (i.e. it already matched an `ilike '%term%'` query) — this only decides
// *where within the results* it sorts, never whether it matched at all.
// Lower is more relevant: 0 = exact, 1 = prefix, 2 = partial (contains
// the term somewhere in the middle/end).
export function matchRank(term: string, value: string): number {
  const t = term.trim().toLowerCase();
  const v = value.trim().toLowerCase();
  if (v === t) return 0;
  if (v.startsWith(t)) return 1;
  return 2;
}
