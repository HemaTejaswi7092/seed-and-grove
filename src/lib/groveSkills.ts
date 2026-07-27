import type { PublishedAchievement, SkillSummary } from "../types/grove";

export interface PublishedAchievementWithSeed {
  achievement: PublishedAchievement;
  // Only id/title are ever read here — kept minimal so this works for
  // both the owner's own Grove (sourced from the full local Seed record)
  // and a recruiter's view (sourced from the grove_seeds Postgres
  // mirror, which never has the full private Seed shape).
  seed: { id: string; title: string };
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
  const bySkill = new Map<string, SkillSummary>();

  for (const { achievement, seed } of items) {
    for (const rawSkill of achievement.skills_demonstrated) {
      const skill = rawSkill.trim();
      if (!skill) continue;

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

      const existing = bySkill.get(skill);
      if (existing) {
        existing.achievementCount += 1;
        existing.supportingAchievements.push(supporting);
      } else {
        bySkill.set(skill, {
          skill,
          achievementCount: 1,
          // Recomputed below once every achievement for this skill has
          // been collected — cheaper than de-duping on every push.
          projectCount: 0,
          technologies: [],
          supportingAchievements: [supporting],
        });
      }
    }
  }

  for (const summary of bySkill.values()) {
    // COUNT(DISTINCT project_id) — a project with 5 achievements all
    // demonstrating "Python" still only counts once here. This is the
    // number Grove treats as a skill's evidence strength (sort order,
    // tier, "Verified by" line) — achievementCount is kept only for the
    // drawer's own achievement listing, never for ranking or display.
    summary.projectCount = new Set(
      summary.supportingAchievements.map((item) => item.seedId),
    ).size;
    summary.technologies = Array.from(
      new Set(summary.supportingAchievements.flatMap((item) => item.technologiesUsed)),
    );
  }

  return Array.from(bySkill.values()).sort(
    (a, b) =>
      b.projectCount - a.projectCount ||
      b.achievementCount - a.achievementCount ||
      a.skill.localeCompare(b.skill),
  );
}

// 3 = Core (broadest evidence relative to this candidate's other
// skills), 1 = Emerging. Always relative, never an absolute cutoff like
// "projectCount >= 5" — a candidate with one strong Seed and a candidate
// with twenty should each still see a meaningful core/supporting split
// among their own skills. When every skill spans the same number of
// projects (maxCount <= 1, e.g. a brand-new Grove, or every skill so far
// traces back to a single project), there's nothing meaningful to rank
// against yet, so everything is treated as Core rather than arbitrarily
// demoting skills that just haven't spread to a second project yet.
//
// Driven by projectCount, not achievementCount — a skill demonstrated
// across many projects is stronger evidence than the same skill
// demonstrated many times on one project.
export type SkillEvidenceTier = 1 | 2 | 3;

export interface SkillWithTier extends SkillSummary {
  tier: SkillEvidenceTier;
}

function evidenceTier(count: number, maxCount: number): SkillEvidenceTier {
  if (maxCount <= 1) return 3;
  const ratio = count / maxCount;
  if (ratio >= 0.66) return 3;
  if (ratio >= 0.34) return 2;
  return 1;
}

// Input must already be sorted by projectCount desc (see
// deriveSkillsFromAchievements) — this preserves that order, it never
// re-sorts.
export function tierSkills(skills: SkillSummary[]): SkillWithTier[] {
  const maxCount = skills.reduce((max, item) => Math.max(max, item.projectCount), 0);
  return skills.map((skill) => ({ ...skill, tier: evidenceTier(skill.projectCount, maxCount) }));
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
