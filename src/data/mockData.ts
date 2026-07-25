import {
  Rocket,
  GitBranch,
  Wrench,
  FileText,
  Cpu,
  GitCommit,
  Zap,
  ShieldCheck,
} from "lucide-react";
import type {
  PreviousProject,
  Opportunity,
  EvidenceItem,
  SkillLevel,
  ActivityGroup,
  ProjectStat,
  Highlight,
} from "../types/mockData";
import type { Seed, SeedConversationMessage } from "../types/seed";
import { DEMO_SEED_ID } from "../config/demoAccount";

// ---------------------------------------------------------------------------
// Demo project data — shown only when BOTH isDemoAccount(user.email) and
// isDemoSeed(seedId) are true (see src/config/demoAccount.ts). Everything
// below belongs exclusively to DEMO_SEED_ID and must never be used as a
// fallback for a real, newly-created Seed. The authenticated display name
// always comes from the real Supabase profile, never from this file.
// ---------------------------------------------------------------------------

export const DEMO_SEED: Seed = {
  id: DEMO_SEED_ID,
  userId: "demo",
  title: "VISIQ",
  description: "Real-time defect detection for manufacturing",
  sourceType: "manual",
  status: "Currently Building",
  createdAt: "2026-06-08T09:00:00.000Z",
  updatedAt: "2026-07-24T12:00:00.000Z",
  progress: 78,
};

export const previousProjects: PreviousProject[] = [
  {
    id: "pulse",
    name: "Pulse",
    tagline: "Wearable heart-rate anomaly detector",
    outcome:
      "Shipped to 200 beta testers; flagged 3 false-negative edge cases before launch.",
    completedDate: "Mar 2026",
  },
  {
    id: "lantern",
    name: "Lantern",
    tagline: "Offline-first campus wayfinding app",
    outcome: "Adopted by two university orientation programs.",
    completedDate: "Nov 2025",
  },
];

export const opportunities: Opportunity[] = [
  {
    id: "waymo-cv",
    role: "Computer Vision Engineer",
    company: "Waymo",
    type: "Full-time",
    location: "Mountain View, CA",
    matchReason:
      "Strong match on real-time inference and edge-deployment experience from VISIQ.",
  },
  {
    id: "robotics-founding",
    role: "Founding Engineer",
    company: "Early-stage robotics startup",
    type: "Full-time",
    location: "Remote",
    matchReason:
      "Systems-design and debugging-under-pressure evidence align with 0-to-1 engineering needs.",
  },
  {
    id: "scale-platform",
    role: "ML Platform Engineer",
    company: "Scale AI",
    type: "Full-time",
    location: "San Francisco, CA",
    matchReason:
      "Model-versioning and CI pipeline work translates directly to platform reliability.",
  },
];

export const demoProjectStats: ProjectStat[] = [
  { label: "Days building", value: "46" },
  { label: "Commits logged", value: "212" },
  { label: "Evidence points", value: "31" },
  { label: "Skills demonstrated", value: "6" },
];

export const demoCopilotMessages: SeedConversationMessage[] = [
  {
    id: "m1",
    seedId: DEMO_SEED_ID,
    role: "ai",
    content:
      "I noticed 14 commits landed on the inference pipeline today. Want me to summarize what changed?",
    createdAt: "2026-07-24T09:00:00.000Z",
  },
  {
    id: "m2",
    seedId: DEMO_SEED_ID,
    role: "user",
    content:
      "Yeah — I swapped the frame queue for a lock-free ring buffer to cut p99 latency under load.",
    createdAt: "2026-07-24T09:01:00.000Z",
  },
  {
    id: "m3",
    seedId: DEMO_SEED_ID,
    role: "ai",
    content:
      "That's a solid systems-design call — trading complexity for predictable tail latency. Did you benchmark before/after?",
    createdAt: "2026-07-24T09:02:00.000Z",
  },
  {
    id: "m4",
    seedId: DEMO_SEED_ID,
    role: "user",
    content: "p99 went from 340ms to 96ms on the Jetson build.",
    createdAt: "2026-07-24T09:03:00.000Z",
  },
  {
    id: "m5",
    seedId: DEMO_SEED_ID,
    role: "ai",
    content:
      "Logged — a 3.5x tail-latency improvement on constrained hardware. That's a strong data point for your Grove.",
    createdAt: "2026-07-24T09:04:00.000Z",
  },
  {
    id: "m6",
    seedId: DEMO_SEED_ID,
    role: "user",
    content: "Also finally fixed that memory leak in the decoder.",
    createdAt: "2026-07-24T09:05:00.000Z",
  },
  {
    id: "m7",
    seedId: DEMO_SEED_ID,
    role: "ai",
    content:
      "Saw the diff — you traced it to unreleased CUDA buffers in the async decode path. That's an easy one to miss. Adding this as evidence under Debugging Under Pressure.",
    createdAt: "2026-07-24T09:06:00.000Z",
  },
];

export const demoEvidenceFeed: EvidenceItem[] = [
  {
    id: "e1",
    skill: "Performance Engineering",
    summary:
      "Cut p99 inference latency 3.5x via a lock-free ring buffer redesign",
    timestamp: "12m ago",
  },
  {
    id: "e2",
    skill: "Debugging Under Pressure",
    summary: "Traced and fixed a CUDA memory leak in the async decode path",
    timestamp: "1h ago",
  },
  {
    id: "e3",
    skill: "Systems Design",
    summary:
      "Chose edge deployment over cloud inference after modeling latency and cost tradeoffs",
    timestamp: "Yesterday",
  },
  {
    id: "e4",
    skill: "Technical Writing",
    summary: "Authored the ADR justifying the edge-deployment architecture",
    timestamp: "Yesterday",
  },
  {
    id: "e5",
    skill: "Computer Vision",
    summary:
      "Retrained the defect classifier on a harder negative-mining sample set",
    timestamp: "2 days ago",
  },
  {
    id: "e6",
    skill: "Systems Design",
    summary:
      "Iterated the model versioning scheme twice after the first design leaked GPU memory",
    timestamp: "3 days ago",
  },
];

export const demoSkillLevels: SkillLevel[] = [
  { skill: "Systems Design", mastery: 82 },
  { skill: "Debugging", mastery: 76 },
  { skill: "Computer Vision", mastery: 68 },
  { skill: "Technical Writing", mastery: 54 },
];

export const demoActivityGroups: ActivityGroup[] = [
  {
    day: "Today",
    entries: [
      {
        icon: Rocket,
        title: "Shipped real-time inference pipeline",
        timestamp: "2h ago",
      },
      {
        icon: Zap,
        title: "Cut p99 latency 3.5x with a ring buffer redesign",
        timestamp: "3h ago",
      },
    ],
  },
  {
    day: "Yesterday",
    entries: [
      {
        icon: GitBranch,
        title: "Refactored model versioning system",
        timestamp: "Yesterday",
      },
      {
        icon: Wrench,
        title: "Resolved a memory leak in the video decoder",
        timestamp: "Yesterday",
      },
    ],
  },
  {
    day: "This week",
    entries: [
      {
        icon: FileText,
        title: "Wrote architecture decision record on edge deployment",
        timestamp: "4 days ago",
      },
      {
        icon: Cpu,
        title: "Benchmarked Jetson Orin against Coral for edge inference",
        timestamp: "5 days ago",
      },
      {
        icon: GitCommit,
        title: "Set up CI pipeline for model regression tests",
        timestamp: "6 days ago",
      },
      {
        icon: ShieldCheck,
        title: "Added input validation for the camera calibration step",
        timestamp: "6 days ago",
      },
    ],
  },
];

export const strengths: Highlight[] = [
  {
    title: "Systems thinker",
    description:
      "Consistently chooses architecture that balances complexity against long-term maintainability.",
  },
  {
    title: "Calm under pressure",
    description:
      "Traces hard bugs methodically instead of guessing — evidenced by the CUDA memory leak fix.",
  },
  {
    title: "Writes to be understood",
    description:
      "Documents the 'why' behind decisions, not just the 'what' — see the edge-deployment ADR.",
  },
];

export const growthAreas: Highlight[] = [
  {
    title: "Delegation",
    description:
      "Tends to own end-to-end delivery solo; hasn't yet demonstrated leading a team through a build.",
  },
  {
    title: "Public speaking",
    description:
      "No evidence yet of presenting technical decisions to a non-technical audience.",
  },
];
