import { timeAgo } from "./dates";
import type { SeedEvidenceItem } from "../types/seed";
import type { EvidenceItem } from "../types/mockData";

// EvidenceFeed/EvidenceGrid render the display-only EvidenceItem shape
// (shared with the VISIQ demo data); real Seeds store the richer
// SeedEvidenceItem record. This maps one to the other, newest first.
export function toDisplayEvidence(items: SeedEvidenceItem[]): EvidenceItem[] {
  return [...items]
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((item) => ({
      id: item.id,
      skill: item.category,
      summary: item.description,
      timestamp: timeAgo(item.createdAt),
    }));
}
