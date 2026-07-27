export interface PreviousProject {
  id: string;
  name: string;
  tagline: string;
  outcome: string;
  completedDate: string;
}

export interface Opportunity {
  id: string;
  role: string;
  company: string;
  type: string;
  location: string;
  matchReason: string;
}

export interface EvidenceItem {
  id: string;
  skill: string;
  summary: string;
  timestamp: string;
}

export interface SkillLevel {
  skill: string;
  mastery: number;
}

export interface ProjectStat {
  label: string;
  value: string;
}

// The Seed Workspace header's compact inline metadata row (see
// ProjectHeader.tsx) — deliberately a different, smaller shape than
// ProjectStat above (which the Dashboard's project-summary card still
// uses as-is): just enough to render "📅 2 Days" in one line, not a
// stacked value/label block.
export interface ProjectHeaderMetadataItem {
  emoji: string;
  value: string;
  label: string;
}

export interface Highlight {
  title: string;
  description: string;
}
