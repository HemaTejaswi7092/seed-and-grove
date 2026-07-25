import { Sprout, Bot, TreeDeciduous } from "lucide-react";
import type { HowItWorksStep, ComparisonRow } from "../types/landing";

export const howItWorksSteps: HowItWorksStep[] = [
  {
    icon: Sprout,
    step: "01",
    title: "Plant a Seed",
    description:
      "Start a real project — a build, a case study, a hard problem worth solving. Seed & Grove begins the moment you do.",
  },
  {
    icon: Bot,
    step: "02",
    title: "Build with AI",
    description:
      "Work alongside a personalized AI companion that observes your process — your decisions, iterations, and dead ends — and turns raw effort into structured evidence.",
  },
  {
    icon: TreeDeciduous,
    step: "03",
    title: "Grow your Grove",
    description:
      "Your finished work becomes a living portfolio: verified, contextual, and far harder to fake than a resume line.",
  },
];

export const comparisonRows: ComparisonRow[] = [
  {
    label: "What you show",
    traditional: "Self-written bullet points",
    seedAndGrove: "A verified record of real work",
  },
  {
    label: "Evidence",
    traditional: "Claims no one can verify",
    seedAndGrove: "AI-observed process and decisions",
  },
  {
    label: "Freshness",
    traditional: "A static snapshot from your last update",
    seedAndGrove: "Continuously growing with every project",
  },
  {
    label: "Optimized for",
    traditional: "Keyword-matching for ATS bots",
    seedAndGrove: "Credibility with real evaluators",
  },
  {
    label: "Uniqueness",
    traditional: "The same template as everyone else",
    seedAndGrove: "A narrative only you could have built",
  },
];
