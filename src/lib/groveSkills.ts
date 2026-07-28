import type { PublishedAchievement, SkillSummary } from "../types/grove";

export interface PublishedAchievementWithSeed {
  achievement: PublishedAchievement;
  // Only id/title are ever read here — kept minimal so this works for
  // both the owner's own Grove (sourced from the full local Seed record)
  // and a recruiter's view (sourced from the grove_seeds Postgres
  // mirror, which never has the full private Seed shape).
  seed: { id: string; title: string };
}

// Skills are free text typed per-achievement (an achievement's "Skills
// demonstrated" field) — nothing constrains casing, so "React", "react",
// and "REACT" are all the same skill and must never appear as separate
// badges. This is the single normalized identity used everywhere a skill
// needs to be matched against another skill: aggregation below,
// cross-highlighting a Featured Seed against the selected skill
// (FeaturedSeeds.tsx/ProjectDetailModal.tsx), and any future filtering.
// Never used for display — canonical casing is resolved separately in
// deriveSkillsFromAchievements below.
export function normalizeSkillKey(skill: string): string {
  return skill.trim().toLowerCase();
}

interface SkillAccumulator {
  // How many times each exact-cased spelling occurred, so the most
  // common casing can be used as the one label shown everywhere in the
  // UI ("React" wins over a single stray "react"). Ties — including the
  // common case of every mention sharing one casing — resolve to
  // whichever casing was seen first, since Map iteration preserves
  // insertion order.
  labelCounts: Map<string, number>;
  achievementCount: number;
  supportingAchievements: SkillSummary["supportingAchievements"];
}

function canonicalLabel(labelCounts: Map<string, number>): string {
  let best = "";
  let bestCount = -1;
  for (const [label, count] of labelCounts) {
    if (count > bestCount) {
      bestCount = count;
      best = label;
    }
  }
  return best;
}

// Skills come only from published achievements' own skills_demonstrated
// field — never from profile text or user-entered keywords (per Grove
// spec). Each skill carries the achievement(s) that back it, so the UI
// can show "verified by" evidence counts instead of a bare, unsupported
// skill name or a self-rated proficiency level. One achievement can
// demonstrate several skills, so this flattens across the array rather
// than assuming one skill per achievement.
export function deriveSkillsFromAchievements(
  items: PublishedAchievementWithSeed[],
): SkillSummary[] {
  const bySkill = new Map<string, SkillAccumulator>();

  for (const { achievement, seed } of items) {
    for (const rawSkill of achievement.skills_demonstrated) {
      const trimmed = rawSkill.trim();
      if (!trimmed) continue;
      const key = normalizeSkillKey(trimmed);

      const supporting = {
        id: achievement.id,
        title: achievement.title,
        shortDescription: achievement.short_description,
        seedId: seed.id,
        seedTitle: seed.title,
        technologiesUsed: achievement.technologies_used,
        proofUrl: achievement.proof_url,
        proofLabel: achievement.proof_label,
      };

      let acc = bySkill.get(key);
      if (!acc) {
        acc = { labelCounts: new Map(), achievementCount: 0, supportingAchievements: [] };
        bySkill.set(key, acc);
      }
      acc.achievementCount += 1;
      acc.supportingAchievements.push(supporting);
      acc.labelCounts.set(trimmed, (acc.labelCounts.get(trimmed) ?? 0) + 1);
    }
  }

  const summaries: SkillSummary[] = [];
  for (const acc of bySkill.values()) {
    summaries.push({
      skill: canonicalLabel(acc.labelCounts),
      achievementCount: acc.achievementCount,
      // COUNT(DISTINCT project_id) — a project with 5 achievements all
      // demonstrating "Python" still only counts once here. This is the
      // number Grove treats as a skill's evidence strength (sort order,
      // bar count) — achievementCount is kept only for the drawer's own
      // achievement listing, never for ranking or display.
      projectCount: new Set(acc.supportingAchievements.map((item) => item.seedId)).size,
      technologies: Array.from(
        new Set(acc.supportingAchievements.flatMap((item) => item.technologiesUsed)),
      ),
      supportingAchievements: acc.supportingAchievements,
    });
  }

  // Project count is the sole ranking signal — depth of demonstrated
  // experience, not raw achievement volume. Ties (identical project
  // count) fall back to alphabetical order only.
  return summaries.sort(
    (a, b) => b.projectCount - a.projectCount || a.skill.localeCompare(b.skill),
  );
}

const MAX_EVIDENCE_BARS = 5;

export interface SkillWithEvidence extends SkillSummary {
  // Whether this skill gets the prominent hero row vs. a categorized
  // supporting row — broadest evidence relative to this candidate's own
  // other skills. Always relative, never an absolute cutoff like
  // "projectCount >= 5": a candidate with one strong Seed and a candidate
  // with twenty should each still see a meaningful core/supporting split
  // among their own skills. When every skill spans the same number of
  // projects (maxCount <= 1, e.g. a brand-new Grove, or every skill so
  // far traces back to a single project), there's nothing meaningful to
  // rank against yet, so everything is treated as core rather than
  // arbitrarily demoting skills that just haven't spread to a second
  // project yet.
  isCore: boolean;
  // How many of MAX_EVIDENCE_BARS bars to fill — always computed
  // directly from this skill's projectCount relative to the strongest
  // skill in the same set, never a fixed/quantized level. A skill backed
  // by half as many distinct projects as the candidate's strongest skill
  // gets roughly half as many bars, not an identical indicator to every
  // other skill. Floors at 1 (never 0) since anything rendered here is
  // backed by at least one published project.
  barCount: number;
}

function evidenceBarCount(projectCount: number, maxProjectCount: number): number {
  if (maxProjectCount <= 0) return 0;
  const ratio = projectCount / maxProjectCount;
  return Math.max(1, Math.min(MAX_EVIDENCE_BARS, Math.round(ratio * MAX_EVIDENCE_BARS)));
}

// Input must already be sorted by projectCount desc (see
// deriveSkillsFromAchievements) — this preserves that order, it never
// re-sorts.
export function withEvidenceStrength(skills: SkillSummary[]): SkillWithEvidence[] {
  const maxCount = skills.reduce((max, item) => Math.max(max, item.projectCount), 0);
  return skills.map((skill) => ({
    ...skill,
    isCore: maxCount <= 1 ? true : skill.projectCount / maxCount >= 0.66,
    barCount: evidenceBarCount(skill.projectCount, maxCount),
  }));
}

// Best-effort grouping for the Verified Skills section's category rows —
// skills are free text typed by the candidate (via an achievement's
// "Skills demonstrated" field), never picked from a fixed taxonomy, so
// this is necessarily a keyword heuristic rather than an exact lookup.
// Checked in this order (first match wins); anything unrecognized falls
// back to "Other" rather than being dropped.
const SKILL_CATEGORIES: { name: string; keywords: string[] }[] = [
  {
    name: "Languages",
    keywords: [
      "python", "javascript", "typescript", "java", "c++", "c#", "golang", " go ",
      "rust", "ruby", "php", "swift", "kotlin", "scala", "sql", "html", "css",
      "matlab", "bash", "shell scripting",
    ],
  },
  {
    name: "AI & Data",
    keywords: [
      "machine learning", " ml ", "deep learning", "nlp", "natural language",
      "computer vision", "data pipeline", "data visualization", "data modeling",
      "data analysis", "data engineering", "data science", "statistics",
      "tf-idf", "llm", "neural network", "pandas", "numpy", "scikit",
      "tensorflow", "pytorch", "prompt engineering", "recommendation",
    ],
  },
  {
    name: "Cloud & Infrastructure",
    keywords: [
      "cloud", "aws", "azure", "gcp", "google cloud", "docker", "kubernetes",
      "devops", "ci/cd", "supabase", "firebase", "terraform", "deployment",
      "infrastructure", "serverless", "networking",
    ],
  },
  {
    name: "Engineering & Architecture",
    keywords: [
      "system design", "architecture", "debugging", "performance", "api design",
      "testing", "code review", "backend", "frontend", "full stack", "database",
      "algorithm", "refactoring", "security", "authentication",
    ],
  },
  {
    name: "Product & Design",
    keywords: [
      "ux", "ui design", "prototyping", "figma", "product strategy",
      "user research", "wireframe", "branding",
    ],
  },
  {
    name: "Collaboration & Leadership",
    keywords: [
      "technical writing", "leadership", "mentoring", "presentation",
      "communication", "project management", "public speaking", "collaboration",
      "documentation", "stakeholder",
    ],
  },
];

export function categorizeSkill(skill: string): string {
  const text = ` ${skill.toLowerCase()} `;
  for (const category of SKILL_CATEGORIES) {
    if (category.keywords.some((keyword) => text.includes(keyword))) {
      return category.name;
    }
  }
  return "Other";
}

// Single source of truth for display order — "Other" always sorts last.
// VerifiedSkills.tsx walks this list rather than a Map's insertion order,
// so category rows appear the same way for every candidate regardless of
// which skill happened to be added first.
export const SKILL_CATEGORY_ORDER: string[] = [
  ...SKILL_CATEGORIES.map((category) => category.name),
  "Other",
];
