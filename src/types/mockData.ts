import type { LucideIcon } from "lucide-react";

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

export interface ActivityEntry {
  icon: LucideIcon;
  title: string;
  timestamp: string;
}

export interface ActivityGroup {
  day: string;
  entries: ActivityEntry[];
}

export interface ProjectStat {
  label: string;
  value: string;
}

export interface Highlight {
  title: string;
  description: string;
}
