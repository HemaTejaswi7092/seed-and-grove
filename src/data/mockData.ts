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
import type {
  GroveProfileFields,
  FeaturedSeedCard,
  SkillSummary,
  AchievementHighlight,
} from "../types/grove";
import type { FeedPost } from "../types/feed";
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
  technologies: ["Python", "PyTorch", "CUDA", "Rust"],
  createdAt: "2026-06-08T09:00:00.000Z",
  updatedAt: "2026-07-24T12:00:00.000Z",
  progress: 78,
  // The demo account's Seed ships pre-published so the demo Grove has
  // something to show — real Seeds always start unpublished (see
  // state/seedStore.ts) and require the user to publish deliberately.
  isPublished: true,
  publishedAt: "2026-07-24T12:00:00.000Z",
  // Stage (status, above) and lifecycle are independent — this Seed is
  // mid-build (Currently Building) and still in_progress, illustrating
  // that a Seed's stage never implies its lifecycle state.
  lifecycleStatus: "in_progress",
  completedAt: null,
  repoUrl: "https://github.com/demo/visiq",
  demoUrl: "",
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

// ---------------------------------------------------------------------------
// Demo Grove content — same isDemoAccount gating as everything above. The
// authenticated display name is never sourced from here (see
// lib/displayName.ts); this only supplies the extra fields real users would
// otherwise fill in themselves via Edit Grove.
// ---------------------------------------------------------------------------

export const demoGroveProfileFields: GroveProfileFields = {
  avatarUrl: "",
  headline: "Software Engineer · AI Systems Builder",
  bio: "I build practical AI systems focused on solving real-world problems — from real-time inference to the pipelines that keep it reliable under load.",
  location: "Orlando, FL",
  availability: "Open to full-time opportunities",
  about: {
    enjoys:
      "Turning ambiguous, real-world signals into systems a machine can act on reliably.",
    interests: "Computer vision, edge inference, developer tooling.",
    direction:
      "Looking to grow into a founding or staff-level ML systems role.",
    technologies: "PyTorch, CUDA, Rust, TypeScript, Postgres.",
  },
  opportunities: {
    openToOpportunities: true,
    rolesOfInterest:
      "Computer Vision Engineer, ML Platform Engineer, Founding Engineer",
    workMode: "Remote / Hybrid",
    collaborationInterests:
      "Early-stage teams building real-time ML products.",
    contactVisible: true,
    contactEmail: "hema@seedandgrove.dev",
  },
  education: [
    {
      id: "demo-edu-1",
      institution: "University of Central Florida",
      degree: "B.S.",
      fieldOfStudy: "Computer Science",
      startYear: "2019",
      endYear: "2023",
      description: "",
    },
  ],
  experience: [
    {
      id: "demo-exp-1",
      company: "A prior startup",
      title: "ML Systems Intern",
      location: "Remote",
      startDate: "2022-05",
      endDate: "2022-08",
      currentlyWorking: false,
      description: "Shipped real-time inference pipelines.",
    },
  ],
  certifications: [],
  professionalSkills: ["PyTorch", "Rust", "TypeScript", "Postgres"],
  workAuthorization: "U.S. Citizen",
  requiresSponsorship: false,
  preferredJobTypes: ["full_time"],
  preferredLocations: ["Orlando, FL", "Remote"],
  availabilityDate: "",
  yearsOfExperience: "3-5 years",
  resumeUrl: "",
  resumeVisible: false,
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
  websiteUrl: "",
};

export const demoFeaturedSeeds: FeaturedSeedCard[] = [
  {
    id: DEMO_SEED_ID,
    title: DEMO_SEED.title,
    description: DEMO_SEED.description,
    status: DEMO_SEED.status,
    progress: DEMO_SEED.progress,
    lifecycleStatus: DEMO_SEED.lifecycleStatus,
    technologies: DEMO_SEED.technologies,
    relatedAchievements: demoEvidenceFeed.map((item) => ({
      id: item.id,
      title: item.summary,
    })),
    repoUrl: DEMO_SEED.repoUrl || null,
    demoUrl: DEMO_SEED.demoUrl || null,
  },
];

export const demoSkillSummaries: SkillSummary[] = Array.from(
  demoEvidenceFeed
    .reduce((map, item) => {
      const existing = map.get(item.skill);
      const supporting = { title: item.summary, seedTitle: DEMO_SEED.title };
      if (existing) {
        existing.achievementCount += 1;
        existing.supportingAchievements.push(supporting);
      } else {
        map.set(item.skill, {
          skill: item.skill,
          achievementCount: 1,
          supportingAchievements: [supporting],
        });
      }
      return map;
    }, new Map<string, SkillSummary>())
    .values(),
).sort((a, b) => b.achievementCount - a.achievementCount);

export const demoAchievementHighlights: AchievementHighlight[] = demoEvidenceFeed.map(
  (item) => ({
    id: item.id,
    seedId: DEMO_SEED_ID,
    seedTitle: DEMO_SEED.title,
    title: item.summary,
    shortDescription: item.summary,
    achievementType: "milestone",
    skillsDemonstrated: [item.skill],
    technologiesUsed: DEMO_SEED.technologies,
    candidateContribution: item.summary,
    outcomeOrImpact: "",
    proofUrl: null,
    proofLabel: null,
    relevantRoles: [],
    date: item.timestamp,
  }),
);

// ---------------------------------------------------------------------------
// Demo Dashboard feed — same isDemoAccount gating as everything above, and
// never written to the real feed_posts table (Dashboard.tsx renders this
// array directly for the demo account instead of calling feedStore.ts).
// author_name is deliberately blank here: the authenticated display name
// always comes from the real Supabase profile, never mock data (same rule
// as the rest of this file) — Dashboard.tsx fills it in at render time.
// ---------------------------------------------------------------------------

export const demoFeedPosts: FeedPost[] = [
  {
    id: "demo-post-4",
    user_id: "demo",
    seed_id: DEMO_SEED_ID,
    evidence_id: null,
    post_type: "evidence_shared",
    caption:
      "Cut inference latency 3.5x by redesigning the frame queue as a lock-free ring buffer.",
    author_name: "",
    project_title: "VISIQ",
    achievement_title: null,
    evidence_summary:
      "Cut p99 inference latency 3.5x via a lock-free ring buffer redesign.",
    skills: ["Performance Engineering"],
    visibility: "public",
    created_at: "2026-07-24T09:00:00.000Z",
    updated_at: "2026-07-24T09:00:00.000Z",
  },
  {
    id: "demo-post-3",
    user_id: "demo",
    seed_id: DEMO_SEED_ID,
    evidence_id: null,
    post_type: "evidence_shared",
    caption:
      "Finally traced that memory leak — turned out to be unreleased CUDA buffers in the async decode path.",
    author_name: "",
    project_title: "VISIQ",
    achievement_title: null,
    evidence_summary:
      "Traced and fixed a CUDA memory leak in the async decode path.",
    skills: ["Debugging Under Pressure"],
    visibility: "public",
    created_at: "2026-07-24T08:00:00.000Z",
    updated_at: "2026-07-24T08:00:00.000Z",
  },
  {
    id: "demo-post-2",
    user_id: "demo",
    seed_id: DEMO_SEED_ID,
    evidence_id: null,
    post_type: "milestone_completed",
    caption:
      "Chose edge deployment over cloud inference after modeling the latency and cost tradeoffs — written up as an ADR.",
    author_name: "",
    project_title: "VISIQ",
    achievement_title: null,
    evidence_summary:
      "Chose edge deployment over cloud inference after modeling latency and cost tradeoffs.",
    skills: ["Systems Design", "Technical Writing"],
    visibility: "public",
    created_at: "2026-07-23T09:00:00.000Z",
    updated_at: "2026-07-23T09:00:00.000Z",
  },
  {
    id: "demo-post-1",
    user_id: "demo",
    seed_id: DEMO_SEED_ID,
    evidence_id: null,
    post_type: "project_started",
    caption: "Started building VISIQ — real-time defect detection for manufacturing.",
    author_name: "",
    project_title: "VISIQ",
    achievement_title: null,
    evidence_summary: null,
    skills: [],
    visibility: "public",
    created_at: "2026-06-08T09:00:00.000Z",
    updated_at: "2026-06-08T09:00:00.000Z",
  },
];
