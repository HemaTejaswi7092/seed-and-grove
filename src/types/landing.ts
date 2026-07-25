import type { LucideIcon } from "lucide-react";

export interface HowItWorksStep {
  icon: LucideIcon;
  step: string;
  title: string;
  description: string;
}

export interface ComparisonRow {
  label: string;
  traditional: string;
  seedAndGrove: string;
}
