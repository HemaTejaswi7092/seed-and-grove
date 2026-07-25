import type { Seed, SeedEvidenceItem } from "../types/seed";
import type { SkillSummary } from "../types/grove";

export interface PublicEvidenceWithSeed {
  evidence: SeedEvidenceItem;
  seed: Seed;
}

// Skills come only from published evidence's own category field — never
// from profile text or user-entered keywords (per Grove spec). Each skill
// carries the evidence that backs it, so the UI can show "supported by"
// instead of a bare, unsupported skill name.
export function deriveSkillsFromEvidence(
  items: PublicEvidenceWithSeed[],
): SkillSummary[] {
  const bySkill = new Map<string, SkillSummary>();

  for (const { evidence, seed } of items) {
    const skill = evidence.category.trim();
    if (!skill) continue;

    const existing = bySkill.get(skill);
    const supporting = { title: evidence.title, seedTitle: seed.title };

    if (existing) {
      existing.evidenceCount += 1;
      existing.supportingEvidence.push(supporting);
    } else {
      bySkill.set(skill, {
        skill,
        evidenceCount: 1,
        supportingEvidence: [supporting],
      });
    }
  }

  return Array.from(bySkill.values()).sort(
    (a, b) => b.evidenceCount - a.evidenceCount,
  );
}
